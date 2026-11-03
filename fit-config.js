/* 핏 기준표. 실제 착용감과 비교하며 여기 값을 보정한다. (앱 하단 "등급 기준 보정"에서도 수정 가능)
   th = [쪼임/타이트 경계, 타이트/정핏 경계, 정핏/여유 경계, 여유/오버핏 경계]  (단위: cm, 신발은 mm)
   예) chest [0,5,11,19] → <0 쪼임, 0~4 타이트, 5~10 정핏, 11~18 여유, 19~ 오버핏 */
(function (root) {
  var CONFIG = {
    version: 1,
    grades: {
      chest: { label: '가슴', unit: 'cm', th: [0, 5, 11, 19] },
      waist: { label: '허리', unit: 'cm', th: [0, 3, 9, 16] },
      hip:   { label: '엉덩이', unit: 'cm', th: [0, 4, 10, 18] },
      thigh: { label: '허벅지', unit: 'cm', th: [0, 4, 11, 19] },
      shoe:  { label: '신발 안쪽 여유', unit: 'mm', th: [3, 7, 13, 18] }
    },
    gradeNames: {
      body: ['쪼임', '타이트', '정핏', '여유', '오버핏'],
      shoe: ['작음', '약간 작음', '딱 맞음', '여유', '큼']
    },
    /* 소재 보정: 둘레 항목 여유분에 더해서 등급을 판정한다(+ 이면 쪼임 허용 범위가 넓어짐) */
    fabric: {
      normal: { label: '일반', bonus: 0 },
      stretch: { label: '스판', bonus: 3 },
      knit: { label: '니트', bonus: 2 },
      denim: { label: '데님', bonus: -1 }
    },
    /* 선호 핏별 이상적인 여유분 (사이즈 추천에 사용) */
    ideal: {
      chest: { tight: 2, fit: 8, loose: 14, over: 22 },
      waist: { tight: 1, fit: 5, loose: 11, over: 18 },
      shoe:  { tight: 5, fit: 10, loose: 14, over: 18 }
    },
    prefNames: { tight: '타이트', fit: '정핏', loose: '여유', over: '오버핏' },
    /* 실측표 없이 사이즈 이름(S·M·55·95·30 등)만 있을 때 쓰는 표준 몸 치수(둘레 cm). 초안: 국내 의류 사이즈(KS 호칭) 기준 대략값이라
       실제 쇼핑몰 사이즈표와 비교하며 보정한다. 몸 치수 + ease = 그 사이즈 옷의 추정 둘레(그 사이즈가 딱 맞는 사람이 '정핏'으로 나오게).
       steps: [호칭들, 가슴, 허리, 엉덩이]. 공용(unisex) 옷은 남성 표를 쓴다. 바지 인치(22~40)는 허리 = 인치 × 2.54 로 바로 쓴다.
       여성 숫자 호칭 85·90·95·100·105·110 은 몸 가슴둘레가 아니라 44·55·66·77·88·99 와 같은 사이즈다(여성 가슴은 「한국 의류 스타일별 사이즈 정리」
       환산표의 몸 가슴 구간 가운데 값, 예: 55 = 82~85cm → 83.5). 남성 90·95·100 은 몸 가슴둘레와 거의 같다 */
    stdSizes: {
      ease: { chest: 8, waist: 4, hip: 6 },
      female: [
        [['XS', '44', '85'], 80, 64, 88],
        [['S', '55', '90'], 83.5, 67, 91],
        [['M', '66', '95'], 87.5, 70, 94],
        [['L', '77', '100'], 92, 76, 98],
        [['XL', '88', '105'], 97, 82, 102],
        [['XXL', '2XL', '99', '110'], 102.5, 88, 106]
      ],
      male: [
        [['XS', '85'], 85, 70, 86],
        [['S', '90'], 90, 74, 90],
        [['M', '95'], 95, 80, 94],
        [['L', '100'], 100, 85, 98],
        [['XL', '105'], 105, 90, 102],
        [['XXL', '2XL', '110'], 110, 95, 106],
        [['XXXL', '3XL', '115'], 115, 100, 110]
      ],
      free: 'M' /* FREE·F·ONE SIZE 는 이 호칭으로 본다 */
    },
    /* 치수를 입력하지 않았을 때의 추정식 (초안. 사이즈코리아 통계로 교체 예정) */
    estimate: {
      male:   { chest: [0.47, 11],  shoulder: [0.255, 0],    waist: [0.40, 9.2], hip: [0.52, 4.6], thigh: [0.30, 4.0] },
      female: { chest: [0.47, 7.5], shoulder: [0.255, -3.5], waist: [0.40, 3.2], hip: [0.52, 5.5], thigh: [0.30, 4.5] },
      bmiSlope: { chest: 1.9, waist: 2.2, hip: 1.6, thigh: 1.2, shoulder: 0.1 }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = CONFIG;
  else root.FIT_CONFIG = CONFIG;
})(typeof window !== 'undefined' ? window : globalThis);
