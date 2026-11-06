// 실행: node aifit/tests/test-fit-notes.js  (fiton 폴더에서)
const assert = require('assert');
const FN = require('../../fit-notes.js');
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('PASS |', name); } catch (e) { fail++; console.log('FAIL |', name, '\n   ', e.message); } };
const row = (label, o) => Object.assign({ label }, o);
// 쿠팡 부츠컷 팬츠(단면, 받은 폴더 샘플과 같은 값) — 앱 저장 형식(문자열)
const coupang = { id: 'p1', cat: 'bottom', name: '여성 부츠컷 팬츠', measureType: 'flat', sizes: [
  row('S', { waist: '32', hip: '41', thigh: '24', rise: '25', length: '100' }), row('M', { waist: '34', hip: '43', thigh: '25', rise: '26', length: '100' }),
  row('L', { waist: '36', hip: '45', thigh: '26', rise: '27', length: '101' }), row('XL', { waist: '38', hip: '47', thigh: '27', rise: '28', length: '101' })] };
const body = { height: 165, waist: 70, hip: 96, thigh: 57, chest: 86, shoulder: 39.6, inseam: 72.6, arm: 52.8 };
t('쿠팡 샘플: 표 변환(단면→둘레)', () => { const tb = FN.tableOf(coupang); assert.strictEqual(tb[0][1], '허리단면'); assert.strictEqual(tb.length, 5); });
t('쿠팡 샘플: 안내 슬라이드가 나오고 분석 결과 포함', () => {
  const r = FN.forSet([{ item: coupang, size: 'M' }], { gender: 'female' }, body);
  assert.ok(r && r.slides.length >= 3); assert.ok(r.slides.some(s => s.type === 'result'), JSON.stringify(r.slides.map(s => s.title)));
  assert.ok(r.slides.filter(s => s.type === 'tip').length >= 2); assert.ok(r.footer);
});
t('빈칸이 있는 사이즈를 골라도 안 죽음(받은 코드 버그 수정)', () => {
  const it = JSON.parse(JSON.stringify(coupang)); it.name = '여성 슬랙스'; it.sizes[0].hip = ''; it.sizes[0].waist = '34'; // 고른 S는 엉덩이 칸이 비었고, 추천은 다른 사이즈
  const r = FN.forSet([{ item: it, size: 'S' }], { gender: 'female' }, body);
  assert.ok(r && r.slides.length >= 2); assert.ok(r.slides.some(s => s.type === 'result'), JSON.stringify(r.slides.map(s => s.title)));
});
t('여성은 women 기준으로 계산(female→women)', () => {
  assert.strictEqual(FN.aiGender('female'), 'women'); assert.strictEqual(FN.aiGender('male'), 'men'); assert.strictEqual(FN.aiGender(undefined), 'women');
});
t('내 키 없으면 분석 결과 없이 안내만', () => {
  const r = FN.forSet([{ item: coupang, size: 'M' }], { gender: 'female' }, {});
  assert.ok(r && r.slides.length >= 2); assert.ok(!r.slides.some(s => s.type === 'result'));
});
t('값이 하나도 없는 옷은 일반 팁만', () => {
  const it = { id: 'p2', cat: 'top', name: '빈 상의', measureType: 'flat', sizes: [{ label: 'S' }, { label: 'M' }] };
  const r = FN.forSet([{ item: it, size: 'M' }], { gender: 'female' }, body);
  assert.ok(r && r.slides.length >= 2 && r.slides.every(s => s.type === 'tip'));
});
t('신발만 입히면 일반 팁만, 오류 없음', () => {
  const it = { id: 'p3', cat: 'shoe', name: '신발', sizes: [{ label: '250', inner: '245' }] };
  const r = FN.forSet([{ item: it, size: '250' }], { gender: 'female' }, body);
  assert.ok(r && r.slides.every(s => s.type === 'tip'));
});
t('상의+하의 같이: 옷 이름이 앞에 붙고 팁 중복 없음', () => {
  const top = { id: 'p4', cat: 'top', name: '니트', measureType: 'flat', sizes: [row('S', { chest: '48', shoulder: '40', length: '60', sleeve: '58' }), row('M', { chest: '50', shoulder: '42', length: '62', sleeve: '59' })] };
  const r = FN.forSet([{ item: top, size: 'M' }, { item: coupang, size: 'M' }], { gender: 'female' }, body);
  const titles = r.slides.map(s => s.title); assert.strictEqual(new Set(titles).size, titles.length);
  assert.ok(titles.some(x => x.startsWith('[니트]')) && titles.some(x => x.startsWith('[여성 부츠컷')), titles.join(' | '));
});
t('둘레로 적힌 표(measureType circ)도 변환', () => {
  const it = JSON.parse(JSON.stringify(coupang)); it.measureType = 'circ'; it.sizes.forEach(s => { s.waist *= 1; s.waist = String(parseFloat(s.waist) * 2); s.hip = String(parseFloat(s.hip) * 2); s.thigh = String(parseFloat(s.thigh) * 2); });
  const r = FN.forSet([{ item: it, size: 'M' }], { gender: 'female' }, body); assert.ok(r.slides.some(s => s.type === 'result'));
});
console.log(`\n총 ${pass + fail}개 중 ${pass}개 통과, ${fail}개 실패`); process.exit(fail ? 1 : 0);
