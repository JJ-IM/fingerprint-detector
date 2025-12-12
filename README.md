# 🔐 Fingerprint Detector

브라우저 및 IP 핑거프린트를 수집하고 분석하는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🖥️ 브라우저 핑거프린트
- **Canvas/WebGL 핑거프린트** - 그래픽 렌더링 기반 고유 식별
- **Audio 핑거프린트** - 오디오 처리 특성 분석
- **하드웨어 정보** - CPU 코어, 메모리, GPU 정보 수집
- **화면 정보** - 해상도, 색상 깊이, 픽셀 비율
- **폰트 감지** - 설치된 시스템 폰트 탐지
- **권한 상태** - 카메라, 마이크, 위치 등 권한 확인
- **SHA-256 해시** - 전체 핑거프린트의 고유 해시 생성

### 🌐 IP 분석 (Multi-Source)
- **ProxyCheck.io + ip-api.com** 동시 조회로 정확도 향상
- **위치 정보** - 국가, 지역, 도시, 좌표
- **ISP/ASN 정보** - 인터넷 서비스 제공자 정보
- **위협 탐지** - VPN, Proxy, Tor, Hosting, Bot 감지
- **위험도 점수** - 0-100 종합 위험 점수
- **지도 시각화** - Leaflet/OpenStreetMap 기반 위치 표시

### 📟 CLI API (ipinfo.io 스타일)
```bash
# 내 IP 정보 조회
curl http://localhost:3000

# 특정 IP 조회
curl http://localhost:3000/8.8.8.8
```

## 🚀 시작하기

### 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치

```bash
# 저장소 클론
git clone https://github.com/your-repo/fingerprint-detector.git
cd fingerprint-detector

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env

# 개발 서버 시작
npm run dev
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── cli/              # CLI API 엔드포인트
│   │   │   ├── route.ts      # GET / (내 IP)
│   │   │   └── [ip]/route.ts # GET /:ip
│   │   ├── ip/analyze/       # IP 분석 API
│   │   └── route.ts          # 기본 API
│   ├── fingerprint/          # 핑거프린트 페이지
│   └── page.tsx              # 메인 페이지 (리다이렉트)
├── components/
│   ├── ip/
│   │   ├── IPInfoCard.tsx    # IP 정보 카드
│   │   └── IPMap.tsx         # 지도 컴포넌트
│   ├── summary/
│   │   └── BrowserSummaryCard.tsx
│   └── ui/                   # shadcn/ui 컴포넌트
├── lib/
│   ├── fingerprint.ts        # 핑거프린트 수집 로직
│   ├── ip-analyzer.ts        # ProxyCheck.io 분석기
│   ├── ip-api-analyzer.ts    # ip-api.com 분석기
│   ├── multi-source-analyzer.ts # 멀티소스 통합 분석
│   └── types.ts              # 타입 정의
└── middleware.ts             # curl/브라우저 라우팅
```

## 🔧 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `PROXYCHECK_API_KEY` | ✅ | ProxyCheck.io API 키 |

## 📡 API 엔드포인트

### 브라우저 접속
- `GET /` → `/fingerprint`로 리다이렉트
- `GET /fingerprint` → 핑거프린트 대시보드

### CLI 접속 (curl)
- `GET /` → JSON 형식으로 요청 IP 정보 반환
- `GET /:ip` → 지정된 IP 정보 조회

### 내부 API
- `POST /api/ip/analyze` → IP 분석 (ProxyCheck + ip-api)

## 🛠️ 기술 스택

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Map:** Leaflet + OpenStreetMap
- **IP Analysis:** ProxyCheck.io, ip-api.com

## 📝 라이선스

MIT License
