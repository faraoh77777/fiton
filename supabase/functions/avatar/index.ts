// FITON 아바타 만들기: 기본 체형 사진 + 얼굴 사진 1장 → 그 체형 몸에 얼굴을 입힌 전신 그림
// 이미지 생성은 FASHN API(model-swap + face_reference)를 쓴다. 키(FASHN_API_KEY)는 Supabase Secrets 에만 둔다.
// 2026-11-19 작성. 요청: { action:"start", method:"base", device, base, face(data URI) } → { taskId }
//                      { action:"status", taskId } → { status:"processing" | "success"(image, mime) | "failed"(error) }
// 바탕 체형 사진과 문장은 서버에 고정한다(앱이 임의 그림·문장을 보내 다른 용도로 쓰지 못하게).
import { createClient } from "npm:@supabase/supabase-js@2";

const FA_KEY = (Deno.env.get("FASHN_API_KEY") ?? "").trim().replace(/^Bearer\s+/i, "");
const FA_BASE = "https://api.fashn.ai";
const RES = Deno.env.get("AVATAR_RESOLUTION") ?? "1k"; // 1k | 2k | 4k
const MODE = Deno.env.get("AVATAR_MODE") ?? "balanced"; // fast | balanced | quality
const DEV_LIMIT = Number(Deno.env.get("AVATAR_DAILY_LIMIT") ?? "2"); // 기기당 하루 만들기 횟수
const GLOBAL_LIMIT = Number(Deno.env.get("AVATAR_GLOBAL_DAILY_LIMIT") ?? "50"); // 하루 전체 횟수
// 바탕 체형 사진은 Supabase Storage 공개 버킷 fiton-assets 에 둔다(저장소가 비공개라 github.io 주소는 없음). 버킷은 avatar_schema.sql 이 만든다.
const ASSET = (Deno.env.get("AVATAR_ASSET_BASE") ?? ((Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "") + "/storage/v1/object/public/fiton-assets/")).replace(/\/?$/, "/");
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://faraoh77777.github.io,http://127.0.0.1:8765,http://localhost:8765,http://127.0.0.1:8777,http://localhost:8777,http://127.0.0.1:8770,http://localhost:8770").split(",");
const MAX_FACE_B64 = 1_500_000; // 얼굴 사진 base64 길이 상한(약 1MB, 앱은 640px JPEG 로 보낸다)

/* 기본 체형 목록. 앱(pc.js avMakeBases)과 id 가 같아야 한다. 체형을 늘리면 여기에 한 줄씩 추가한다 */
const BASES: Record<string, { file: string; who: string }> = {
  female: { file: "assets/avatar_default.jpg", who: "a young Korean woman" },
  male: { file: "assets/avatar_male.jpg", who: "a young Korean man" },
};
function swapPrompt(who: string) {
  return "Full-body studio photo of " + who + ". Use the face and the hairstyle of the face reference person: same face shape, eyes, nose, mouth, skin tone and hair. " +
    "Keep the body shape, standing pose, arms, outfit and the plain background of the model image exactly as they are. Natural calm expression, looking at the camera. Sharp, photorealistic. No accessories, no jewelry, no hat, no glasses.";
}

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
function bytesToB64(u: Uint8Array) {
  let s = ""; const step = 0x8000;
  for (let i = 0; i < u.length; i += step) s += String.fromCharCode(...u.subarray(i, i + step));
  return btoa(s);
}
// deno-lint-ignore no-explicit-any
async function fa(method: string, path: string, body?: unknown): Promise<any> {
  const r = await fetch(FA_BASE + path, {
    method, headers: { Authorization: "Bearer " + FA_KEY, "Content-Type": "application/json", "User-Agent": "fiton-avatar/1" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  // deno-lint-ignore no-explicit-any
  let d: any = null;
  try { d = JSON.parse(text); } catch { /* 아래에서 오류로 처리 */ }
  if (!r.ok || !d) throw new Error("fashn " + r.status + " " + text.slice(0, 300));
  return d;
}

async function status(taskId: string) {
  const q = await fa("GET", "/v1/status/" + encodeURIComponent(taskId));
  const st = String(q.status ?? "");
  if (st === "completed") {
    const o = q.output, url = Array.isArray(o) ? o[0] : o?.images?.[0];
    if (!url) throw new Error("fashn no output " + JSON.stringify(q).slice(0, 300));
    const img = await fetch(String(url), { headers: { "User-Agent": "Mozilla/5.0 fiton-avatar/1" } }); // User-Agent 없으면 403
    if (!img.ok) throw new Error("fashn download " + img.status);
    const mime = img.headers.get("content-type")?.split(";")[0] || "image/png";
    return { status: "success", image: bytesToB64(new Uint8Array(await img.arrayBuffer())), mime };
  }
  if (st === "failed") {
    console.error("fashn failed:", JSON.stringify(q.error ?? "").slice(0, 300));
    return { status: "failed", error: "AI 가 그림을 만들지 못했어요. 얼굴이 더 크고 또렷한 사진으로 다시 해 보세요." };
  }
  return { status: "processing" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST 만 가능합니다." });
  if (!FA_KEY) return json(req, 500, { error: "서버에 아바타 생성 키가 설정되지 않았습니다." });

  let body: { action?: string; taskId?: string; device?: string; method?: string; base?: string; face?: string };
  try { body = await req.json(); } catch { return json(req, 400, { error: "요청 형식이 올바르지 않습니다." }); }

  if (body.action === "status") {
    const tid = String(body.taskId ?? "");
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(tid)) return json(req, 400, { error: "작업 번호가 올바르지 않습니다." });
    try { return json(req, 200, await status(tid)); }
    catch (e) { console.error("status failed:", (e as Error).message); return json(req, 502, { error: "진행 상태를 확인하지 못했습니다.", retry: true }); }
  }
  if (body.action !== "start") return json(req, 400, { error: "요청 종류가 올바르지 않습니다." });

  const device = String(body.device ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(device)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
  // 방법 2(내 전신 사진을 AI 로 정리)는 무엇을 바꿀지 정해지지 않아 아직 받지 않는다. 지금 앱은 전신 사진을 서버로 보내지 않는다.
  if (body.method !== "base") return json(req, 400, { error: "아직 준비 중인 방법입니다." });
  const base = BASES[String(body.base ?? "")];
  if (!base) return json(req, 400, { error: "기본 체형이 올바르지 않습니다." });
  const fm = String(body.face ?? "").match(/^data:image\/(jpeg|png);base64,([A-Za-z0-9+/=]+)$/);
  if (!fm || fm[2].length > MAX_FACE_B64) return json(req, 400, { error: "얼굴 사진이 올바르지 않거나 너무 큽니다." });

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const take = await sb.rpc("avatar_take", { p_device: device, p_dev_limit: DEV_LIMIT, p_global_limit: GLOBAL_LIMIT });
  if (take.error) { console.error("avatar_take:", take.error.message); return json(req, 500, { error: "이용 횟수를 확인하지 못했습니다." }); }
  if (take.data !== true) return json(req, 429, { error: "오늘 아바타 만들기 횟수를 모두 썼어요. 내일 다시 해 주세요." });
  try {
    const d = await fa("POST", "/v1/run", {
      model_name: "model-swap",
      inputs: { model_image: ASSET + base.file, face_reference: "data:image/" + fm[1] + ";base64," + fm[2], face_reference_mode: "match_reference", prompt: swapPrompt(base.who), resolution: RES, generation_mode: MODE, output_format: "png" },
    });
    if (!d.id) throw new Error("fashn no id " + JSON.stringify(d).slice(0, 200));
    return json(req, 200, { taskId: String(d.id) });
  } catch (e) {
    console.error("avatar start failed:", (e as Error).message);
    await sb.rpc("avatar_refund", { p_device: device });
    return json(req, 502, { error: "아바타 만들기를 접수하지 못했습니다. 잠시 뒤 다시 해 주세요." });
  }
});
