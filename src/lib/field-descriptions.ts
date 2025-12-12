// 각 필드에 대한 도움말 설명
export const FIELD_DESCRIPTIONS: Record<string, string> = {
  // ============================================
  // Navigator 정보
  // ============================================
  userAgent:
    "브라우저와 OS 정보를 담은 문자열입니다. 봇 탐지에 자주 사용됩니다.",
  userAgentData:
    "User-Agent Client Hints API로 수집된 구조화된 브라우저/OS 정보입니다.",
  appName: "브라우저의 공식 이름입니다. 대부분 'Netscape'로 표시됩니다.",
  appVersion: "브라우저의 버전 정보입니다.",
  platform: "운영체제 플랫폼을 나타냅니다 (Win32, MacIntel 등).",
  vendor: "브라우저 제조사 또는 WebGL 벤더 정보입니다.",
  vendorSub: "브라우저 벤더의 부가 정보입니다.",
  product: "브라우저 엔진 이름입니다. 보통 'Gecko'입니다.",
  productSub: "브라우저 엔진의 빌드 번호입니다.",
  language: "브라우저의 기본 언어 설정입니다.",
  languages: "사용자가 선호하는 언어 목록입니다.",
  onLine: "현재 인터넷 연결 상태입니다.",
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

  // ============================================
  // Screen 정보
  // ============================================
  width: "화면의 가로 해상도(픽셀)입니다.",
  height: "화면의 세로 해상도(픽셀)입니다.",
  availWidth: "작업 표시줄 등을 제외한 사용 가능한 가로 크기입니다.",
  availHeight: "작업 표시줄 등을 제외한 사용 가능한 세로 크기입니다.",
  colorDepth: "화면의 색상 심도(비트)입니다. 보통 24 또는 32입니다.",
  pixelDepth: "픽셀당 비트 수입니다.",
  devicePixelRatio:
    "물리 픽셀과 CSS 픽셀의 비율입니다. Retina 디스플레이는 2 이상입니다.",
  orientation: "화면 방향(가로/세로)입니다.",
  orientationAngle: "화면 회전 각도(0, 90, 180, 270)입니다.",
  innerWidth: "브라우저 내부 콘텐츠 영역의 가로 크기입니다.",
  innerHeight: "브라우저 내부 콘텐츠 영역의 세로 크기입니다.",
  outerWidth: "브라우저 창 전체의 가로 크기입니다.",
  outerHeight: "브라우저 창 전체의 세로 크기입니다.",
  screenX: "브라우저 창의 X 좌표 위치입니다.",
  screenY: "브라우저 창의 Y 좌표 위치입니다.",
  pageXOffset: "페이지의 수평 스크롤 위치입니다.",
  pageYOffset: "페이지의 수직 스크롤 위치입니다.",
  visualViewportWidth: "비주얼 뷰포트의 가로 크기입니다.",
  visualViewportHeight: "비주얼 뷰포트의 세로 크기입니다.",
  visualViewportScale: "비주얼 뷰포트의 확대/축소 비율입니다.",

  // ============================================
  // Hardware 정보
  // ============================================
  batteryLevel: "배터리 잔량(%)입니다. 데스크톱에서는 보통 100%입니다.",
  batteryCharging: "충전 중 여부입니다.",
  batteryChargingTime: "완전 충전까지 남은 시간(초)입니다.",
  batteryDischargingTime: "배터리 소진까지 남은 시간(초)입니다.",
  batteryApi: "Battery API 접근 가능 여부입니다.",
  gamepadsSupported: "게임패드 API 지원 여부입니다.",
  usbSupported: "WebUSB API 지원 여부입니다.",
  bluetoothSupported: "Web Bluetooth API 지원 여부입니다.",
  serialSupported: "Web Serial API 지원 여부입니다.",
  hidSupported: "WebHID API 지원 여부입니다.",

  // ============================================
  // WebGL 정보
  // ============================================
  supported: "해당 기능의 지원 여부입니다.",
  version: "WebGL 또는 API 버전 정보입니다.",
  shadingLanguageVersion: "GLSL 셰이더 언어 버전입니다.",
  renderer: "WebGL 렌더러 정보입니다. 그래픽 카드를 식별할 수 있습니다.",
  unmaskedVendor: "실제 GPU 제조사 정보입니다.",
  unmaskedRenderer:
    "실제 GPU 모델 정보입니다. 매우 고유한 식별자가 될 수 있습니다.",
  maxTextureSize: "지원하는 최대 텍스처 크기입니다.",
  maxCubeMapTextureSize: "최대 큐브맵 텍스처 크기입니다.",
  maxRenderbufferSize: "최대 렌더버퍼 크기입니다.",
  maxViewportDims: "최대 뷰포트 크기입니다.",
  maxVertexAttribs: "버텍스 속성 최대 개수입니다.",
  maxVertexUniformVectors: "버텍스 셰이더 유니폼 벡터 최대 개수입니다.",
  maxVaryingVectors: "베어링 벡터 최대 개수입니다.",
  maxFragmentUniformVectors: "프래그먼트 셰이더 유니폼 벡터 최대 개수입니다.",
  maxVertexTextureImageUnits: "버텍스 텍스처 이미지 유닛 최대 개수입니다.",
  maxTextureImageUnits: "텍스처 이미지 유닛 최대 개수입니다.",
  maxCombinedTextureImageUnits: "통합 텍스처 이미지 유닛 최대 개수입니다.",
  aliasedLineWidthRange: "안티앨리어싱된 라인 너비 범위입니다.",
  aliasedPointSizeRange: "안티앨리어싱된 포인트 크기 범위입니다.",
  redBits: "빨강 색상 버퍼 비트 수입니다.",
  greenBits: "초록 색상 버퍼 비트 수입니다.",
  blueBits: "파랑 색상 버퍼 비트 수입니다.",
  alphaBits: "알파 버퍼 비트 수입니다.",
  depthBits: "깊이 버퍼 비트 수입니다.",
  stencilBits: "스텐실 버퍼 비트 수입니다.",
  extensions: "지원되는 WebGL 확장 목록입니다.",
  extensionsCount: "지원되는 WebGL 확장 개수입니다.",
  webgl2Supported: "WebGL 2.0 지원 여부입니다.",
  webgl2Version: "WebGL 2.0 버전입니다.",
  webgl2MaxSamples: "WebGL 2.0 최대 샘플 수입니다.",
  webgl2Max3DTextureSize: "WebGL 2.0 최대 3D 텍스처 크기입니다.",
  webgl2MaxArrayTextureLayers: "WebGL 2.0 최대 배열 텍스처 레이어 수입니다.",

  // ============================================
  // Canvas 정보
  // ============================================
  hash: "Canvas 또는 Audio 렌더링 결과의 해시값입니다. 고유 식별자로 사용됩니다.",
  dataURLLength: "Canvas 데이터 URL의 길이입니다.",
  dataURLPrefix: "Canvas 데이터 URL의 앞부분입니다.",

  // ============================================
  // Audio 정보
  // ============================================
  audioHash: "오디오 컨텍스트의 고유 해시값입니다.",
  sampleRate: "오디오 샘플 레이트(Hz)입니다.",
  channelCount: "오디오 출력 채널 수입니다.",
  maxChannelCount: "최대 오디오 출력 채널 수입니다.",
  state: "오디오 컨텍스트 상태입니다.",
  baseLatency: "기본 오디오 지연 시간입니다.",
  outputLatency: "오디오 출력 지연 시간입니다.",

  // ============================================
  // Fonts 정보
  // ============================================
  detectedFonts: "시스템에 설치된 것으로 감지된 폰트 목록입니다.",
  detectedCount: "감지된 폰트 개수입니다.",
  testedCount: "테스트한 총 폰트 개수입니다.",
  installedFonts: "시스템에 설치된 폰트 목록입니다. 매우 고유한 지문이 됩니다.",

  // ============================================
  // Plugins 정보
  // ============================================
  plugins: "브라우저에 설치된 플러그인 목록입니다.",
  pluginsCount: "설치된 플러그인 개수입니다.",
  mimeTypes: "지원되는 MIME 타입 목록입니다.",
  mimeTypesCount: "지원되는 MIME 타입 개수입니다.",

  // ============================================
  // Storage 정보
  // ============================================
  localStorageEnabled: "로컬 스토리지 지원 여부입니다.",
  sessionStorageEnabled: "세션 스토리지 지원 여부입니다.",
  indexedDBEnabled: "IndexedDB 지원 여부입니다.",
  webSQLEnabled: "Web SQL 지원 여부입니다 (비권장 기능).",
  storageQuota: "할당된 스토리지 용량입니다.",
  storageUsage: "사용 중인 스토리지 용량입니다.",
  storageEstimate: "스토리지 용량 추정 가능 여부입니다.",
  cacheAPIEnabled: "Cache API 지원 여부입니다.",

  // ============================================
  // Network 정보
  // ============================================
  connectionType: "네트워크 연결 유형(wifi, 4g 등)입니다.",
  effectiveType: "실제 네트워크 속도 등급입니다.",
  downlink: "다운로드 대역폭(Mbps)입니다.",
  rtt: "네트워크 왕복 시간(ms)입니다.",
  saveData: "데이터 절약 모드 활성화 여부입니다.",
  webrtcLocalIPs: "WebRTC로 노출될 수 있는 로컬 IP 주소입니다.",
  webrtcPublicIP: "WebRTC로 노출될 수 있는 공인 IP 주소입니다.",
  webRTCEnabled: "WebRTC 지원 여부입니다.",
  webSocketEnabled: "WebSocket 지원 여부입니다.",
  beaconEnabled: "Beacon API 지원 여부입니다.",
  fetchEnabled: "Fetch API 지원 여부입니다.",

  // ============================================
  // Permissions 정보
  // ============================================
  geolocation: "위치 정보 접근 권한 상태입니다.",
  notifications: "알림 권한 상태입니다.",
  push: "푸시 알림 권한 상태입니다.",
  camera: "카메라 접근 권한 상태입니다.",
  microphone: "마이크 접근 권한 상태입니다.",
  midi: "MIDI 장치 접근 권한 상태입니다.",
  accelerometer: "가속도계 센서 접근 권한입니다.",
  gyroscope: "자이로스코프 센서 접근 권한입니다.",
  magnetometer: "자기계 센서 접근 권한입니다.",
  "clipboard-read": "클립보드 읽기 권한입니다.",
  "clipboard-write": "클립보드 쓰기 권한입니다.",
  "payment-handler": "결제 처리 권한입니다.",
  "persistent-storage": "영구 저장소 권한입니다.",
  "screen-wake-lock": "화면 깨우기 잠금 권한입니다.",
  "xr-spatial-tracking": "XR 공간 추적 권한입니다.",
  permissionsAPI: "Permissions API 지원 여부입니다.",

  // ============================================
  // Features 정보
  // ============================================
  serviceWorker: "서비스 워커 지원 여부입니다.",
  webWorker: "웹 워커 지원 여부입니다.",
  sharedWorker: "공유 워커 지원 여부입니다.",
  pushManager: "푸시 매니저 지원 여부입니다.",
  webGL: "WebGL 지원 여부입니다.",
  webGL2: "WebGL 2.0 지원 여부입니다.",
  webGPU: "차세대 그래픽 API WebGPU 지원 여부입니다.",
  webgpu: "WebGPU API 지원 여부입니다.",
  mediaDevices: "미디어 장치 접근 API 지원 여부입니다.",
  mediaRecorder: "미디어 녹화 API 지원 여부입니다.",
  mediaSource: "미디어 소스 API 지원 여부입니다.",
  credentials: "Credentials API 지원 여부입니다.",
  webAuthn: "Web Authentication API 지원 여부입니다.",
  performanceObserver: "Performance Observer API 지원 여부입니다.",
  intersectionObserver: "Intersection Observer API 지원 여부입니다.",
  mutationObserver: "Mutation Observer API 지원 여부입니다.",
  resizeObserver: "Resize Observer API 지원 여부입니다.",
  bluetooth: "Web Bluetooth API 지원 여부입니다.",
  usb: "WebUSB API 지원 여부입니다.",
  serial: "Web Serial API 지원 여부입니다.",
  hid: "WebHID API 지원 여부입니다.",
  nfc: "Web NFC API 지원 여부입니다.",
  share: "Web Share API 지원 여부입니다.",
  clipboard: "Clipboard API 지원 여부입니다.",
  presentation: "Presentation API 지원 여부입니다.",
  wakeLock: "Screen Wake Lock API 지원 여부입니다.",
  xr: "WebXR API 지원 여부입니다.",
  speechRecognition: "음성 인식 API 지원 여부입니다.",
  speechSynthesis: "음성 합성 API 지원 여부입니다.",
  webAssembly: "WebAssembly 지원 여부입니다.",
  absoluteOrientationSensor: "절대 방향 센서 API 지원 여부입니다.",

  // ============================================
  // Timing 정보
  // ============================================
  timezone: "시스템 타임존입니다.",
  timezoneOffset: "UTC와의 시간차(분)입니다.",
  performanceNow: "고정밀 타이머 값입니다.",
  navigationStart: "페이지 탐색 시작 시간입니다.",
  domContentLoaded: "DOM 로드 완료까지 걸린 시간(ms)입니다.",
  loadComplete: "페이지 완전 로드까지 걸린 시간(ms)입니다.",
  locale: "시스템 로케일 설정입니다.",
  dateFormat: "날짜 형식 예시입니다.",
  numberFormat: "숫자 형식 예시입니다.",
  timerPrecision: "타이머 정밀도입니다. 지문 방지 기능이 있으면 낮아집니다.",

  // ============================================
  // Media 정보
  // ============================================
  audioCodecs: "지원되는 오디오 코덱 목록입니다.",
  videoCodecs: "지원되는 비디오 코덱 목록입니다.",
  eme: "Encrypted Media Extensions(DRM) 지원 여부입니다.",
  mse: "Media Source Extensions 지원 여부입니다.",
  audioInputDevices: "오디오 입력 장치(마이크) 개수입니다.",
  audioOutputDevices: "오디오 출력 장치(스피커) 개수입니다.",
  videoInputDevices: "비디오 입력 장치(카메라) 개수입니다.",
  mediaDevicesAccess: "미디어 장치 접근 권한 상태입니다.",
  pictureInPicture: "Picture-in-Picture 지원 여부입니다.",

  // ============================================
  // Client Hints 정보
  // ============================================
  brands: "브라우저 브랜드 정보입니다.",
  mobile: "모바일 기기 여부입니다.",
  architecture: "CPU 아키텍처(x86, arm 등)입니다.",
  bitness: "시스템 비트 수(32, 64)입니다.",
  fullVersionList: "브라우저 전체 버전 목록입니다.",
  model: "기기 모델명입니다.",
  platformVersion: "운영체제 버전입니다.",
  uaFullVersion: "User-Agent 전체 버전입니다.",
  wow64: "64비트 Windows에서 32비트 앱 실행 여부입니다.",
  formFactor: "기기 폼 팩터(Desktop, Mobile 등)입니다.",
  highEntropyValues: "고엔트로피 값 접근 가능 여부입니다.",
  prefersColorScheme: "선호하는 색상 모드(다크/라이트)입니다.",
  prefersReducedMotion: "애니메이션 감소 선호 여부입니다.",
  prefersContrast: "대비 선호도입니다.",
  forcedColors: "강제 색상 모드 활성화 여부입니다.",

  // ============================================
  // 기타
  // ============================================
  webgl: "WebGL API 지원 여부입니다.",
  webgl2: "WebGL 2.0 API 지원 여부입니다.",
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

// Stats 카드 설명
export const STATS_DESCRIPTIONS: Record<string, string> = {
  score:
    "수집된 데이터의 완벽도 점수입니다. 의심스러운 값이나 누락된 값이 많을수록 낮아집니다.",
  suspicious:
    "봇이나 자동화 도구의 특성을 나타내는 의심스러운 값이 감지된 항목 수입니다.",
  missing:
    "브라우저 설정이나 개인정보 보호 기능으로 인해 수집되지 않은 항목 수입니다.",
  total: "수집 시도한 총 데이터 항목 수입니다.",
  entropy:
    "수집된 데이터의 엔트로피(정보량)입니다. 높을수록 더 고유한 지문입니다.",
  uniqueness:
    "이 지문의 고유성 추정치입니다. 높을수록 다른 사용자와 구별되기 쉽습니다.",
};
