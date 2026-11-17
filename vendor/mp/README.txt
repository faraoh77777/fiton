옷만 합치기(pc.js clothMerge)에 쓰는 사람 영역 구분 모델과 실행 파일.
- vision_bundle.mjs, wasm/vision_wasm_internal.js, wasm/vision_wasm_internal.wasm : MediaPipe Tasks Vision (@mediapipe/tasks-vision), Apache License 2.0
- selfie_multiclass.tflite : MediaPipe Image Segmenter "selfie_multiclass_256x256" 모델, Apache License 2.0
  구분: 0 배경 / 1 머리카락 / 2 몸 피부 / 3 얼굴 피부 / 4 옷 / 5 기타(신발·액세서리)
기기 안에서만 돌고 그림을 밖으로 보내지 않는다. 처음 쓸 때 한 번 내려받는다(약 26MB).
