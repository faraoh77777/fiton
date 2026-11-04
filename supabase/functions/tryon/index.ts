// AI FIT 입혀 보기: 기본 캐릭터 + 상품 사진 → 그 옷을 입은 모습
// 이미지 생성은 Kling API(Omni Image)를 쓴다. 키(KLING_API_KEY)는 Supabase Secrets 에만 둔다.
import { createClient } from "npm:@supabase/supabase-js@2";

const KL_KEY = (Deno.env.get("KLING_API_KEY") ?? "").trim().replace(/^Bearer\s+/i, "");
const KL_MODEL = Deno.env.get("KLING_IMAGE_MODEL") ?? "kling-v3-omni";
const KL_BASE = "https://api-singapore.klingai.com";
const KL_PROMPT_MAX = 2500; // Kling 문장 길이 상한
const AVATAR_URL = Deno.env.get("AVATAR_URL") ?? "https://faraoh77777.github.io/work-fit-test/assets/avatar_default.jpg";
const AVATAR_URL_MALE = Deno.env.get("AVATAR_URL_MALE") ?? "https://faraoh77777.github.io/work-fit-test/assets/avatar_male.jpg";
const DEV_LIMIT = Number(Deno.env.get("DAILY_LIMIT") ?? "5");
const GLOBAL_LIMIT = Number(Deno.env.get("GLOBAL_DAILY_LIMIT") ?? "100");
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://faraoh77777.github.io,http://127.0.0.1:8765,http://localhost:8765").split(",");
const MAX_B64 = 7_000_000; // 상품 사진 base64 길이 상한(약 5MB)
const MAX_AV_B64 = 4_000_000; // 내 아바타 base64 길이 상한(약 3MB)

const PROMPTS: Record<string, string> = {
  top: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of a top. Edit image 1 so she wears exactly the top shown in image 2 (same color, collar, pattern, sleeve length and fit) instead of her current top.",
  bottom: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of bottoms. Edit image 1 so she wears exactly the bottoms shown in image 2 (same color, length, cut and fit) instead of her current bottoms.",
  dress: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of a dress. Edit image 1 so she wears exactly the dress shown in image 2 (same color, neckline, pattern, sleeve length, hem length and fit) instead of her current top and bottoms.",
  shoe: "Image 1 is a full-body photo of a woman standing barefoot. Image 2 is a product photo of shoes. Edit image 1 so she wears exactly the shoes shown in image 2 (same color and design).",
};
const KEEP = " Keep her face, hair, pose, body proportions, the other clothing, the plain gray background and the framing unchanged. Photorealistic result. Do not add text, logos or accessories.";

/* 2026-11-04 사용자 결정: 사진 없이 고를 수 있는 신발 종류(많이 쓰는 것 기본 세팅). 옷장에 사진으로 등록한 신발(image 3)이 있으면 그게 우선 */
const SHOE_TYPES: Record<string, { female: string; male: string }> = {
  pumps: { female: "simple classic black leather low-heel pumps with no buckle or hardware", male: "simple classic black leather dress shoes (plain black oxfords)" },
  sneakers: { female: "simple white low-top canvas sneakers", male: "simple white low-top canvas sneakers" },
  loafers: { female: "simple black leather loafers", male: "simple black leather loafers" },
  sandals: { female: "simple black strappy flat sandals", male: "simple black leather sport sandals" },
  boots: { female: "simple black leather ankle boots", male: "simple black leather boots" },
};

/* 내 아바타를 쓸 때: 몸은 한 픽셀도 바꾸지 말고 옷만 바꾼다(핏 확인용이라 체형이 달라지면 안 된다) */
const KEEP_BODY = " This is a fit-check: the person's body must stay IDENTICAL to image 1. Do NOT slim, widen, lengthen, reshape or retouch the body. Keep exactly the same height, head size, shoulder width, bust, waist, hip and thigh widths, arm and leg thickness and length, body silhouette, skin, face, hair, pose, hands, the plain background and the framing, pixel-aligned with image 1. Change ONLY the clothing item named above, and render it realistically at its true cut and fit on that unchanged body (tight where it is tight, loose where it is loose, do not tailor it to flatter the body). Keep every other garment as it is. Photorealistic result. Do not add text, logos or accessories.";

function toMale(t: string, male: boolean) {
  return male ? t.replace(/a woman/g, "a man").replace(/\bshe\b/g, "he").replace(/\bher\b/g, "his") : t;
}

/* 앱이 계산한 여유(옷 둘레 − 몸 둘레, cm)를 영어 핏 설명으로 바꾼다. 숫자만 받으므로 임의 문장이 프롬프트에 들어갈 수 없다 */
const FIT_AREAS: Record<string, string> = { chest: "bust/chest", waist: "waist", hip: "hips", thigh: "thighs" };
function fitWord(e: number) {
  if (e < -4) return "much too small: the fabric is stretched taut, clinging and straining with visible tension wrinkles, riding up, and cannot close or sit properly";
  if (e < 0) return "tight: clinging to the body with slight stretch lines";
  if (e < 4) return "snug and close to the body";
  if (e < 10) return "a regular comfortable fit with light drape";
  if (e < 18) return "relaxed and loose with visible folds and extra fabric";
  return "oversized and baggy: much too big, the fabric hangs loosely in deep folds";
}
/* 길이 정보(앱이 계산한 숫자만 받음): 어깨선·소매·밑위·바지 기장(cm 차이), 총장(밑단 높이/키 비율) */
function lenNum(len: Record<string, unknown>, k: string, lo: number, hi: number): number | null {
  if (len[k] == null) return null;
  const v = Number(len[k]);
  return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null;
}
function lenText(fit: unknown, cat: string): string[] {
  const len = (fit as { len?: Record<string, unknown> }).len;
  if (!len || typeof len !== "object") return [];
  const out: string[] = [];
  if (cat === "top" || cat === "dress") {
    const sh = lenNum(len, "shoulder", -20, 30);
    if (sh !== null) {
      if (sh <= -2) out.push("the shoulder seams sit inside her shoulder points, pulling tight across the upper back and shoulders");
      else if (sh >= 4) out.push("the shoulder seams drop about " + Math.round(sh) + " cm down onto her upper arms");
      else if (sh >= 1) out.push("the shoulder seams sit slightly past her shoulder points");
    }
    const sl = lenNum(len, "sleeve", -60, 40);
    const sp = lenNum(len, "sleevePos", 0, 2);
    /* 팔길이의 85% 미만 = 원래 짧게 만든 소매(반팔·7부 등): '짧다'고 하지 않고 이 몸에서 끝나는 위치만 알린다(앱과 같은 기준) */
    if (sp !== null && sp < 0.85) {
      if (sp < 0.15) out.push("the cap sleeves cover only the tops of her shoulders");
      else if (sp < 0.4) out.push("the short sleeves end on her upper arms");
      else if (sp < 0.62) out.push("the sleeves end around her elbows");
      else out.push("the sleeves end on her forearms");
    } else if (sl !== null) {
      if (sl < -3) out.push("the sleeves end about " + Math.round(-sl) + " cm above her wrists, exposing the wrists");
      else if (sl >= 5) out.push("the sleeves are clearly too long: the cuffs hang about " + Math.round(sl) + " cm past her wrists and cover her hands, and the extra sleeve fabric bunches in folds above the cuffs");
      else if (sl >= 1) out.push("the sleeves end slightly past her wrists");
      else out.push("the sleeves end at her wrists");
    }
  }
  const hem = lenNum(len, "hem", -0.2, 0.9);
  if (hem !== null && cat === "top") {
    if (hem >= 0.58) out.push("the hem is cropped, ending above her waist");
    else if (hem >= 0.52) out.push("the hem ends at her waistline");
    else if (hem >= 0.47) out.push("the hem ends at her upper hips");
    else if (hem >= 0.42) out.push("the hem is long and covers her hips completely");
    else out.push("the hem is clearly too long: it reaches down to her mid-thighs, halfway between her hips and her knees");
  }
  if (hem !== null && cat === "dress") {
    if (hem >= 0.50) out.push("the hem is a mini length at her upper thighs");
    else if (hem >= 0.40) out.push("the hem ends above her knees");
    else if (hem >= 0.30) out.push("the hem ends at her knees");
    else if (hem >= 0.15) out.push("the hem is midi length at her calves");
    else out.push("the hem is maxi length near her ankles");
  }
  if (cat === "bottom") {
    const ri = lenNum(len, "rise", -20, 20);
    if (ri !== null) {
      if (ri < -4) out.push("the rise is short so the waistband sits low on her hips");
      else if (ri < -2) out.push("the rise is slightly short so the waistband sits a little low");
      else if (ri > 4) out.push("the rise is deep so the waistband sits high and the crotch hangs low");
      else if (ri > 2) out.push("the rise is slightly deep so the waistband sits a little high");
    }
    const ins = lenNum(len, "inseam", -90, 30);
    const ip = lenNum(len, "inseamPos", 0, 2);
    /* 다리 안쪽 길이보다 12cm 넘게 짧음 = 원래 짧게 만든 바지(반바지·7부 등): 끝나는 위치만 알린다(앱과 같은 기준) */
    if (ins !== null && ins < -12 && ip !== null) {
      if (ip < 0.2) out.push("the shorts end high on her upper thighs");
      else if (ip < 0.35) out.push("the shorts end at her mid-thighs");
      else if (ip < 0.5) out.push("the legs end around her knees");
      else if (ip < 0.7) out.push("the legs end just below her knees");
      else out.push("the legs end on her calves");
    } else if (ins !== null) {
      if (ins >= 3) out.push("the legs are too long: the hems pile up and drag on the floor over her shoes");
      else if (ins >= 0) out.push("the hems fall over the tops of her feet with a slight break");
      else if (ins >= -4) out.push("the hems end between her ankle bones and the tops of her feet");
      else if (ins >= -12) out.push("the legs are short and end above her ankles, showing the ankles");
      else out.push("the legs are much too short, ending up on her calves");
    }
    /* 바지 기장 '내 몸에 맞춤'(앱이 줄인 길이 cm 숫자만 보냄): 위 기장 문장은 줄인 뒤 기준이고, 밑단 위치 말고는 아무것도 바꾸지 않게 한다 */
    const hm = ins !== null ? lenNum(len, "hemmed", 0, 60) : null;
    if (hm !== null && hm > 0) out.push("these trousers have been hemmed about " + Math.round(hm) + " cm shorter to fit her legs: only the hem position changes, while the leg width, hem opening width, silhouette, color, wash and fabric texture stay exactly as in image 2, finished with a clean natural hem (not cut off or frayed)");
    /* 총장(허리~밑단)만 있는 하의(스커트·총장만 적힌 바지): 인심과 같은 기준, 스커트에도 맞게 'hem'으로 말한다 */
    const bl = ins === null ? lenNum(len, "length", -120, 40) : null;
    const bp = lenNum(len, "lengthPos", -1, 2);
    if (bl !== null && bl < -12 && bp !== null) {
      if (bp < 0.2) out.push("the hem ends high on her upper thighs");
      else if (bp < 0.35) out.push("the hem ends at her mid-thighs");
      else if (bp < 0.5) out.push("the hem ends around her knees");
      else if (bp < 0.7) out.push("the hem ends just below her knees");
      else out.push("the hem ends on her calves");
    } else if (bl !== null) {
      if (bl >= 3) out.push("the garment is too long: the hem piles up and drags on the floor over her shoes");
      else if (bl >= 0) out.push("the hem falls over the tops of her feet");
      else if (bl >= -4) out.push("the hem ends between her ankle bones and the tops of her feet");
      else out.push("the hem ends above her ankles, showing the ankles");
    }
  }
  return out;
}
/* 원단(앱 소재 코드 중 정해진 값만 받음): 신축·뻣뻣함에 따라 작을 때·클 때 모습이 달라진다.
   'normal'(일반)은 등록 기본값이라 실제 소재를 모르는 것으로 보고 아무 문장도 넣지 않는다 */
const FABRIC_EN: Record<string, string> = {
  stretch: "stretch-woven fabric that follows the body smoothly",
  knit: "soft knit with visible stitches that stretches over the body",
  denim: "rigid heavyweight denim that holds its shape",
};
const FABRIC_STRETCHY = new Set(["stretch", "knit"]);
const FABRIC_STIFF = new Set(["denim"]);
function fabricText(fit: unknown): string {
  const code = String((fit as { fabric?: unknown }).fabric ?? "");
  if (!Object.prototype.hasOwnProperty.call(FABRIC_EN, code)) return "";
  const ease = (fit as { ease?: Record<string, unknown> }).ease;
  let minEase: number | null = null; /* 가장 꼭 끼는 부위 기준: 하나라도 작으면 '작음', 전부 14cm 이상 남으면 '큼' */
  if (ease && typeof ease === "object") for (const v of Object.values(ease)) { const n = Number(v); if (isFinite(n) && (minEase === null || n < minEase)) minEase = n; }
  let t = " The garment is made of " + FABRIC_EN[code] + ".";
  if (minEase !== null && minEase < 0) t += FABRIC_STRETCHY.has(code) ? " Because it stretches, the too-small size stretches over her body and clings tightly, the fabric pulled thin and smooth rather than wrinkled." : " Because it does not stretch, the too-small size strains with sharp tension wrinkles and cannot sit flat.";
  else if (minEase !== null && minEase >= 14) t += FABRIC_STIFF.has(code) ? " The oversized fabric stands away from her body stiffly in boxy angular folds." : " The oversized fabric hangs loosely in soft folds.";
  return t;
}
function fitText(fit: unknown, cat: string) {
  if (!fit || typeof fit !== "object") return "";
  const ease = (fit as { ease?: Record<string, unknown> }).ease;
  const order = cat === "bottom" ? ["waist", "hip", "thigh"] : cat === "dress" ? ["chest", "waist", "hip"] : ["chest"];
  const out: string[] = [];
  if (ease && typeof ease === "object") for (const k of order) {
    const v = Number(ease[k]);
    if (ease[k] == null || !isFinite(v)) continue;
    out.push("at her " + FIT_AREAS[k] + " it is " + fitWord(Math.max(-30, Math.min(50, v))));
  }
  out.push(...lenText(fit, cat));
  return out.length ? " FIT OF THE GARMENT (the garment's real size relative to her body, show it visibly in the image): " + out.join("; ") + ". Draw the garment's size honestly, scaled to its true size relative to her unchanged body, never resized to flatter her." + fabricText(fit) : fabricText(fit);
}

/* 옷 성별(앱이 보낸 값 중 정해진 3가지만 받음): 남자가 여성용 옷을 입는 등 사람과 다를 때만 원래 재단을 유지하라고 알린다.
   toMale 이 바꾸지 않도록 'a woman' 같은 표현은 쓰지 않는다(women's/men's 는 그대로 남는다) */
/* 옷 이름(앱이 보낸 상품 이름): 상품 사진이 모델이 여러 옷을 입은 코디 사진일 때 그 옷만 가져오게 한다.
   원래 입던 같은 종류의 옷은 완전히 없애고, 겉옷이면 상품 사진 속 안쪽 상의도 같이 입힌다(2026-11-03 Kling 시험 2차로 확인).
   이름은 toMale 이 바꾸지 않도록 자리표시(@@NAME@@)로 넣고 나중에 채운다 */
const SLOT: Record<string, string> = { top: "top", bottom: "bottoms", dress: "top and bottoms", shoe: "shoes" };
function cleanName(v: unknown) {
  return String(v ?? "").replace(/[\u0000-\u001f\u007f"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}
function nameText(cat: string, name: string) {
  if (!name) return "";
  return " The item to put on is the product named \"@@NAME@@\". Image 2 may be a photo of a model wearing a full outfit: take ONLY the @@NAME@@ from image 2 and ignore the face, hair and body of the model in image 2 and every other item of clothing and the shoes there" +
    (cat === "top" ? ", except that if the @@NAME@@ is an outer layer (a coat, jacket, cardigan or similar), she also wears the inner top worn under it in image 2" : "") +
    ". Completely remove her current " + SLOT[cat] + ": no part of it may remain visible (no sleeve, collar, strap, hem or waistband showing).";
}
/* 코디 사진의 다른 옷이 같이 들어오지 않게: 상의면 원래 하의, 하의면 원래 상의, 신발이 아니면 원래 발(신발 또는 맨발)을 그대로 둔다
   (2026-11-03 Kling 서버 시험: 트렌치만 보냈는데 기본 캐릭터 반바지가 코디의 검정 슬랙스로 바뀜). 대문자 She/Her 는 toMale 이 못 바꾸므로 쓰지 않는다
   발: 기본 캐릭터(남녀 모두 맨발)는 맨발이라고 단정하고, 'shoes from image 2' 같은 신발 언급은 오히려 신발을 불러와서 뺀다
   (같은 날 4차 시험: 맨발 기본 캐릭터에 코디의 검정 로퍼가 들어감)
   2026-11-03 사용자 결정: 신발은 기본 캐릭터·내 아바타 모두 기본 검정 구두, 사용자가 신발을 고르면(image 3) 그 신발
   2026-11-04 사용자 결정: 사진 없이 신발 종류(운동화·로퍼·샌들·부츠 등)도 고를 수 있게, 둘 다 없으면 기본 구두 */
function keepOthersText(cat: string, male: boolean, shoeName: string | null, shoeType: string | null) {
  const typeDesc = (SHOE_TYPES[shoeType ?? ""] ?? SHOE_TYPES.pumps)[male ? "male" : "female"];
  const feet = shoeName !== null
    ? " On her feet she wears exactly the shoes" + (shoeName ? " (" + shoeName + ")" : "") + " shown in image 3 (same color and design); take only the shoes from image 3, nothing else."
    : " On her feet she wears " + typeDesc + "; these are NOT the shoes from image 2, do not copy any shoes from image 2.";
  /* 2026-11-04 6차 시험: 신발 안 고름(기본 구두)인데 코디 사진의 슬랙스+로퍼를 입고 손을 주머니에 넣음 → 하의 유지·손 유지 문장 강화(사용자 결정) */
  const hands = " Her arms and hands stay exactly as in image 1; do not put her hands in pockets.";
  if (cat === "top") return " Keep her current bottoms from image 1 exactly as they are (same type, length and color); do not take the trousers, skirt, shorts or shoes from image 2." + feet + hands;
  if (cat === "bottom") return " Keep her current top from image 1 exactly as it is; do not take any top or outer layer from image 2." + feet + hands;
  if (cat === "dress") return feet + hands;
  return "";
}

function cutText(garmentGender: unknown, male: boolean, cat: string) {
  const g = String(garmentGender ?? "");
  if (cat === "shoe" || !/^(male|female)$/.test(g) || (g === "male") === male) return "";
  return g === "female"
    ? " GARMENT CUT: this is a women's garment with women's sizing and tailoring (narrower shoulders, shaped waist, women's proportions). Keep its original women's cut as it is on this body; do not re-tailor it into a men's style."
    : " GARMENT CUT: this is a men's garment with men's sizing and tailoring (wider shoulders, straight boxy body, men's proportions). Keep its original men's cut as it is on this body; do not re-tailor it into a women's style.";
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

function b64ToBytes(b64: string) {
  const bin = atob(b64), u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}
function bytesToB64(u: Uint8Array) {
  let s = ""; const step = 0x8000;
  for (let i = 0; i < u.length; i += step) s += String.fromCharCode(...u.subarray(i, i + step));
  return btoa(s);
}

/* ---------------- Kling ---------------- */
async function kl(path: string, init: RequestInit = {}) {
  const r = await fetch(KL_BASE + path, { ...init, headers: { ...(init.headers ?? {}), Authorization: "Bearer " + KL_KEY } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.code !== 0) throw new Error("kling " + path + " " + r.status + " " + JSON.stringify(d).slice(0, 300));
  return d.data ?? {};
}
/* 문장 안의 'image 1/2' 를 Kling 의 그림 참조(<<<image_1>>>)로 바꾸고, 길이 상한을 넘으면 몸 유지 문장을 짧은 것으로, 그래도 넘으면 문장 끝에서 자른다 */
const KEEP_BODY_SHORT = " This is a fit-check: keep the person's body IDENTICAL to image 1 (same height, proportions, shoulder, bust, waist, hip, arm and leg widths and lengths, skin, face, hair, pose, hands, background and framing). Do NOT slim or reshape the body. Change ONLY the clothing item named above, at its true cut and fit. Keep every other garment. Photorealistic. No text, logos or accessories.";
function klPrompt(build: (keepBody: string) => string) {
  const conv = (t: string) => t.replace(/\b[Ii]mage ([123])\b/g, "<<<image_$1>>>");
  let t = conv(build(KEEP_BODY));
  if (t.length > KL_PROMPT_MAX) t = conv(build(KEEP_BODY_SHORT));
  if (t.length > KL_PROMPT_MAX) { t = t.slice(0, KL_PROMPT_MAX); const i = t.lastIndexOf(". "); if (i > 0) t = t.slice(0, i + 1); }
  return t;
}
/* 접수: 사진 두 장(base64)과 문장을 보내고 번호(task_id)를 돌려준다. 오래 붙잡지 않는다 */
async function submitKling(male: boolean, cat: string, garmentBytes: Uint8Array, myAvatar?: Uint8Array, fit?: unknown, garmentGender?: unknown, name = "", shoe?: { bytes: Uint8Array; name: string }, shoeType: string | null = null) {
  let avBytes = myAvatar;
  if (!avBytes) { // 내 아바타가 없으면 기본 캐릭터
    const av = await fetch(male ? AVATAR_URL_MALE : AVATAR_URL);
    if (!av.ok) throw new Error("avatar");
    avBytes = new Uint8Array(await av.arrayBuffer());
  }
  const prompt = klPrompt((kb) => (toMale(PROMPTS[cat] + nameText(cat, name) + keepOthersText(cat, male, shoe ? shoe.name : null, shoeType) + fitText(fit, cat) + (myAvatar ? kb : KEEP), male) + cutText(garmentGender, male, cat)).split("@@NAME@@").join(name));
  const d = await kl("/v1/images/omni-image", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: bytesToB64(avBytes) }, { image: bytesToB64(garmentBytes) }].concat(shoe ? [{ image: bytesToB64(shoe.bytes) }] : []), resolution: "2k", n: 1, aspect_ratio: "9:16" }),
  });
  if (!d.task_id) throw new Error("kling no task_id " + JSON.stringify(d).slice(0, 200));
  return String(d.task_id);
}
/* 확인: 끝났으면 이미지를 받아 돌려주고, 아니면 진행 중/실패만 알려 준다 */
async function statusKling(taskId: string) {
  const q = await kl("/v1/images/omni-image/" + encodeURIComponent(taskId));
  const st = String(q.task_status ?? "");
  if (st === "succeed") {
    const url = q.task_result?.images?.[0]?.url;
    if (!url) throw new Error("kling no image url " + JSON.stringify(q).slice(0, 300));
    const img = await fetch(url);
    if (!img.ok) throw new Error("kling download " + img.status);
    const mime = img.headers.get("content-type")?.split(";")[0] || "image/png";
    return { status: "success", image: bytesToB64(new Uint8Array(await img.arrayBuffer())), mime };
  }
  if (st === "failed") return { status: "failed", error: String(q.task_status_msg ?? "") };
  return { status: "processing" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST 만 가능합니다." });
  if (!KL_KEY) return json(req, 500, { error: "서버에 이미지 생성 키가 설정되지 않았습니다." });

  let body: { action?: string; taskId?: string; device?: string; cat?: string; garment?: string; gender?: string; avatar?: string; fit?: unknown; garmentGender?: string; name?: string; shoe?: string; shoeName?: string; shoeType?: string };
  try { body = await req.json(); } catch { return json(req, 400, { error: "요청 형식이 올바르지 않습니다." }); }
  if (body.action === "status") {
    const tid = String(body.taskId ?? "");
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(tid)) return json(req, 400, { error: "작업 번호가 올바르지 않습니다." });
    try { return json(req, 200, await statusKling(tid)); }
    catch (e) { console.error("status failed:", (e as Error).message); return json(req, 502, { error: "진행 상태를 확인하지 못했습니다." }); }
  }
  const device = String(body.device ?? ""), cat = String(body.cat ?? "");
  let garment = String(body.garment ?? "");
  const m = garment.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
  let mime = "image/jpeg";
  if (m) { mime = m[1]; garment = m[2]; }
  if (mime === "image/webp") return json(req, 400, { error: "상품 사진은 JPG 또는 PNG 여야 합니다." }); // Kling 은 jpg·png 만 받는다
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(device)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
  if (!PROMPTS[cat]) return json(req, 400, { error: "옷 종류가 올바르지 않습니다." });
  if (!garment || garment.length > MAX_B64) return json(req, 400, { error: "상품 사진이 없거나 너무 큽니다." });
  let myAv = String(body.avatar ?? "");
  const am = myAv.match(/^data:image\/jpeg;base64,(.*)$/);
  if (am) myAv = am[1];
  if (myAv && (!am || myAv.length > MAX_AV_B64)) return json(req, 400, { error: "아바타 이미지가 올바르지 않거나 너무 큽니다." });
  // 사용자가 고른 신발(상의·하의·원피스를 입힐 때만): 없으면 기본 검정 구두
  let shoe = String(body.shoe ?? "");
  if (shoe && cat !== "shoe") {
    const sm = shoe.match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    if (!sm || sm[1].length > MAX_B64) return json(req, 400, { error: "신발 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
    shoe = sm[1];
  } else shoe = "";
  // 사진 없이 신발 종류만 고른 경우(옷장 신발 사진이 없으면 이쪽): 정해 둔 목록에 있을 때만 받는다
  const shoeType = !shoe && SHOE_TYPES[String(body.shoeType ?? "")] ? String(body.shoeType) : null;

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  // 30일이 지난 이용 기록은 지운다(개인정보처리방침의 보관 기간)
  await sb.from("tryon_usage").delete().lt("day", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10));
  const take = await sb.rpc("tryon_take", { p_device: device, p_dev_limit: DEV_LIMIT, p_global_limit: GLOBAL_LIMIT });
  if (take.error) return json(req, 500, { error: "사용량 확인에 실패했습니다." });
  if (!take.data) return json(req, 429, { error: "오늘 입혀 보기 횟수를 모두 썼습니다. 내일 다시 이용해 주세요." });

  try {
    const bytes = b64ToBytes(garment);
    const taskId = await submitKling(body.gender === "male", cat, bytes, myAv ? b64ToBytes(myAv) : undefined, body.fit, body.garmentGender, cleanName(body.name), shoe ? { bytes: b64ToBytes(shoe), name: cleanName(body.shoeName) } : undefined, shoeType);
    return json(req, 200, { taskId });
  } catch (e) {
    console.error("submit failed:", (e as Error).message);
    await sb.rpc("tryon_refund", { p_device: device });
    return json(req, 502, { error: "요청을 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요. (횟수는 차감되지 않았습니다)" });
  }
});
