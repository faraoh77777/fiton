// FITON 상세 이미지 읽기: 쇼핑몰 상세 캡처 → 소재·신축성(JSON). sizeread 와 같은 구조. Claude(Anthropic API)로 읽는다.
// 키(ANTHROPIC_API_KEY)는 Supabase Secrets 에만 둔다. 앱은 이 함수가 돌려준 글을 aifit/size-extract.js 로 한 번 더 걸러 쓴다.
// 지시문(EXTRACT_PROMPT)은 aifit/size-extract.js 와 같아야 한다. 일부러 앱에서 받지 않고 여기에 둔다(앱이 임의 지시문을 보내 이 키를 마음대로 쓰지 못하게).
const KEY = (Deno.env.get("ANTHROPIC_API_KEY") ?? "").trim();
const MODEL = Deno.env.get("DETAILREAD_MODEL") ?? "claude-sonnet-5-5";
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://faraoh77777.github.io,http://127.0.0.1:8765,http://localhost:8765,http://127.0.0.1:8777,http://localhost:8777,http://127.0.0.1:8770,http://localhost:8770").split(",");
const MAX_B64 = 5_000_000; // 캡처 base64 길이 상한(약 3.7MB)
const DAY_LIMIT = Number(Deno.env.get("DETAILREAD_DAILY_LIMIT") ?? "30"); // 기기당 하루 읽기 횟수(이 함수 인스턴스 기준 임시 제한)
const GLOBAL_LIMIT = Number(Deno.env.get("DETAILREAD_GLOBAL_DAILY_LIMIT") ?? "300");

const EXTRACT_PROMPT = `이 이미지는 쇼핑몰 상품 상세 페이지 캡처입니다. 옷의 소재·신축성 정보만 추출하세요.

[찾을 것]
- 소재/혼용률/겉감/원단 (예: 면 98% 폴리우레탄 2%)
- 신축성 표기 (신축성 있음/없음, 스트레치, 늘어남 정도), 원단 종류(니트, 데님, 저지, 울, 우븐 등)

[규칙]
- 이미지에 보이는 글자만 그대로 옮기세요. 추측하지 마세요. 못 찾으면 빈 문자열.
- 사이즈표, 가격, 리뷰, 광고 문구는 무시하세요.
- fabric 은 다음 중 하나: "stretch"(스판덱스·엘라스탄·폴리우레탄 2% 이상 또는 신축성 많음), "knit"(니트·스웨터 소재), "denim"(데님·청), "normal"(그 외 일반 직조), "unknown"(정보 없음).

[출력: JSON만, 다른 말 없이]
{ "material": "면 98% 폴리우레탄 2%", "stretch": "신축성 있음", "fabric": "stretch" }`;

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}

// 임시 사용량 제한(메모리). 인스턴스가 새로 뜨면 초기화되므로 비용 보호용으로는 약하다 — 출시 전 tryon 처럼 DB 로 옮길 것.
const used = new Map<string, number>();
let usedDay = "", usedTotal = 0;
function take(device: string) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== usedDay) { used.clear(); usedTotal = 0; usedDay = day; }
  if (usedTotal >= GLOBAL_LIMIT || (used.get(device) ?? 0) >= DAY_LIMIT) return false;
  used.set(device, (used.get(device) ?? 0) + 1); usedTotal++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST 만 가능합니다." });
  if (!KEY) return json(req, 500, { error: "서버에 상세 이미지 읽기 키가 설정되지 않았습니다." });
  let body: { device?: string; image?: string };
  try { body = await req.json(); } catch { return json(req, 400, { error: "요청 형식이 올바르지 않습니다." }); }
  const device = String(body.device ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(device)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
  const m = String(body.image ?? "").match(/^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/);
  if (!m || m[2].length > MAX_B64) return json(req, 400, { error: "캡처는 JPG 또는 PNG 이고 약 3.5MB 이하여야 합니다." });
  if (!take(device)) return json(req, 429, { error: "오늘 상세 이미지 읽기 횟수를 모두 썼습니다. 직접 입력하거나 내일 다시 해 주세요." });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: MODEL, max_tokens: 2000,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } },
          { type: "text", text: EXTRACT_PROMPT },
        ] }],
      }),
    });
    if (!r.ok) { console.error("anthropic", r.status, (await r.text()).slice(0, 300)); return json(req, 502, { error: "상세 이미지를 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요." }); }
    const j = await r.json();
    const text = (j.content ?? []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("");
    return json(req, 200, { text });
  } catch (e) {
    console.error("sizeread failed:", (e as Error).message);
    return json(req, 502, { error: "상세 이미지를 읽지 못했습니다. 잠시 뒤 다시 시도해 주세요." });
  }
});
