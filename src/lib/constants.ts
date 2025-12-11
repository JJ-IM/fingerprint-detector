export const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  navigator:
    "브라우저와 운영체제에 대한 기본 정보를 포함합니다. User-Agent 문자열과 언어 설정 등이 포함됩니다.",
  screen:
    "디스플레이 화면의 크기, 색상 깊이, 방향 정보를 포함합니다. 다중 모니터 사용 여부를 추정할 수 있습니다.",
  hardware:
    "CPU 코어 수, 메모리 용량, 배터리 상태 등 기기의 하드웨어적 특성을 나타냅니다.",
  webgl:
    "WebGL 그래픽 렌더링 엔진의 정보를 담고 있습니다. 그래픽 카드(GPU) 모델을 식별하는 데 사용됩니다.",
  canvas:
    "HTML5 Canvas 요소를 이용해 렌더링된 이미지의 해시값입니다. 그래픽 드라이버와 브라우저 조합에 따라 고유한 값이 생성됩니다.",
  audio:
    "오디오 하드웨어와 소프트웨어 스택의 특성을 분석하여 생성된 고유 식별자입니다.",
  fonts:
    "시스템에 설치된 폰트 목록을 확인합니다. 설치된 폰트의 조합은 사용자마다 매우 고유할 수 있습니다.",
  plugins:
    "브라우저에 설치된 플러그인 목록입니다. 최근 브라우저에서는 보안상의 이유로 정보가 제한적일 수 있습니다.",
  storage:
    "쿠키, 로컬 스토리지 등 브라우저의 저장소 기능 지원 여부를 확인합니다.",
  network:
    "네트워크 연결 상태, 속도, IP 주소 노출 여부(WebRTC) 등을 확인합니다.",
  permissions:
    "위치, 카메라, 마이크 등 브라우저 권한의 현재 상태를 보여줍니다.",
  features: "브라우저가 지원하는 최신 웹 기술과 API 목록입니다.",
  timing:
    "시스템 시간, 타임존, 성능 타이밍 정보를 포함합니다. 프록시 사용 여부를 탐지하는 데 도움이 될 수 있습니다.",
  media: "지원되는 오디오/비디오 코덱과 미디어 장치 정보를 확인합니다.",
  clientHints:
    "User-Agent Client Hints API를 통해 수집된 더 정확한 브라우저 및 기기 정보입니다.",
};

export const CATEGORY_TITLES: Record<string, string> = {
  navigator: "네비게이터 정보",
  screen: "화면 정보",
  hardware: "하드웨어",
  webgl: "WebGL",
  canvas: "Canvas 지문",
  audio: "오디오 지문",
  fonts: "시스템 폰트",
  plugins: "플러그인",
  storage: "스토리지 & 쿠키",
  network: "네트워크",
  permissions: "권한 정보",
  features: "브라우저 기능",
  timing: "타이밍 정보",
  media: "미디어 기능",
  clientHints: "Client Hints",
};
