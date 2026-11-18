// AI FIT 입혀 보기: 기본 캐릭터 + 상품 사진 → 그 옷을 입은 모습
// 이미지 생성은 Kling API(Omni Image)를 쓴다. 키(KLING_API_KEY)는 Supabase Secrets 에만 둔다.
import { createClient } from "npm:@supabase/supabase-js@2";

const KL_KEY = (Deno.env.get("KLING_API_KEY") ?? "").trim().replace(/^Bearer\s+/i, "");
const KL_MODEL = Deno.env.get("KLING_IMAGE_MODEL") ?? "kling-v3-omni";
const KL_BASE = "https://api-singapore.klingai.com";
const KL_PROMPT_MAX = 2500; // Kling 문장 길이 상한
const AVATAR_URL = Deno.env.get("AVATAR_URL") ?? "https://faraoh77777.github.io/work-fit-test/assets/avatar_default.jpg";
const AVATAR_URL_MALE = Deno.env.get("AVATAR_URL_MALE") ?? "https://faraoh77777.github.io/work-fit-test/assets/avatar_male.jpg";
const DEV_LIMIT = Number(Deno.env.get("DAILY_LIMIT") ?? "999999"); // 테스트 중: 하루 기기당 한도 해제(출시 전 5 로 되돌린다)
const GLOBAL_LIMIT = Number(Deno.env.get("GLOBAL_DAILY_LIMIT") ?? "999999"); // 테스트 중: 하루 전체 한도 해제(출시 전 100 으로 되돌린다)
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://faraoh77777.github.io,http://127.0.0.1:8765,http://localhost:8765,http://127.0.0.1:8777,http://localhost:8777,http://127.0.0.1:8770,http://localhost:8770").split(",");
const MAX_B64 = 7_000_000; // 상품 사진 base64 길이 상한(약 5MB)
const MAX_AV_B64 = 4_000_000; // 내 아바타 base64 길이 상한(약 3MB)

/* 하의 기장: 사이즈표·다리 길이와 상관없이 상품 사진의 스타일 길이대로. 허리·엉덩이·허벅지·밑위는 FIT 문장이 치수대로 그린다 */
const bottomLen = (img: string) => " The length of the bottoms follows the style in " + img + " regardless of size: full-length trousers end at her ankles, never dragging or too short; cropped styles, shorts and skirts stay as in " + img + ".";
const BOTTOM_LEN_BODY = " The length of the bottoms is NOT taken from the product photo: it is set by her own leg length as described in the fit below (a shorter person's hems sit lower and longer, a taller person's sit higher).";
const PROMPTS: Record<string, string> = {
  top: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of a top. Edit image 1 so she wears exactly the top shown in image 2 (same color, collar, pattern, sleeve length and fit) instead of her current top.",
  bottom: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of bottoms. Edit image 1 so she wears exactly the bottoms shown in image 2 (same color, fabric and cut) instead of her current bottoms." + bottomLen("image 2"),
  dress: "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of a dress. Edit image 1 so she wears exactly the dress shown in image 2 (same color, neckline, pattern, sleeve length, hem length and fit) instead of her current top and bottoms.",
  /* 2026-11-05 사용자 결정: 상의+하의를 원본 캐릭터에 한 번에 입힌다(그림 위에 다시 입히면 얼굴이 누적으로 변함). 길이·핏은 FIT 문장이 정하므로 여기서는 상품 사진의 길이를 따르라고 하지 않는다 */
  outfit: "Image 1 is a full-body photo of a woman standing. Image 2 shows a top and image 3 shows bottoms. Edit image 1 so she wears exactly that top (same color, collar, pattern and sleeve style) and those bottoms (same color, fabric and cut) instead of her current clothes." + bottomLen("image 3"),
  /* 2026-11-13 사용자 결정(2번): 상의+하의 위에 겉옷(재킷·코트 등)을 한 번에 입힌다. 그림 순서: 1 아바타, 2 상의, 3 하의, 4 겉옷, 5 신발(고른 경우) */
  outfit3: "Image 1 is a full-body photo of a woman standing. Image 2 shows a top, image 3 shows bottoms and image 4 shows an outer layer (a jacket or coat). Edit image 1 so she wears exactly that top (same color, collar, pattern and sleeve style), those bottoms (same color, fabric and cut) and, worn over the top as the outer layer, exactly that outer layer (same color, collar, buttons, pattern, sleeve length and hem length) instead of her current clothes. The top is worn under the outer layer and stays visible at its opening." + bottomLen("image 3"),
  /* 2026-11-12 사용자 결정: 원피스 위에 상의(나시·티·셔츠·니트·재킷·코트 등 종류 제한 없음)를 겹쳐 입는다. 원본 캐릭터에 한 번에 입힌다(누적 입히기 금지) */
  layered: "Image 1 is a full-body photo of a woman standing. Image 2 shows a dress and image 3 shows a top. Edit image 1 so she wears exactly that dress (same color, neckline, pattern and hem length) and, layered over the dress, exactly that top (same color, collar, pattern and sleeve style) instead of her current clothes. The top is worn on top of the dress: it covers the upper part of the dress, and the dress's skirt shows below the top's hem.",
  shoe: "Image 1 is a full-body photo of a woman standing barefoot. Image 2 is a product photo of shoes. Edit image 1 so she wears exactly the shoes shown in image 2 (same color and design).",
};
const KEEP = " Keep her face, hair, pose, body proportions, the other clothing, the plain gray background and the framing unchanged. Photorealistic result. Do not add text, logos or accessories. Her neck, ears and wrists stay bare skin: add no necklace, earrings, watch, bracelet, scarf or any jewelry or accessory; the neckline shows only the garment's own collar.";

/* 2026-11-04 사용자 결정: 사진 없이 고를 수 있는 신발 종류(많이 쓰는 것 기본 세팅). 옷장에 사진으로 등록한 신발(image 3)이 있으면 그게 우선 */
const SHOE_TYPES: Record<string, { female: string; male: string }> = {
  pumps: { female: "simple classic black leather low-heel pumps with no buckle or hardware", male: "simple classic black leather dress shoes (plain black oxfords)" },
  sneakers: { female: "simple white low-top canvas sneakers", male: "simple white low-top canvas sneakers" },
  loafers: { female: "simple black leather loafers", male: "simple black leather loafers" },
  sandals: { female: "simple black strappy flat sandals", male: "simple black leather sport sandals" },
  boots: { female: "simple black leather ankle boots", male: "simple black leather boots" },
};

/* 2026-11-12 「옷만 뽑기」(사용자 결정: 뽑을 때 종류+색을 고른다). 코디 사진에서 그 옷만 흰 배경 상품 사진으로 뽑아 두고, 입힐 때 그 사진을 쓴다.
   종류·색은 정해진 목록의 값만 받는다(임의 문장이 프롬프트에 들어가지 않게). 겉옷 종류면 입힐 때 원래 상의를 안에 그대로 둔다(같은 날 MCP 실험 3단계 문장) */
const EX_KINDS: Record<string, { cats: string[]; en: string; outer?: boolean }> = {
  coat: { cats: ["top", "outer"], en: "coat", outer: true },
  jacket: { cats: ["top", "outer"], en: "jacket", outer: true },
  cardigan: { cats: ["top", "outer"], en: "cardigan", outer: true },
  jumper: { cats: ["top", "outer"], en: "zip-up jumper", outer: true },
  shirt: { cats: ["top", "outer"], en: "shirt" },
  blouse: { cats: ["top", "outer"], en: "blouse" },
  tee: { cats: ["top", "outer"], en: "T-shirt" },
  knit: { cats: ["top", "outer"], en: "knit sweater" },
  sweatshirt: { cats: ["top", "outer"], en: "sweatshirt" },
  sleeveless: { cats: ["top", "outer"], en: "sleeveless top" },
  pants: { cats: ["bottom"], en: "trousers" },
  jeans: { cats: ["bottom"], en: "jeans" },
  shorts: { cats: ["bottom"], en: "shorts" },
  skirt: { cats: ["bottom"], en: "skirt" },
  dress: { cats: ["dress"], en: "dress" },
};
const EX_COLORS: Record<string, string> = { black: "black", white: "white", ivory: "ivory", beige: "beige", brown: "brown", gray: "gray", navy: "navy", blue: "blue", skyblue: "light blue", green: "green", khaki: "khaki", red: "red", pink: "pink", yellow: "yellow", purple: "purple", orange: "orange" };
type Ex = { desc: string; outer: boolean; kind: string };
function exOf(kind: unknown, color: unknown, cat: string): Ex | null {
  const k = EX_KINDS[String(kind ?? "")], c = EX_COLORS[String(color ?? "")] ?? "";
  if (!k || !k.cats.includes(cat)) return null;
  return { desc: (c ? c + " " : "") + k.en, outer: !!k.outer, kind: k.en };
}
/* 옷만 뽑은 겉옷을 상의로 입힐 때의 첫 문장(MCP 실험 3단계 그대로: '원래 상의 대신'이 아니라 '겉옷으로' 입힌다). 이름은 @@NAME@@ 로 나중에 채운다 */
function topOuterPrompt(ex: Ex) {
  return "Image 1 is a full-body photo of a woman standing. Image 2 is a product photo of an outer layer (a " + ex.kind + ") on a plain background. Edit image 1 so she wears exactly the " + ex.kind + " shown in image 2 (same color, collar, buttons, pattern, sleeve length, hem length and fit) as an outer layer. The item to put on is the product named \"@@NAME@@\".";
}
/* 뽑기 문장: image 1 = 사용자가 넣은 상품(코디) 사진 하나. MCP 실험 1단계(2026-11-12, 트렌치) 문장을 종류에 맞게 일반화 */
function extractPrompt(ex: Ex) {
  return "Image 1 is a product photo that may show a model wearing a full outfit. Create a clean e-commerce product photo of ONLY the " + ex.desc + " from image 1: the " + ex.desc + " alone, shown from the front as an invisible-mannequin (ghost mannequin) shot" + (ex.outer ? ", unbuttoned and open exactly as in image 1" : "") + ", on a plain pure white background. Keep exactly the same color, fabric, pattern, collar, buttons, pockets, details, length and silhouette as in image 1. No person, no face, no hands, no other clothing, no shoes, no hanger, no text, no logo.";
}

/* 내 아바타를 쓸 때: 몸은 한 픽셀도 바꾸지 말고 옷만 바꾼다(핏 확인용이라 체형이 달라지면 안 된다) */
const KEEP_BODY = " This is a fit-check: the person's body must stay IDENTICAL to image 1. Do NOT slim, widen, lengthen, reshape or retouch the body. Keep exactly the same height, head size, shoulder width, bust, waist, hip and thigh widths, arm and leg thickness and length, body silhouette, skin, face, hair, pose, hands, the plain background and the framing, pixel-aligned with image 1. Change ONLY the clothing item named above, and render it realistically at its true cut and fit on that unchanged body (tight where it is tight, loose where it is loose, do not tailor it to flatter the body). Keep every other garment as it is. Photorealistic result. Do not add text, logos or accessories. Her neck, ears and wrists stay bare skin: add no necklace, earrings, watch, bracelet, scarf or any jewelry or accessory; the neckline shows only the garment's own collar.";

function toMale(t: string, male: boolean) {
  return male ? t.replace(/a woman/g, "a man").replace(/\bshe\b/g, "he").replace(/\bher\b/g, "his").replace(/\bShe\b/g, "He").replace(/\bHer\b/g, "His") : t;
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
/* 길이 정보(앱이 계산한 숫자만 받음): 어깨선·소매·밑위(cm 차이), 총장(밑단 높이/키 비율) */
function lenNum(len: Record<string, unknown>, k: string, lo: number, hi: number): number | null {
  if (len[k] == null) return null;
  const v = Number(len[k]);
  return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : null;
}
const HEM_TO_TEXT: Record<string, string> = {
  above: "the hems end about 5 cm above her ankle bones, clearly showing her ankles and the top of her shoes",
  ankle: "the hems end right at her ankle bones, just touching the top of her shoes",
  foot: "the hems fall onto the tops of her feet with a slight break over the shoes",
  floor: "the hems are full length: they cover the tops of her shoes and almost touch the floor, with the fabric bunching slightly at the shoes",
};
const ANKLE_H = 6; // 발목뼈 높이(cm, 바닥 기준 평균)
const BOOTS_COVER = "she is wearing boots, and the trouser hems fall over the boot shafts, covering the top of the boots so no gap shows between the hems and the boots";
const BOOTS_EARLY = " IMPORTANT: her trouser legs are long and fully cover her boots. The hems hang down over the entire boot shafts and rest on the toes of the boots, so the boot shafts are completely hidden under the fabric: no boot top, no bare ankle and no gap is visible, and only the toe caps of the boots show below the hems.";
/* 하의 핏의 부츠 풀렝스 여부(앱이 보낸 boots 와 바지 길이만 본다) */
function bootsFull(fit: unknown): boolean {
  const len = (fit as { len?: Record<string, unknown> } | undefined)?.len;
  if (!len || typeof len !== "object" || !len.boots) return false;
  const h = hemToOf(len);
  return h ? (h === "foot" || h === "floor") : (lenNum(len, "leg", -80, 40) ?? -99) >= -12;
}
function hemToOf(len: Record<string, unknown>): string | null {
  const v = String(len.hemTo ?? "");
  return Object.prototype.hasOwnProperty.call(HEM_TO_TEXT, v) ? v : null;
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
    /* 2026-11-11: 0.42 미만을 한 문장(허벅지 중간)으로 뭉쳐 긴 코트(총장 105 등)가 전부 허벅지 중간으로 나가던 문제 → 무릎·종아리·발목 구간 추가 */
    else if (hem >= 0.36) out.push("the hem reaches her mid-thighs, halfway between her hips and her knees");
    else if (hem >= 0.30) out.push("the hem ends just above her knees");
    else if (hem >= 0.25) out.push("the hem ends at her knees");
    else if (hem >= 0.10) out.push("the hem ends at her calves, between her knees and her ankles");
    else out.push("the hem ends near her ankles");
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
    /* 2026-11-13 사용자 결정 변경(키 작은 사람·큰 사람이 같은 느낌이면 핏 의미가 없음): 바지·스커트 기장도 앱이 계산한 값으로 그린다.
       leg = 옷 인심(또는 총장-밑위) − 다리 인심(cm), legPos = 옷/다리 비율. 앞(2026-11-06)에는 상품 사진 길이만 따랐다 */
    /* 2026-11-13 사용자가 고른 바지 길이(자동이면 hemTo 없음): 계산값 대신 이 문장을 쓴다 */
    const hemTo = hemToOf(len);
    const bootsOn = !!len.boots && (hemTo ? (hemTo === "foot" || hemTo === "floor") : (lenNum(len, "leg", -80, 40) ?? -99) >= -12);
    /* 2026-11-16 부츠 풀렝스: 「신발 윗부분을 덮는다」 문장 대신 부츠 목을 덮는 문장만 쓴다(서로 부딪히지 않게). 부츠 문장은 신발 문장 바로 뒤에도 한 번 더 나간다(buildPrompt) */
    if (hemTo) out.push(bootsOn ? "the hems are full length and fall down over the boots, completely covering the boot shafts" : HEM_TO_TEXT[hemTo]);
    /* 2026-11-16 부츠: 풀렝스 가지(길게·바닥·자동에서 다리보다 길거나 맞는 경우)만 밑단이 부츠 목을 덮게 한다 */
    if (bootsOn && !hemTo) out.push(BOOTS_COVER);
    /* 2026-11-16 기준 보정(사용자 검토): leg 는 바닥 기준 차이. 발목뼈는 바닥에서 약 ANKLE_H cm 위라서 「발목 위 N cm」는 −leg−ANKLE_H 가 맞다.
       신발을 신으면 밑단 높이가 굽(shoeH, cm)만큼 올라가므로 바닥에 끌리는 기준만 shoeH 만큼 늦춘다(발목은 신발과 같이 올라가 상쇄) */
    const shoeH = lenNum(len, "shoeH", 0, 12) ?? 0;
    const lg = hemTo ? null : lenNum(len, "leg", -80, 40), lp = lenNum(len, "legPos", 0, 2);
    if (lg !== null) {
      if (lg < -12) {
        if (lp !== null) out.push(lp < 0.2 ? "the legs end high on her upper thighs" : lp < 0.35 ? "the hem ends at her mid-thighs" : lp < 0.5 ? "the hem ends around her knees" : lp < 0.7 ? "the hem ends just below her knees" : "the hem ends on her calves, well above her ankles");
      }
      else if (lg >= 3 + shoeH) out.push("the bottoms are about " + Math.round(lg - shoeH) + " cm too long for her legs: the hems pile up on top of her shoes and touch the floor, bunching in loose folds around her ankles");
      else if (lg >= 0) out.push("the hems fall onto the tops of her feet with a slight break");
      else if (lg >= -ANKLE_H) out.push("the hems end right at her ankle bones");
      else out.push("the hems end about " + Math.max(1, Math.round(-lg - ANKLE_H)) + " cm above her ankles, clearly showing her ankles and the top of her shoes; these bottoms are too short for her legs, so draw them visibly short and do NOT extend or lengthen the legs to reach her ankles or the floor, even if the product photo shows them longer on the model");
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
function nameText(cat: string, name: string, name2 = "", ex1: Ex | null = null) {
  if (cat === "outfit3") {
    const top = name ? "the @@NAME@@" : "the top", bot = name2 ? "the @@NAME2@@" : "the bottoms", out = "the @@NAME3@@";
    return " Images 2, 3 and 4 may be model photos: take ONLY " + top + " from image 2, ONLY " + bot + " from image 3 and ONLY " + out + " from image 4; ignore the models' faces, hair, bodies, shoes and all other clothing there. She is fully and modestly dressed and nothing of her old top or bottoms remains visible.";
  }
  if (cat === "outfit") {
    const top = name ? "the @@NAME@@" : "the top", bot = name2 ? "the @@NAME2@@" : "the bottoms";
    /* 옷만 뽑은 상의: 사진에 안쪽 상의가 없다 → 겉옷이면 원래 상의를 안에 그대로 두고, 아니면 안쪽 상의 문장을 뺀다 */
    const inner = !ex1 ? " (but if the top is an outer layer such as a coat or cardigan, she also wears the inner top under it in image 2)"
      : ex1.outer ? " (the top is an outer layer: under it she keeps her current top from image 1 exactly as it is and does not add any other inner top)" : "";
    return " Image 2 and image 3 may be model photos: take ONLY " + top + " from image 2 and ONLY " + bot + " from image 3; ignore the models' faces, hair, bodies, shoes and all other clothing there" + inner + ". She is fully and modestly dressed and nothing of her old " + (ex1 && ex1.outer ? "bottoms" : "top or bottoms") + " remains visible.";
  }
  /* 옷만 뽑은 사진(흰 배경 그 옷 하나): 코디 사진 문장을 빼고, 겉옷이면 원래 상의를 그대로 둔다(2026-11-12 MCP 실험 3단계: 2회 모두 원래 나시·반바지 유지) */
  if (ex1 && (cat === "top" || cat === "bottom" || cat === "dress")) {
    const base = " Image 2 is a clean product photo of only the @@NAME@@ on a plain background";
    if (cat === "top" && ex1.outer) return " Under the " + ex1.kind + " she keeps her current top from image 1 exactly as it is (same type, color and shape); do not replace or recolor it and do not add any other inner top.";
    if (cat === "top") return base + ". Completely remove her current top: no part of it may remain visible (no sleeve, collar, strap, hem or waistband showing).";
    return base + ". In the finished image she is fully and modestly dressed, wearing only the new " + SLOT[cat] + " described above; none of her previous " + SLOT[cat] + " remains visible (no old waistband, hem or fabric peeking out).";
  }
  /* 원피스+상의: 안쪽 옷은 원피스이므로 상품 사진 속 안쪽 상의는 가져오지 않는다 */
  if (cat === "layered") {
    const dr = name ? "the @@NAME@@" : "the dress", top = name2 ? "the @@NAME2@@" : "the top";
    return " Image 2 and image 3 may be model photos: take ONLY " + dr + " from image 2 and ONLY " + top + " from image 3; ignore the models' faces, hair, bodies, shoes and all other clothing there (do not take any inner top, trousers, skirt or shorts from image 3; under the top she wears only the dress). She is fully and modestly dressed and nothing of her old top or bottoms remains visible.";
  }
  if (!name) return "";
  var base = " The item to put on is the product named \"@@NAME@@\". Image 2 may be a photo of a model wearing a full outfit: take ONLY the @@NAME@@ from image 2 and ignore the face, hair and body of the model in image 2 and every other item of clothing and the shoes there" +
    (cat === "top" ? ", except that if the @@NAME@@ is an outer layer (a coat, jacket, cardigan or similar), she also wears the inner top worn under it in image 2" : "");
  /* 하의·원피스: '제거하라'는 동작 지시 대신 '새 옷만 보이는 결과'로 서술(2026-11-05: 하체를 완전히 벗기라는 표현이 Kling 콘텐츠 검열에 걸려 하의·원피스만 계속 실패하던 문제 대응) */
  if (cat === "bottom" || cat === "dress") {
    return base + ". In the finished image she is fully and modestly dressed, wearing only the new " + SLOT[cat] + " described above; none of her previous " + SLOT[cat] + " remains visible (no old waistband, hem or fabric peeking out).";
  }
  return base + ". Completely remove her current " + SLOT[cat] + ": no part of it may remain visible (no sleeve, collar, strap, hem or waistband showing).";
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
    ? " On her feet she wears exactly the shoes" + (shoeName ? " (" + shoeName + ")" : "") + " shown in image 3 (same color and design); take only the shoes from image 3, nothing else; ignore any person in image 3."
    : " On her feet she wears " + typeDesc + "; these are NOT the shoes from image 2, do not copy any shoes from image 2.";
  /* 2026-11-04 6차 시험: 신발 안 고름(기본 구두)인데 코디 사진의 슬랙스+로퍼를 입고 손을 주머니에 넣음 → 하의 유지·손 유지 문장 강화(사용자 결정) */
  const hands = " Her arms and hands stay exactly as in image 1; do not put her hands in pockets. Her feet and shoes stay fully inside the frame with a margin of background below them.";
  if (cat === "outfit" || cat === "layered" || cat === "outfit3") {
    const si = cat === "outfit3" ? "image 5" : "image 4";
    return (shoeName !== null
      ? " On her feet she wears exactly the shoes" + (shoeName ? " (" + shoeName + ")" : "") + " from " + si + " (same color and design), worn properly: both feet fully inside, heels seated in the shoes with the back not crushed or folded, both soles flat on the floor, nothing else from " + si + "; ignore any person in " + si + "."
      : " On her feet she wears " + typeDesc + ", NOT shoes from " + (cat === "outfit3" ? "image 2, image 3 or image 4" : "image 2 or image 3") + ".") + hands;
  }
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
const KEEP_BODY_SHORT = " This is a fit-check: keep the person's body IDENTICAL to image 1 (same height, proportions, shoulder, bust, waist, hip, arm and leg widths and lengths, skin, face, hair, pose, hands, background and framing). Do NOT slim or reshape the body. Change ONLY the clothing item named above, at its true cut and fit. Keep every other garment. Photorealistic. No text, logos or accessories. Her neck, ears and wrists stay bare skin: add no necklace, earrings, watch, bracelet, scarf or any jewelry or accessory; the neckline shows only the garment's own collar.";
/* 2026-11-13 입는 모양: 겉옷 열기/잠그기, 상의·이너 바지에 넣기/빼기. 첫 문장 바로 뒤에 넣어 상한에 걸려 끝이 잘려도 남게 한다 */
type WearStyle = { outer?: string; tuck?: string; belt?: string };
function styleOfBody(v: unknown): WearStyle | undefined {
  const o = (v ?? {}) as Record<string, unknown>, r: WearStyle = {};
  if (o.outer === "closed" || o.outer === "open") r.outer = String(o.outer);
  if (o.tuck === "in" || o.tuck === "out") r.tuck = String(o.tuck);
  if (o.belt === "on" || o.belt === "off") r.belt = String(o.belt);
  return r.outer || r.tuck || r.belt ? r : undefined;
}
function styleText(st?: WearStyle) {
  if (!st) return "";
  let t = "";
  if (st.outer === "closed") t += " IMPORTANT STYLING: keep the outer layer's exact design from its product photo (collar, lapels, belt, cut, silhouette, length, color); do NOT redesign it. Only the front is worn CLOSED: the front edges meet and overlap, closed in the garment's own way (buttons fastened if it has buttons, zipper up if it has a zipper, belt tied if it is a wrap or belted style), so nothing of the front opening is visible. The layers underneath show only at the collar, cuffs and hem.";
  else if (st.outer === "open") t += " IMPORTANT STYLING (overrides how the garments look in the product photos): the outer layer (jacket, coat or cardigan) is worn OPEN at the front: buttons undone or zipper pulled down, the front edges hanging apart so the layer underneath shows.";
  if (st.tuck === "in") t += " IMPORTANT STYLING: the shirt or inner top is TUCKED IN: its hem goes inside the bottoms, the waistband of the bottoms is clearly visible at her waist, and no part of the top hangs over it.";
  else if (st.tuck === "out") t += " IMPORTANT STYLING: the shirt or inner top is worn UNTUCKED: its hem hangs outside and over the top edge of the bottoms, covering the waistband, and the waistband of the bottoms is not visible.";
  if (st.belt === "on") t += " IMPORTANT STYLING: she wears a trouser belt (waist belt) through the loops of the bottoms, always fastened with its buckle, visible at the waist; choose a belt color that suits the outfit and shoes.";
  else if (st.belt === "off") t += " She wears no trouser belt.";
  return t;
}
function klPrompt(build: (keepBody: string) => string, semi = false, st?: WearStyle) {
  const sty = styleText(st);
  const conv = (t: string) => { const i = sty ? t.indexOf(". ") : -1; if (i > 0) t = t.slice(0, i + 1) + sty + t.slice(i + 1); if (st?.outer === "closed") t = t.replace(" and stays visible at its opening", " and shows only at the collar and cuffs").replace("The inner layers stay visible at the opening of the outer layer.", "The inner layers show only at the collar, cuffs and hem of the outer layer."); return t.replace(/\b[Ii]mage ([123456])\b/g, "<<<image_$1>>>"); };
  let t = conv(build(KEEP_BODY));
  if (t.length > KL_PROMPT_MAX) t = conv(build(KEEP_BODY_SHORT));
  if (t.length > KL_PROMPT_MAX) { t = t.slice(0, KL_PROMPT_MAX); const i = semi ? Math.max(t.lastIndexOf(". "), t.lastIndexOf("; ")) : t.lastIndexOf(". "); if (i > 0) t = t.slice(0, i) + "."; } /* semi: 두 벌 입히기는 핏이 ';'로 이어진 한 문장이라 '.'로만 자르면 옷 하나의 핏이 통째로 사라진다 */
  return t;
}
/* 상의+하의를 한 번에 입힐 때: 옷별 핏 문장에 어느 옷인지 표시하고, 하의 문장의 상품 사진 번호를 image 3 으로 맞춘다.
   두 벌이면 문장 상한(2500자)에 걸려 몸 유지 문장이 잘리므로, 옷마다 반복되는 설명은 빼고 끝에 한 번만 쓴다 */
function outfitFit(fit: unknown, fit2: unknown) {
  const slim = (t: string) => t.replace(" (the garment's real size relative to her body, show it visibly in the image)", "").replace(" Draw the garment's size honestly, scaled to its true size relative to her unchanged body, never resized to flatter her.", "");
  /* 원단 문장은 맨 뒤로 보낸다: 상한에 걸려도 상의·하의 핏이 먼저 남는다 */
  const fabT = fit ? fabricText(fit) : "", fabB = fit2 ? fabricText(fit2) : "";
  const top = slim(fitText(fit, "top")).replace(fabT, "").replace("FIT OF THE GARMENT", "FIT OF THE TOP");
  const bot = slim(fitText(fit2, "bottom")).replace(fabB, "").replace("FIT OF THE GARMENT", "FIT OF THE BOTTOMS");
  const fab = fabB.replace("The garment is made of", "The bottoms are made of") + fabT.replace("The garment is made of", "The top is made of");
  return top || bot || fab ? " Show each garment's real size honestly on her unchanged body, never resized to flatter her." + bot + top + fab : "";
}
function outfitCut(g: unknown, g2: unknown, male: boolean) {
  const one = (v: unknown, cat: string, label: string) => cutText(v, male, cat) ? " Keep the original " + (v === "female" ? "women's" : "men's") + " cut of the " + label + "; do not re-tailor it." : "";
  return one(g, "top", "top") + one(g2, "bottom", "bottoms");
}
/* 몸 유지 문장은 '옷 하나만 바꿔라'로 되어 있어 두 벌에 맞게 고친다 */
function outfitKeep(t: string) {
  return t.replace("the clothing item named above", "the top, bottoms and shoes described above").replace(/ Keep every other garment( as it is)?\./, "").replace("the other clothing, ", "");
}
/* 원피스+상의: 원피스 핏(가슴·허리·엉덩이·기장)과 상의 핏(가슴·어깨·소매·기장)을 따로 표시한다. 원피스가 먼저(상한에 걸려도 남게) */
function layeredFit(fit: unknown, fit2: unknown) {
  const slim = (t: string) => t.replace(" (the garment's real size relative to her body, show it visibly in the image)", "").replace(" Draw the garment's size honestly, scaled to its true size relative to her unchanged body, never resized to flatter her.", "");
  const fabD = fit ? fabricText(fit) : "", fabT = fit2 ? fabricText(fit2) : "";
  const dr = slim(fitText(fit, "dress")).replace(fabD, "").replace("FIT OF THE GARMENT", "FIT OF THE DRESS");
  const top = slim(fitText(fit2, "top")).replace(fabT, "").replace("FIT OF THE GARMENT", "FIT OF THE TOP");
  const fab = fabD.replace("The garment is made of", "The dress is made of") + fabT.replace("The garment is made of", "The top is made of");
  return dr || top || fab ? " Show each garment's real size honestly on her unchanged body, never resized to flatter her." + dr + top + fab : "";
}
function layeredCut(g: unknown, g2: unknown, male: boolean) {
  const one = (v: unknown, cat: string, label: string) => cutText(v, male, cat) ? " Keep the original " + (v === "female" ? "women's" : "men's") + " cut of the " + label + "; do not re-tailor it." : "";
  return one(g, "dress", "dress") + one(g2, "top", "top");
}
type Second = { bytes: Uint8Array; name: string; fit?: unknown; garmentGender?: unknown };
/* 보낼 문장 전체(시험에서도 이 함수를 그대로 쓴다) */
function buildPrompt(male: boolean, cat: string, mine: boolean, fit: unknown, garmentGender: unknown, name: string, shoe: { name: string } | undefined, shoeType: string | null, second?: Omit<Second, "bytes">, ext?: { e1?: Ex | null; e2?: Ex | null; e3?: Ex | null }, third?: { name: string }, wst?: WearStyle) {
  const shoeName = shoe ? shoe.name : null;
  /* 옷만 뽑은 사진이면 이름 대신 뽑을 때 고른 종류·색(영어)으로 부른다 */
  const e1 = ext?.e1 ?? null, e2 = ext?.e2 ?? null, e3 = ext?.e3 ?? null;
  const thirdName = e3 ? e3.desc : (third?.name ?? "");
  if (e1) name = e1.desc;
  if (e2 && second) second = { ...second, name: e2.desc };
  return klPrompt((kb) => {
    const keep = mine ? kb : KEEP;
    const t = cat === "outfit"
      /* 몸 유지 문장을 핏 문장보다 앞에 둔다: 상한을 넘어 끝이 잘려도 얼굴·몸 유지는 남고, 하의 핏(허리·엉덩이)이 상의 핏보다 먼저 온다 */
      ? toMale(PROMPTS.outfit + nameText(cat, name, second?.name ?? "", e1) + keepOthersText(cat, male, shoeName, shoeType) + outfitKeep(keep), male) + outfitCut(garmentGender, second?.garmentGender, male) + toMale(outfitFit(fit, second?.fit), male)
      : cat === "outfit3"
      ? toMale(PROMPTS.outfit3 + nameText(cat, name, second?.name ?? "", e1) + keepOthersText(cat, male, shoeName, shoeType) + outfitKeep(keep).replace("the top, bottoms and shoes described above", "the top, bottoms, outer layer and shoes described above"), male) + outfitCut(garmentGender, second?.garmentGender, male) + toMale(outfitFit(fit, second?.fit), male)
      : cat === "layered"
      ? toMale(PROMPTS.layered + nameText(cat, name, second?.name ?? "") + keepOthersText(cat, male, shoeName, shoeType) + outfitKeep(keep).replace("the top, bottoms and shoes described above", "the dress, top and shoes described above"), male) + layeredCut(garmentGender, second?.garmentGender, male) + toMale(layeredFit(fit, second?.fit), male)
      : toMale((cat === "top" && e1?.outer ? topOuterPrompt(e1) : PROMPTS[cat]) + nameText(cat, name, "", e1) + keepOthersText(cat, male, shoeName, shoeType) + fitText(fit, cat) + keep, male) + cutText(garmentGender, male, cat);
    /* 2026-11-13: 하의 기장을 계산값으로 보낼 때(긴 바지·스커트)는 「크기와 상관없이 발목에서 끝남」 문장을 빼고 계산값을 따르라고 한다(서로 반대 지시 방지) */
    const bfit = cat === "bottom" ? fit : (cat === "outfit" || cat === "outfit3") ? second?.fit : null, blgLen = bfit ? (((bfit as { len?: Record<string, unknown> }).len ?? {}) as Record<string, unknown>) : null, blg = blgLen ? (hemToOf(blgLen) ? 0 : lenNum(blgLen, "leg", -80, 40)) : null;
    const bl = bottomLen(cat === "outfit" || cat === "outfit3" ? "image 3" : "image 2");
    const bootsFit = cat === "bottom" ? fit : (cat === "outfit" || cat === "outfit3") ? second?.fit : null;
    const HANDS_END = "feet and shoes stay fully inside the frame with a margin of background below them.";
    const tb = bootsFull(bootsFit) ? t.replace(" Her " + HANDS_END, " Her " + HANDS_END + BOOTS_EARLY).replace(" His " + HANDS_END, " His " + HANDS_END + toMale(BOOTS_EARLY, true)) : t;
    const t2 = blg !== null ? tb.replace(bl, BOTTOM_LEN_BODY).replace(toMale(bl, true), toMale(BOTTOM_LEN_BODY, true)) : tb;
    return t2.split("@@NAME3@@").join(thirdName).split("@@NAME2@@").join(second?.name ?? "").split("@@NAME@@").join(name);
  }, cat === "outfit" || cat === "layered" || cat === "outfit3", wst);
}
/* 접수: 사진 두 장(base64)과 문장을 보내고 번호(task_id)를 돌려준다. 오래 붙잡지 않는다 */
/* 옷만 뽑기 접수: 상품 사진 한 장만 보낸다(아바타 없음), 상품 사진 비율 3:4 */
async function submitExtract(garmentBytes: Uint8Array, ex: Ex) {
  const prompt = klPrompt(() => extractPrompt(ex));
  const d = await kl("/v1/images/omni-image", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: bytesToB64(garmentBytes) }], resolution: "2k", n: 1, aspect_ratio: "3:4" }),
  });
  if (!d.task_id) throw new Error("kling no task_id " + JSON.stringify(d).slice(0, 200));
  return String(d.task_id);
}

/* 2026-11-13 사용자 결정: 이너(조끼 등)를 포함해 신발까지 5가지. cat=multi — items 는 원피스·상의·이너·하의·겉옷 중 2~4벌(원피스와 하의는 같이 못 입음).
   그림 순서: 1 아바타, 2.. 옷(원피스→상의→이너→하의→겉옷 순), 마지막 신발(고른 경우). 겹침 순서: 안쪽 원피스/상의 → 이너(상의 위) → 겉옷(맨 바깥) */
const MULTI_ROLES = ["dress", "top", "inner", "bottom", "outer"];
const ROLE_DESC: Record<string, string> = { dress: "a dress", top: "a top", inner: "an inner layer (a vest or another light top)", bottom: "bottoms", outer: "an outer layer (a jacket or coat)" };
const ROLE_THE: Record<string, string> = { dress: "the dress", top: "the top", inner: "the inner layer", bottom: "the bottoms", outer: "the outer layer" };
type MItem = { role: string; bytes: Uint8Array; name: string; fit?: unknown; garmentGender?: unknown; ex?: Ex | null };
function buildMultiPrompt(male: boolean, mine: boolean, items: Omit<MItem, "bytes">[], shoe: { name: string } | undefined, shoeType: string | null, wst?: WearStyle) {
  const shoeName = shoe ? shoe.name : null, n = items.length, shoeIdx = n + 2;
  const has = (r: string) => items.some((i) => i.role === r), get = (r: string) => items.find((i) => i.role === r);
  const idx = (r: string) => items.findIndex((i) => i.role === r) + 2;
  const list = items.map((it, k) => "image " + (k + 2) + " shows " + ROLE_DESC[it.role]);
  const listTxt = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
  const layers = [has("dress") ? "the dress" : "", has("top") ? "the top" : "", has("inner") ? "the inner layer (worn over the top or dress, not under it)" : "", has("outer") ? "the outer layer over everything" : ""].filter(Boolean);
  const layering = layers.length > 1 ? " Layering from the inside out: " + layers.join(", then ") + (has("outer") ? ". The inner layers stay visible at the opening of the outer layer." : ".") : "";
  const nums = items.map((_, k) => String(k + 2));
  const numsTxt = nums.length > 1 ? "Images " + nums.slice(0, -1).join(", ") + " and " + nums[nums.length - 1] : "Image " + nums[0];
  const takes = items.map((it, k) => "ONLY " + (it.name || it.ex ? "the @@N" + k + "@@" : ROLE_THE[it.role]) + " from image " + (k + 2));
  const names = " " + numsTxt + " may be model photos: take " + takes.join(", ") + "; ignore the models' faces, hair, bodies, shoes, jewelry (necklaces, earrings, watches), bags, belts, scarves and all other accessories and clothing there. She wears no necklace or other jewelry and no accessories. Her neckline shows only the collar or neckline of the garments themselves. She is fully and modestly dressed and nothing of her old clothes remains visible.";
  const typeDesc = (SHOE_TYPES[shoeType ?? ""] ?? SHOE_TYPES.pumps)[male ? "male" : "female"];
  const hands = " Her arms and hands stay exactly as in image 1; do not put her hands in pockets. Her feet and shoes stay fully inside the frame with a margin of background below them.";
  const feet = (shoeName !== null
    ? " On her feet she wears exactly the shoes" + (shoeName ? " (" + shoeName + ")" : "") + " from image " + shoeIdx + " (same color and design), worn properly: both feet fully inside, heels seated in the shoes with the back not crushed or folded, both soles flat on the floor, nothing else from image " + shoeIdx + "; ignore any person in image " + shoeIdx + "."
    : " On her feet she wears " + typeDesc + ", NOT shoes from any garment image.") + hands;
  const bot = get("bottom");
  const bl = bot ? bottomLen("image " + idx("bottom")) : "";
  const blgLen = bot && bot.fit ? (((bot.fit as { len?: Record<string, unknown> }).len ?? {}) as Record<string, unknown>) : null;
  const blg = blgLen ? (hemToOf(blgLen) ? 0 : lenNum(blgLen, "leg", -80, 40)) : null;
  const topLike = get("top") ?? get("inner"), dr = get("dress");
  const fitPart = dr ? layeredFit(dr.fit, topLike?.fit) : topLike && bot ? outfitFit(topLike.fit, bot.fit) : "";
  const cutOne = (it: Omit<MItem, "bytes">) => { const cat = it.role === "dress" ? "dress" : it.role === "bottom" ? "bottom" : "top", g = it.garmentGender; return cutText(g, male, cat) ? " Keep the original " + (g === "female" ? "women's" : "men's") + " cut of " + ROLE_THE[it.role] + "; do not re-tailor it." : ""; };
  return klPrompt((kb) => {
    const keep = mine ? kb : KEEP;
    let t = toMale("Image 1 is a full-body photo of a woman standing. " + listTxt.charAt(0).toUpperCase() + listTxt.slice(1) + ". Edit image 1 so she wears exactly all of these garments together, each with the same color, pattern, collar and sleeve style as in its photo, instead of her current clothes." + layering + names + bl + feet + outfitKeep(keep).replace("the top, bottoms and shoes described above", "the garments and shoes described above"), male) + items.map(cutOne).join("") + toMale(fitPart, male);
    if (blg !== null) t = t.replace(bl, BOTTOM_LEN_BODY).replace(toMale(bl, true), toMale(BOTTOM_LEN_BODY, true));
    items.forEach((it, k) => { t = t.split("@@N" + k + "@@").join(it.ex ? it.ex.desc : it.name); });
    return t;
  }, true, wst);
}
async function submitMulti(male: boolean, items: MItem[], myAvatar?: Uint8Array, shoe?: { bytes: Uint8Array; name: string }, shoeType: string | null = null, wst?: WearStyle) {
  let avBytes = myAvatar;
  if (!avBytes) {
    const av = await fetch(male ? AVATAR_URL_MALE : AVATAR_URL);
    if (!av.ok) throw new Error("avatar");
    avBytes = new Uint8Array(await av.arrayBuffer());
  }
  const prompt = buildMultiPrompt(male, !!myAvatar, items.map((i) => ({ role: i.role, name: i.name, fit: i.fit, garmentGender: i.garmentGender, ex: i.ex })), shoe, shoeType, wst);
  const d = await kl("/v1/images/omni-image", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: bytesToB64(avBytes) }].concat(items.map((i) => ({ image: bytesToB64(i.bytes) })), shoe ? [{ image: bytesToB64(shoe.bytes) }] : []), resolution: "2k", n: 1, aspect_ratio: "9:16" }),
  });
  if (!d.task_id) throw new Error("kling no task_id " + JSON.stringify(d).slice(0, 200));
  return String(d.task_id);
}
async function submitKling(male: boolean, cat: string, garmentBytes: Uint8Array, myAvatar?: Uint8Array, fit?: unknown, garmentGender?: unknown, name = "", shoe?: { bytes: Uint8Array; name: string }, shoeType: string | null = null, second?: Second, ext?: { e1?: Ex | null; e2?: Ex | null; e3?: Ex | null }, third?: { bytes: Uint8Array; name: string }, wst?: WearStyle) {
  let avBytes = myAvatar;
  if (!avBytes) { // 내 아바타가 없으면 기본 캐릭터
    const av = await fetch(male ? AVATAR_URL_MALE : AVATAR_URL);
    if (!av.ok) throw new Error("avatar");
    avBytes = new Uint8Array(await av.arrayBuffer());
  }
  const prompt = buildPrompt(male, cat, !!myAvatar, fit, garmentGender, name, shoe, shoeType, second, ext, third, wst);
  const d = await kl("/v1/images/omni-image", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: bytesToB64(avBytes) }, { image: bytesToB64(garmentBytes) }].concat(second ? [{ image: bytesToB64(second.bytes) }] : [], third ? [{ image: bytesToB64(third.bytes) }] : [], shoe ? [{ image: bytesToB64(shoe.bytes) }] : []), resolution: "2k", n: 1, aspect_ratio: "9:16" }),
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

/* 2026-11-16 액세서리 착용: 종류별 영어 위치 문장. image 1 = 이미 옷을 입은 그림, image 2.. = 액세서리 사진 */
const ACC_MAX = 4;
const ACC_EN: Record<string, string> = {
  "모자": "a hat worn on her head", "안경": "eyeglasses worn on her face", "귀걸이": "earrings worn on her ears", "스카프·목도리": "a scarf worn around her neck",
  "목걸이": "a necklace worn around her neck, resting on her collarbone", "가방": "a handbag carried in her hand or on her shoulder", "벨트": "a belt worn at her waist",
  "비니·털모자": "a beanie worn on her head", "머리띠": "a headband worn in her hair", "헤어핀·집게": "a hair clip worn in her hair", "선글라스": "sunglasses worn over her eyes",
  "헤드폰": "headphones worn over her ears", "마스크": "a face mask worn over her nose and mouth", "넥타이": "a necktie worn at her collar", "나비넥타이": "a bow tie worn at her collar",
  "초커": "a choker worn tightly around her neck", "브로치·핀": "a brooch pinned on her chest", "팔찌": "a bracelet worn on her wrist", "장갑": "gloves worn on her hands",
  "백팩": "a backpack worn on her back with the straps over her shoulders", "클러치·파우치": "a clutch held in her hand", "우산": "an umbrella held in her hand", "양말·스타킹": "socks or stockings worn on her legs",
  "발찌": "an anklet worn on her ankle", "시계": "a wristwatch worn on her wrist", "반지": "a ring worn on her finger",
};
function accPrompt(male: boolean, accs: { type: string; name: string }[]) {
  const list = accs.map((a, k) => "image " + (k + 2) + " shows " + ACC_EN[a.type] + (a.name ? " (" + a.name + ")" : ""));
  const txt = list.length > 1 ? list.slice(0, -1).join(", ") + " and " + list[list.length - 1] : list[0];
  const t = "Image 1 is a full-body photo of a woman standing, already fully dressed. " + txt.charAt(0).toUpperCase() + txt.slice(1) + ". Edit image 1 so she additionally wears exactly " + (accs.length > 1 ? "these accessories" : "this accessory") + ", each with the same color, material and design as in its photo, placed naturally where it belongs on her body. The accessory photos may include models or other objects: take ONLY the accessory itself and ignore any person, clothes or background there. Keep everything else in image 1 exactly identical: her face, hair, expression, body shape, pose, hands, all clothing, shoes, the plain background and the image framing and position. Do NOT change, recolor or remove any of her clothes and do NOT add any other accessory, text or logo. Photorealistic.";
  return male ? toMale(t, true) : t;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST 만 가능합니다." });
  if (!KL_KEY) return json(req, 500, { error: "서버에 이미지 생성 키가 설정되지 않았습니다." });

  let body: { image?: string; style?: unknown; action?: string; taskId?: string; device?: string; cat?: string; garment?: string; gender?: string; avatar?: string; fit?: unknown; garmentGender?: string; name?: string; shoe?: string; shoeName?: string; shoeType?: string; garment2?: string; name2?: string; fit2?: unknown; garmentGender2?: string; extracted?: unknown; ekind?: string; ecolor?: string; extracted2?: unknown; ekind2?: string; ecolor2?: string; garment3?: string; name3?: string; extracted3?: unknown; ekind3?: string; ecolor3?: string; items?: any[] };
  try { body = await req.json(); } catch { return json(req, 400, { error: "요청 형식이 올바르지 않습니다." }); }
  if (body.action === "status") {
    const tid = String(body.taskId ?? "");
    if (!/^[A-Za-z0-9_-]{8,128}$/.test(tid)) return json(req, 400, { error: "작업 번호가 올바르지 않습니다." });
    try { return json(req, 200, await statusKling(tid)); }
    catch (e) { console.error("status failed:", (e as Error).message); return json(req, 502, { error: "진행 상태를 확인하지 못했습니다." }); }
  }
  /* 2026-11-13 2차 수정(restyle): 만들어진 그림 한 장만 받아 겉옷 앞을 닫는다(문장만으로는 상품 사진의 열린 모양을 따라가서). 새 이용 횟수는 쓰지 않는다(같은 입혀 보기의 연장). 결과 확인은 status 와 같다 */
  if (body.action === "restyle") {
    const dev = String(body.device ?? "");
    const im = String(body.image ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    const b64 = im ? im[1] : String(body.image ?? "");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(dev)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
    if (!b64 || b64.length > 9_000_000 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return json(req, 400, { error: "그림이 올바르지 않거나 너무 큽니다." });
    const st = styleOfBody(body.style);
    if (st?.outer !== "closed") return json(req, 400, { error: "수정할 내용이 없습니다." });
    try {
      const prompt = "Edit <<<image_1>>> minimally. The person wears an outer coat or jacket that is currently hanging OPEN at the front. Make it fully CLOSED: the two front edges meet and overlap, closed in the coat's own way (buttons fastened if it has buttons, zipper pulled up if it has a zipper, and if it is a wrap or belted coat, wrap the front across and tie the coat's own fabric belt or sash at the waist), and no gap of the front opening is visible, so the layers underneath show only at the collar and cuffs. Keep the coat's own design exactly as it is (collar, lapels, shawl collar, belt, cut, length, color): do NOT redesign the coat, and if the coat already has its own belt or sash keep it." + (st.tuck === "out" ? " Any shirt hem stays untucked." : "") + " " + (st.belt === "on" ? "Keep any trouser belt exactly as it is. Do NOT add a bag or any other new item." : "Do NOT add a trouser belt (waist belt on the pants), bag or any other new item.") + " Keep the person's face, hair, body shape, pose, hands, trousers, shoes, colors, background and image framing exactly identical to <<<image_1>>>. Photorealistic.";
      const d = await kl("/v1/images/omni-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: b64 }], resolution: "2k", n: 1, aspect_ratio: "9:16" }),
      });
      if (!d.task_id) throw new Error("kling no task_id " + JSON.stringify(d).slice(0, 200));
      return json(req, 200, { taskId: String(d.task_id) });
    } catch (e) {
      console.error("restyle submit failed:", (e as Error).message);
      return json(req, 502, { error: "수정 요청을 접수하지 못했습니다." });
    }
  }
  /* 2026-11-16 액세서리 착용(2단계): 이미 옷을 입은 그림 한 장 + 액세서리 사진 1~4장. 그림 속 사람·옷은 그대로 두고 액세서리만 더한다.
     restyle 처럼 새 이용 횟수는 쓰지 않는다(같은 입혀 보기의 연장). 결과 확인은 status 와 같다 */
  if (body.action === "accessorize") {
    const dev = String(body.device ?? "");
    const im = String(body.image ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    const b64 = im ? im[1] : String(body.image ?? "");
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(dev)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
    if (!b64 || b64.length > 9_000_000 || !/^[A-Za-z0-9+/=]+$/.test(b64)) return json(req, 400, { error: "그림이 올바르지 않거나 너무 큽니다." });
    const raw = Array.isArray(body.items) ? body.items : [];
    if (raw.length < 1 || raw.length > ACC_MAX) return json(req, 400, { error: "액세서리는 한 번에 1~" + ACC_MAX + "개까지 입혀요." });
    const accs: { type: string; name: string; bytes: Uint8Array }[] = [];
    for (const x of raw) {
      const type = String(x?.type ?? "");
      const gm = String(x?.image ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
      if (!ACC_EN[type]) return json(req, 400, { error: "액세서리 종류가 올바르지 않습니다." });
      if (!gm || !gm[1] || gm[1].length > MAX_B64) return json(req, 400, { error: "액세서리 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
      accs.push({ type, name: cleanName(x?.name), bytes: b64ToBytes(gm[1]) });
    }
    try {
      const prompt = klPrompt(() => accPrompt(body.gender === "male", accs));
      const d = await kl("/v1/images/omni-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: KL_MODEL, prompt, image_list: [{ image: b64 }].concat(accs.map((a) => ({ image: bytesToB64(a.bytes) }))), resolution: "2k", n: 1, aspect_ratio: "9:16" }),
      });
      if (!d.task_id) throw new Error("kling no task_id " + JSON.stringify(d).slice(0, 200));
      return json(req, 200, { taskId: String(d.task_id) });
    } catch (e) {
      console.error("accessorize submit failed:", (e as Error).message);
      return json(req, 502, { error: "액세서리 요청을 접수하지 못했습니다." });
    }
  }
  /* 옷만 뽑기: 상품 사진 + 종류·색(목록 값). 입혀 보기와 같은 이용 한도를 쓰고, 접수 실패면 돌려준다. 결과 확인은 status 와 같다 */
  if (body.action === "extract") {
    const dev = String(body.device ?? ""), ecat = String(body.cat ?? "");
    const gm = String(body.garment ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(dev)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
    if (!gm || !gm[1] || gm[1].length > MAX_B64) return json(req, 400, { error: "상품 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
    const ex = exOf(body.ekind, body.ecolor, ecat);
    if (!ex) return json(req, 400, { error: "뽑을 옷 종류가 올바르지 않습니다." });
    const sbx = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const tk = await sbx.rpc("tryon_take", { p_device: dev, p_dev_limit: DEV_LIMIT, p_global_limit: GLOBAL_LIMIT });
    if (tk.error) return json(req, 500, { error: "사용량 확인에 실패했습니다." });
    if (!tk.data) return json(req, 429, { error: "오늘 이용 횟수를 모두 썼습니다. 내일 다시 이용해 주세요." });
    try { return json(req, 200, { taskId: await submitExtract(b64ToBytes(gm[1]), ex) }); }
    catch (e) {
      console.error("extract submit failed:", (e as Error).message);
      await sbx.rpc("tryon_refund", { p_device: dev });
      return json(req, 502, { error: "요청을 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요. (횟수는 차감되지 않았습니다)" });
    }
  }
  const device = String(body.device ?? ""), cat = String(body.cat ?? "");
  let garment = String(body.garment ?? "");
  const m = garment.match(/^data:(image\/(?:jpeg|png|webp));base64,(.*)$/);
  let mime = "image/jpeg";
  if (m) { mime = m[1]; garment = m[2]; }
  if (mime === "image/webp") return json(req, 400, { error: "상품 사진은 JPG 또는 PNG 여야 합니다." }); // Kling 은 jpg·png 만 받는다
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(device)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
  if (!PROMPTS[cat] && cat !== "multi") return json(req, 400, { error: "옷 종류가 올바르지 않습니다." });
  if (cat !== "multi" && (!garment || garment.length > MAX_B64)) return json(req, 400, { error: "상품 사진이 없거나 너무 큽니다." });
  // 이너·겉옷 포함 여러 벌(cat=multi): items 2~4벌, 역할은 중복 없이, 원피스와 하의는 같이 못 입음
  const mItems: MItem[] = [];
  if (cat === "multi") {
    const raw = Array.isArray(body.items) ? body.items : [];
    const roles = raw.map((x: { role?: unknown }) => String(x?.role ?? ""));
    if (raw.length < 2 || raw.length > 4 || roles.some((r: string) => !MULTI_ROLES.includes(r)) || new Set(roles).size !== roles.length || (roles.includes("dress") && roles.includes("bottom"))) return json(req, 400, { error: "옷 종류가 올바르지 않습니다." });
    for (const role of MULTI_ROLES) {
      const x = raw.find((r: { role?: unknown }) => String(r?.role) === role);
      if (!x) continue;
      const gm = String(x.image ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
      if (!gm || !gm[1] || gm[1].length > MAX_B64) return json(req, 400, { error: "옷 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
      const exCat = role === "dress" ? "dress" : role === "bottom" ? "bottom" : role === "outer" ? "outer" : "top";
      mItems.push({ role, bytes: b64ToBytes(gm[1]), name: cleanName(x.name), fit: x.fit, garmentGender: x.garmentGender, ex: x.extracted ? exOf(x.ekind, x.ecolor, exCat) : null });
    }
  }
  // 상의+하의 한 번에(cat=outfit): garment 는 상의, garment2 는 하의 / 원피스+상의(cat=layered): garment 는 원피스, garment2 는 상의
  let garment2 = "";
  if (cat === "outfit" || cat === "layered" || cat === "outfit3") {
    const g2 = String(body.garment2 ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    if (!g2 || !g2[1] || g2[1].length > MAX_B64) return json(req, 400, { error: (cat === "layered" ? "상의" : "하의") + " 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
    garment2 = g2[1];
  }
  // 상의+하의+겉옷(cat=outfit3): garment 는 상의, garment2 는 하의, garment3 는 겉옷
  let garment3 = "";
  if (cat === "outfit3") {
    const g3 = String(body.garment3 ?? "").match(/^data:image\/(?:jpeg|png);base64,(.*)$/);
    if (!g3 || !g3[1] || g3[1].length > MAX_B64) return json(req, 400, { error: "겉옷 사진은 JPG 또는 PNG 이고 5MB 이하여야 합니다." });
    garment3 = g3[1];
  }
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
    if (cat === "multi") {
      const taskIdM = await submitMulti(body.gender === "male", mItems, myAv ? b64ToBytes(myAv) : undefined, shoe ? { bytes: b64ToBytes(shoe), name: cleanName(body.shoeName) } : undefined, shoeType, styleOfBody(body.style));
      return json(req, 200, { taskId: taskIdM });
    }
    const bytes = b64ToBytes(garment);
    /* 옷만 뽑은 사진 표시(종류·색이 목록에 맞을 때만). 두 벌이면 첫 옷의 칸은 상의(outfit) 또는 원피스(layered), 둘째 옷은 하의 또는 상의 */
    const cat1 = cat === "outfit" || cat === "outfit3" ? "top" : cat === "layered" ? "dress" : cat, cat2 = cat === "outfit" || cat === "outfit3" ? "bottom" : "top";
    const e1 = body.extracted ? exOf(body.ekind, body.ecolor, cat1) : null, e2 = garment2 && body.extracted2 ? exOf(body.ekind2, body.ecolor2, cat2) : null, e3 = garment3 && body.extracted3 ? exOf(body.ekind3, body.ecolor3, "outer") : null;
    const taskId = await submitKling(body.gender === "male", cat, bytes, myAv ? b64ToBytes(myAv) : undefined, body.fit, body.garmentGender, cleanName(body.name), shoe ? { bytes: b64ToBytes(shoe), name: cleanName(body.shoeName) } : undefined, shoeType, garment2 ? { bytes: b64ToBytes(garment2), name: cleanName(body.name2), fit: body.fit2, garmentGender: body.garmentGender2 } : undefined, (e1 || e2 || e3) ? { e1, e2, e3 } : undefined, garment3 ? { bytes: b64ToBytes(garment3), name: cleanName(body.name3) } : undefined, (cat === "outfit" || cat === "outfit3") ? styleOfBody(body.style) : undefined);
    return json(req, 200, { taskId });
  } catch (e) {
    const emsg = (e as Error).message;
    console.error("submit failed:", emsg);
    await sb.rpc("tryon_refund", { p_device: device });
    /* 2026-11-14: Kling API 계정 잔액 부족(429 / code 1102)은 사용자 잘못이 아니므로 따로 안내 */
    if (/\b429\b/.test(emsg) && /1102|balance/i.test(emsg)) return json(req, 503, { error: "AI 이미지 서버 잔액이 부족해요. 관리자에게 알려 주세요. (횟수는 차감되지 않았습니다)" });
    return json(req, 502, { error: "요청을 접수하지 못했습니다. 잠시 뒤 다시 시도해 주세요. (횟수는 차감되지 않았습니다)" });
  }
});
