// 각 필드에 대한 도움말 설명
export const FIELD_DESCRIPTIONS: Record<string, string> = {
  // Navigator
  userAgent:
    "브라우저와 OS 정보를 담은 문자열입니다. 봇 탐지에 자주 사용됩니다.",
  platform: "운영체제 플랫폼을 나타냅니다 (Win32, MacIntel 등).",
  language: "브라우저의 기본 언어 설정입니다.",
  languages: "사용자가 선호하는 언어 목록입니다.",
  cookieEnabled:
    "쿠키 허용 여부입니다. false면 세션 관리가 불가능할 수 있습니다.",
  doNotTrack: "추적 거부(DNT) 설정 상태입니다.",
  hardwareConcurrency:
    "CPU의 논리 코어 수입니다. 기기 성능을 추정하는 데 사용됩니다.",
  deviceMemory: "기기의 RAM 용량(GB)입니다. 대략적인 값만 제공됩니다.",
  maxTouchPoints: "터치스크린 지원 포인트 수입니다. 0이면 터치 미지원입니다.",
  webdriver:
    "자동화 도구(Selenium 등) 사용 여부입니다. true면 봇으로 의심됩니다.",
  pdfViewerEnabled: "브라우저 내장 PDF 뷰어 활성화 여부입니다.",

  // Screen
  width: "화면의 가로 해상도(픽셀)입니다.",
  height: "화면의 세로 해상도(픽셀)입니다.",
  availWidth: "작업 표시줄 등을 제외한 사용 가능한 가로 크기입니다.",
  availHeight: "작업 표시줄 등을 제외한 사용 가능한 세로 크기입니다.",
  colorDepth: "화면의 색상 심도(비트)입니다. 보통 24 또는 32입니다.",
  pixelDepth: "픽셀당 비트 수입니다.",
  devicePixelRatio:
    "물리 픽셀과 CSS 픽셀의 비율입니다. Retina 디스플레이는 2 이상입니다.",
  orientation: "화면 방향(가로/세로)입니다.",

  // Hardware
  batteryLevel: "배터리 잔량(0~1)입니다. 데스크톱에서는 보통 1입니다.",
  batteryCharging: "충전 중 여부입니다.",

  // WebGL
  vendor: "WebGL 벤더(제조사) 정보입니다.",
  renderer: "WebGL 렌더러 정보입니다. 그래픽 카드를 식별할 수 있습니다.",
  unmaskedVendor: "실제 GPU 제조사 정보입니다.",
  unmaskedRenderer:
    "실제 GPU 모델 정보입니다. 매우 고유한 식별자가 될 수 있습니다.",
  supported: "해당 기능의 지원 여부입니다.",

  // Canvas
  hash: "Canvas 렌더링 결과의 해시값입니다. 브라우저/GPU 조합에 따라 고유합니다.",

  // Audio
  audioHash: "오디오 컨텍스트의 고유 해시값입니다.",
  sampleRate: "오디오 샘플 레이트(Hz)입니다.",
  channelCount: "오디오 출력 채널 수입니다.",

  // Fonts
  installedFonts: "시스템에 설치된 폰트 목록입니다. 매우 고유한 지문이 됩니다.",

  // Storage
  localStorageEnabled: "로컬 스토리지 지원 여부입니다.",
  sessionStorageEnabled: "세션 스토리지 지원 여부입니다.",
  indexedDBEnabled: "IndexedDB 지원 여부입니다.",

  // Network
  connectionType: "네트워크 연결 유형(wifi, 4g 등)입니다.",
  effectiveType: "실제 네트워크 속도 등급입니다.",
  downlink: "다운로드 대역폭(Mbps)입니다.",
  rtt: "네트워크 왕복 시간(ms)입니다.",
  saveData: "데이터 절약 모드 활성화 여부입니다.",
  webrtcLocalIPs: "WebRTC로 노출될 수 있는 로컬 IP 주소입니다.",
  webrtcPublicIP: "WebRTC로 노출될 수 있는 공인 IP 주소입니다.",

  // Timing
  timezone: "시스템 타임존입니다.",
  timezoneOffset: "UTC와의 시간차(분)입니다.",
  performanceNow: "고정밀 타이머 값입니다.",

  // Permissions
  geolocation: "위치 정보 접근 권한 상태입니다.",
  notifications: "알림 권한 상태입니다.",
  camera: "카메라 접근 권한 상태입니다.",
  microphone: "마이크 접근 권한 상태입니다.",

  // Features
  webGL: "WebGL 지원 여부입니다.",
  webGL2: "WebGL 2.0 지원 여부입니다.",
  webGPU: "차세대 그래픽 API WebGPU 지원 여부입니다.",
  serviceWorker: "서비스 워커 지원 여부입니다.",
  webAssembly: "WebAssembly 지원 여부입니다.",
  bluetooth: "Web Bluetooth API 지원 여부입니다.",

  // Media
  audioCodecs: "지원되는 오디오 코덱 목록입니다.",
  videoCodecs: "지원되는 비디오 코덱 목록입니다.",
  mediaDevices: "사용 가능한 미디어 장치 수입니다.",
};

// 의심스러운 값에 대한 경고 메시지
export const SUSPICIOUS_WARNINGS: Record<string, string> = {
  webdriver:
    "자동화 도구(Selenium, Puppeteer 등)가 감지되었습니다. 봇으로 판단될 수 있습니다.",
  headless: "헤드리스 브라우저가 감지되었습니다. 자동화 환경으로 의심됩니다.",
  phantom: "PhantomJS가 감지되었습니다. 오래된 자동화 도구입니다.",
  selenium: "Selenium WebDriver가 감지되었습니다.",
  puppeteer: "Puppeteer가 감지되었습니다.",
  playwright: "Playwright가 감지되었습니다.",
};

// 누락된 값에 대한 경고 메시지
export const MISSING_WARNINGS: Record<string, string> = {
  userAgent: "User-Agent가 누락되었습니다. 브라우저 식별이 불가능합니다.",
  language: "언어 설정이 누락되었습니다.",
  timezone: "타임존 정보가 누락되었습니다.",
  canvas:
    "Canvas 지문을 수집할 수 없습니다. 개인정보 보호 설정이 적용된 것 같습니다.",
  webgl: "WebGL 정보를 수집할 수 없습니다.",
};
