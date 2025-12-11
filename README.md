# 🔍 Fingerprint Detector

브라우저 지문(Browser Fingerprint)을 수집하고 분석하는 웹 애플리케이션입니다.

![Next.js](https://img.shields.io/badge/Next.js-16.0.8-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.x-38B2AC?style=flat-square&logo=tailwind-css)
![ProxyCheck](https://img.shields.io/badge/ProxyCheck.io-v3-orange?style=flat-square)

## ✨ 주요 기능

### 🖥️ 브라우저 지문 수집

- **Navigator 정보**: User Agent, 언어, 플랫폼, 하드웨어 동시성 등
- **Screen 정보**: 해상도, 색상 깊이, 픽셀 비율
- **WebGL 정보**: 렌더러, 벤더, 지원 확장 기능
- **Audio 지문**: AudioContext 기반 고유 식별자
- **Canvas 지문**: 2D Canvas 렌더링 기반 해시
- **Font 감지**: 시스템 설치 폰트 목록
- **기타**: 터치 지원, 배터리 상태, 연결 정보 등

### 🌐 IP 분석 (ProxyCheck.io v3 API)

- **위치 정보**: 국가, 도시, ISP, ASN
- **위협 감지**: VPN, Proxy, Tor, Hosting, Bot 탐지
- **위험도 점수**: 0-100 기반 위험도 평가
- **VPN 운영자 정보**: VPN 서비스 상세 정보

### 🔐 보안 분석

- **의심 항목 감지**: 자동화 도구/봇 특성 탐지
- **누락 항목 분석**: 브라우저 설정으로 차단된 정보 표시
- **완벽도 점수**: 수집된 지문의 품질 평가

## 🚀 시작하기

### 필수 요구사항

- Node.js 18.x 이상
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/fingerprint-detector.git
cd fingerprint-detector

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
```

### 환경 변수

`.env.local` 파일에 ProxyCheck.io API 키를 설정하세요:

```env
PROXYCHECK_API_KEY=your-api-key-here
```

> 💡 [ProxyCheck.io](https://proxycheck.io/)에서 무료 API 키를 발급받을 수 있습니다 (1,000 쿼리/일).

### 실행

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
npm start
```

브라우저에서 `http://localhost:3000`으로 접속하세요.

## 🔧 curl API

ipinfo.io처럼 터미널에서 curl로 IP 정보를 확인할 수 있습니다:

```bash
# 기본 사용
curl localhost:3000/api

# 배포 후
curl https://your-domain.com/api
```

### 응답 예시

```json
{
  "ip": "203.237.81.62",
  "city": "Seoul",
  "region": "Seoul",
  "country": "South Korea",
  "country_code": "KR",
  "continent": "Asia",
  "timezone": "Asia/Seoul",
  "isp": "Korea Telecom",
  "org": "Korea Telecom",
  "asn": "AS4766",
  "network_type": "Residential",
  "location": {
    "latitude": 37.566,
    "longitude": 126.9784
  },
  "risk": {
    "score": 0,
    "level": "low",
    "vpn": false,
    "proxy": false,
    "tor": false,
    "hosting": false,
    "bot": false,
    "anonymous": false
  }
}
```

## 🛠️ 기술 스택

| 분류            | 기술                      |
| --------------- | ------------------------- |
| **Framework**   | Next.js 16 (App Router)   |
| **Language**    | TypeScript                |
| **Styling**     | Tailwind CSS 4, Shadcn/UI |
| **IP Analysis** | ProxyCheck.io v3 API      |
| **State**       | React Hooks               |

## 📁 프로젝트 구조

```
fingerprint-detector/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── route.ts        # curl JSON API
│   │   ├── globals.css         # 전역 스타일 (다크 테마)
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   └── page.tsx            # 메인 페이지
│   ├── components/
│   │   ├── ip/
│   │   │   └── IPInfoCard.tsx  # IP 정보 카드
│   │   ├── summary/
│   │   │   └── BrowserSummaryCard.tsx
│   │   └── ui/                 # Shadcn UI 컴포넌트
│   └── lib/
│       ├── fingerprint.ts      # 브라우저 지문 수집
│       ├── ip-analyzer.ts      # ProxyCheck.io 분석기
│       ├── ip-types.ts         # IP 타입 정의
│       └── field-descriptions.ts # 필드 설명
├── public/
├── .env.local                  # 환경 변수
└── package.json
```

## 📋 수집하는 데이터

### Navigator (16개 항목)

- userAgent, language, languages, platform
- hardwareConcurrency, deviceMemory, maxTouchPoints
- cookieEnabled, doNotTrack, pdfViewerEnabled
- webdriver, vendor, appCodeName 등

### Screen (8개 항목)

- width, height, availWidth, availHeight
- colorDepth, pixelDepth, devicePixelRatio
- orientation

### WebGL (4개 항목)

- vendor, renderer, version, extensions

### Audio (2개 항목)

- audioFingerprint (SHA-256 해시)
- sampleRate

### Canvas (2개 항목)

- canvasFingerprint (SHA-256 해시)
- supportedFormats

### Fonts (2개 항목)

- detectedFonts, fontCount

### Hardware (4개 항목)

- connectionType, batteryLevel, charging
- deviceType

## ⚠️ 주의사항

- 이 도구는 **교육 및 연구 목적**으로 제작되었습니다.
- 브라우저 지문 수집은 개인정보 보호에 민감한 영역입니다.
- 실제 서비스에 적용 시 사용자 동의를 받아야 합니다.
- ProxyCheck.io 무료 플랜은 일일 1,000 쿼리로 제한됩니다.

## 📄 라이선스

MIT License

## 🤝 기여하기

이슈와 PR을 환영합니다!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
