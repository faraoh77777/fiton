// FITON 상품 링크 읽기: 쇼핑몰 상품 주소 → 옷 이름·가격·대표사진 주소. AI 키 불필요(페이지의 og 태그·JSON-LD 만 읽는다).
// 주의: 서버가 임의 주소를 가져오므로 사설망·내부 주소는 막는다(SSRF 방지).
const ALLOWED = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://faraoh77777.github.io,http://127.0.0.1:8765,http://localhost:8765,http://127.0.0.1:8777,http://localhost:8777,http://127.0.0.1:8770,http://localhost:8770").split(",");
const MAX_BYTES = 1_500_000;
const DAY_LIMIT = Number(Deno.env.get("LINKREAD_DAILY_LIMIT") ?? "60");
const GLOBAL_LIMIT = Number(Deno.env.get("LINKREAD_GLOBAL_DAILY_LIMIT") ?? "1000");

function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return { "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0], "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
}
function json(req: Request, status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });
}
const used = new Map<string, number>(); let usedDay = "", usedTotal = 0;
function take(device: string) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== usedDay) { used.clear(); usedTotal = 0; usedDay = day; }
  if (usedTotal >= GLOBAL_LIMIT || (used.get(device) ?? 0) >= DAY_LIMIT) return false;
  used.set(device, (used.get(device) ?? 0) + 1); usedTotal++; return true;
}
function blockedHost(h: string) {
  h = h.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || (!h.includes(".") && !h.includes(":"))) return true;
  if (h.includes(":") || h.startsWith("[")) return true; // IPv6 직접 주소 불허
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) { const a = +m[1], b = +m[2]; return a === 10 || a === 127 || a === 0 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127); }
  return false;
}
function decode(s: string) {
  return s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/&apos;|&#039;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();
}
function meta(html: string, keys: string[]) {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${k}["']`, "i");
    const m = html.match(re1) || html.match(re2);
    if (m && m[1].trim()) return decode(m[1]);
  }
  return "";
}
function ldProduct(html: string) {
  const out: { name?: string; price?: string; currency?: string; image?: string; material?: string } = {};
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  const walk = (o: unknown) => {
    if (!o || typeof o !== "object") return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    const x = o as Record<string, unknown>;
    const t = x["@type"];
    const isP = t === "Product" || (Array.isArray(t) && t.includes("Product"));
    if (isP) {
      if (!out.name && typeof x.name === "string") out.name = x.name;
      if (!out.material && typeof x.material === "string") out.material = x.material;
      const im = x.image;
      if (!out.image) out.image = typeof im === "string" ? im : Array.isArray(im) && typeof im[0] === "string" ? im[0] : undefined;
      const of = x.offers;
      const offs = Array.isArray(of) ? of : of ? [of] : [];
      for (const o2 of offs as Record<string, unknown>[]) {
        const p = o2.price ?? o2.lowPrice;
        if (!out.price && p != null) { out.price = String(p); out.currency = String(o2.priceCurrency ?? ""); }
      }
    }
    for (const v of Object.values(x)) if (v && typeof v === "object") walk(v);
  };
  while ((m = re.exec(html))) { try { walk(JSON.parse(m[1])); } catch { /* 깨진 JSON 은 건너뜀 */ } }
  return out;
}

// 소재(혼용률) 글: 페이지 글에서 "면 98% 폴리우레탄 2%" 같은 부분이나 "소재/Material:" 뒤의 짧은 글을 찾는다.
function findMaterial(html: string, ld: string) {
  if (ld) return ld.slice(0, 120);
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
  const t = decode(body).replace(/\s+/g, " ");
  const fib = "(?:면|코튼|cotton|폴리에스터|폴리|polyester|나일론|nylon|레이온|rayon|비스코스|viscose|아크릴|acrylic|울|wool|캐시미어|cashmere|린넨|마|linen|스판|스판덱스|spandex|엘라스탄|elastane|폴리우레탄|polyurethane|모달|modal|텐셀|tencel|라이오셀|lyocell|실크|견|silk|데님|denim)";
  const pct = new RegExp("(?:" + fib + "\s*\d{1,3}\s*%[\s,/+·]*){1,6}", "i");
  // 틀린 값보다 빈 값이 낫다: "소재/혼용률/Material/Composition" 표지 바로 뒤 120자 안에서만 혼용률을 찾는다
  const lab = /(?:소재|혼용률|혼용율|Material|Fabric|Composition)\s*[:：]?/gi;
  let m;
  while ((m = lab.exec(t))) {
    const seg = t.slice(m.index, m.index + 140);
    const p = seg.match(pct);
    if (p) return p[0].replace(/[\s,/+·]+$/, "").trim().slice(0, 120);
  }
  const k = t.match(/(?:소재|혼용률|Material|Fabric)\s*[:：]\s*([^|]{3,60}?)(?:\s{2,}|$|세탁|Washing|제조|Made)/i);
  return k ? k[1].trim().slice(0, 120) : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { error: "POST 만 가능합니다." });
  let body: { device?: string; url?: string };
  try { body = await req.json(); } catch { return json(req, 400, { error: "요청 형식이 올바르지 않습니다." }); }
  const device = String(body.device ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(device)) return json(req, 400, { error: "기기 식별자가 올바르지 않습니다." });
  let u: URL;
  try { u = new URL(String(body.url ?? "").trim()); } catch { return json(req, 400, { error: "주소가 올바르지 않아요." }); }
  if (u.protocol !== "https:" && u.protocol !== "http:") return json(req, 400, { error: "http/https 주소만 읽을 수 있어요." });
  if (blockedHost(u.hostname)) return json(req, 400, { error: "이 주소는 읽을 수 없어요." });
  if (!take(device)) return json(req, 429, { error: "오늘 링크 읽기 횟수를 모두 썼어요. 직접 입력해 주세요." });
  try {
    let cur = u;
    let res: Response | null = null;
    for (let i = 0; i < 4; i++) { // 리다이렉트는 매번 주소를 다시 검사하며 최대 3번 따라간다
      res = await fetch(cur.href, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0 (compatible; FitonLinkRead/1.0)", "Accept": "text/html,application/xhtml+xml", "Accept-Language": "ko,en;q=0.8" } });
      if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
        cur = new URL(res.headers.get("location")!, cur);
        if ((cur.protocol !== "https:" && cur.protocol !== "http:") || blockedHost(cur.hostname)) return json(req, 400, { error: "이 주소는 읽을 수 없어요." });
        res = null;
        continue;
      }
      break;
    }
    if (!res) return json(req, 502, { error: "주소가 너무 여러 번 넘어가요." });
    if (!res.ok) return json(req, 502, { error: "상품 페이지를 열지 못했어요(" + res.status + "). 직접 입력해 주세요." });
    const ct = res.headers.get("content-type") ?? "";
    if (!/html|xml/i.test(ct)) return json(req, 422, { error: "웹 페이지가 아니에요." });
    const reader = res.body!.getReader();
    const chunks: Uint8Array[] = [];
    let n = 0;
    while (n < MAX_BYTES) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); n += value.length; }
    try { await reader.cancel(); } catch { /* 이미 끝남 */ }
    const buf = new Uint8Array(n);
    let o = 0;
    for (const c of chunks) { buf.set(c, o); o += c.length; }
    let cs = (ct.match(/charset=([\w-]+)/i) || [])[1] || "";
    const head = new TextDecoder("utf-8").decode(buf.slice(0, 4096));
    if (!cs) cs = (head.match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1] || "utf-8";
    let html: string;
    try { html = new TextDecoder(cs).decode(buf); } catch { html = new TextDecoder("utf-8").decode(buf); }
    const ld = ldProduct(html);
    const title = decode(meta(html, ["og:title", "twitter:title"]) || ld.name || (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "").replace(/[ \s]+/g, " ").replace(/\s*[|｜]\s*[^|｜]{1,30}$/, "").replace(/\s+-\s*후기$/, "").trim();
    const price = meta(html, ["product:price:amount", "og:price:amount", "product:sale_price:amount"]) || ld.price || "";
    const currency = meta(html, ["product:price:currency", "og:price:currency"]) || ld.currency || "";
    let image = meta(html, ["og:image", "twitter:image"]) || ld.image || "";
    if (image) { try { image = new URL(image, cur).href; } catch { image = ""; } }
    const site = meta(html, ["og:site_name"]);
    const material = findMaterial(html, ld.material ?? "");
    if (!title && !price && !material) return json(req, 200, { found: false });
    return json(req, 200, { found: true, title: title.slice(0, 120), price: Number(String(price).replace(/,/g, "")) > 0 ? String(price).replace(/[^\d.,]/g, "") : "", currency, image, site, material });
  } catch (e) {
    console.error("linkread failed:", (e as Error).message);
    return json(req, 502, { error: "상품 페이지를 읽지 못했어요. 직접 입력해 주세요." });
  }
});
