# 🔐 Fingerprint Detector

> 브라우저 및 IP 핑거프린트를 수집하고 분석하는 웹 애플리케이션

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 📋 목차

- [주요 기능](#-주요-기능)
- [데모](#-데모)
- [시작하기](#-시작하기)
- [CLI 사용법](#-cli-사용법)
- [프로젝트 구조](#-프로젝트-구조)
- [환경 변수](#-환경-변수)
- [API 엔드포인트](#-api-엔드포인트)
- [로그 시스템](#-로그-시스템)
- [기술 스택](#%EF%B8%8F-기술-스택)
- [라이선스](#-라이선스)

---

## ✨ 주요 기능

### 🖥️ 브라우저 핑거프린트

| 기능              | 설명                                     |
| ----------------- | ---------------------------------------- |
| Canvas 핑거프린트 | 3종 테스트 이미지로 렌더링 차이 분석     |
| WebGL 핑거프린트  | GPU 정보 및 그래픽 렌더링 특성 추출      |
| Audio 핑거프린트  | 오디오 처리 특성 분석                    |
| 하드웨어 정보     | CPU 코어, 메모리, GPU, 터치스크린 정보   |
| 화면 정보         | 해상도, 색상 깊이, 픽셀 비율(HiDPI)      |
| 폰트 감지         | 설치된 시스템 폰트 탐지                  |
| 권한 상태         | 카메라, 마이크, 위치 등                  |
| 위변조 탐지       | CreepJS 스타일 브라우저 스푸핑/조작 감지 |
| 추적 가능성 점수  | 실제 통계 기반 고유성 및 엔트로피 계산   |
| SHA-256 해시      | 전체 핑거프린트의 고유 해시              |

#### Canvas 테스트 이미지

3종류의 Canvas 테스트로 브라우저별 렌더링 차이를 분석합니다:

| 테스트 | 이름                | 분석 대상                              |
| ------ | ------------------- | -------------------------------------- |
| 1      | 텍스트 & 도형       | 폰트 렌더링, 안티앨리어싱, 베지어 곡선 |
| 2      | 이모지 & 유니코드   | 이모지 렌더링, 다국어 폰트 지원        |
| 3      | 그라데이션 & 투명도 | 색상 블렌딩, 알파 채널 처리            |

### 🌐 IP 분석 (Multi-Source)

두 개의 API를 **병렬 호출**하여 정확도와 안정성 향상:

| API           | 용도                | 특징                         |
| ------------- | ------------------- | ---------------------------- |
| ProxyCheck.io | VPN/Proxy 탐지 특화 | 위험도 점수, VPN 운영자 정보 |
| ip-api.com    | 위치 정보 특화      | 무료, 빠른 응답              |

**탐지 항목:**

- 🛡️ VPN, Proxy, Tor, Relay 감지
- 🏢 Hosting, Bot, 공격 이력 탐지
- 📍 위치 정보 (국가, 지역, 도시, 좌표)
- 🌐 ISP/ASN 네트워크 정보
- ⚠️ 종합 위험도 점수 (0-100)

**예약된 IP 검증:**

CLI에서 사설 IP, 루프백, CGNAT, 멀티캐스트 등 RFC 예약 IP 조회 시 적절한 오류 메시지 반환

### 🗺️ 지도 시각화

- Leaflet + OpenStreetMap 기반
- IP 위치 마커 표시
- 반응형 디자인 지원

### 📊 브라우저 요약 카드

각 항목에 마우스를 올리면 상세 설명 툴팁 표시:

- 브라우저, 운영체제, 해상도
- 언어, 시간대, CPU, 메모리
- GPU, 화면 비율(HiDPI)
- 터치 지원, WebGL, Canvas 해시

---

## 🎯 데모

**라이브 데모:** [https://ip.zer0.kr](https://ip.zer0.kr)

### 웹 인터페이스

브라우저로 접속하면 핑거프린트 대시보드가 표시됩니다.

### CLI (ipinfo.io 스타일)

```bash
# 내 IP 정보 조회
curl -L ip.zer0.kr

# 특정 IP 조회
curl -L ip.zer0.kr/8.8.8.8
```

**응답 예시:**

```json
{
  "ip": "58.XXX.226.XXX",
  "city": "Seoul",
  "country": "South Korea",
  "isp": "SK Broadband Co Ltd",
  "security": {
    "risk_score": 0,
    "vpn": false,
    "proxy": false,
    "tor": false
  }
}
```

---

## 🚀 시작하기

### 요구사항

- Node.js 18+
- npm, yarn, 또는 pnpm

### 설치

```bash
# 저장소 클론
git clone https://github.com/JJ-IM/fingerprint-detector.git
cd fingerprint-detector

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에서 PROXYCHECK_API_KEY 설정

# 개발 서버 시작
npm run dev
```

### 빌드 & 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm start
```

---

## 📟 CLI 사용법 (직접 구축시)

### 내 IP 조회

```bash
curl http://localhost:3000
# 또는
curl http://localhost:3000/api/cli
```

### 특정 IP 조회

```bash
curl http://localhost:3000/8.8.8.8
# 또는
curl http://localhost:3000/api/cli/8.8.8.8
```

### 응답 필드

| 필드                        | 설명                  |
| --------------------------- | --------------------- |
| `ip`                        | IP 주소               |
| `city`, `region`, `country` | 위치 정보             |
| `isp`, `org`, `asn`         | 네트워크 정보         |
| `security.risk_score`       | 위험도 점수 (0-100)   |
| `security.vpn/proxy/tor`    | 익명화 도구 사용 여부 |
| `_meta.sources`             | 사용된 API 상태       |

---

## 📁 프로젝트 구조

```text
src/
├── app/
│   ├── api/
│   │   ├── cli/                  # CLI API
│   │   │   ├── route.ts          # GET / (내 IP)
│   │   │   └── [ip]/route.ts     # GET /:ip (특정 IP)
│   │   ├── ip/analyze/           # 웹용 IP 분석 API
│   │   ├── [ip]/route.ts         # 단축 경로 /:ip
│   │   └── route.ts              # 루트 API
│   ├── fingerprint/              # 핑거프린트 대시보드
│   └── page.tsx                  # 메인 (리다이렉트)
│
├── components/
│   ├── ip/                       # IP 관련 컴포넌트
│   │   ├── IPInfoCard.tsx        # IP 정보 카드
│   │   └── IPMap.tsx             # 지도
│   ├── score/                    # 점수 관련 컴포넌트
│   │   ├── FingerprintScoreCard.tsx
│   │   └── LieDetectionCard.tsx  # 위변조 탐지
│   ├── summary/
│   │   └── BrowserSummaryCard.tsx
│   └── ui/                       # shadcn/ui
│
├── lib/
│   ├── fingerprint.ts            # 핑거프린트 수집 (Canvas 3종 테스트)
│   ├── fingerprint-enhanced.ts   # 확장 핑거프린트
│   ├── fingerprint-score-engine.ts # 점수 계산 (통계 기반 고유성)
│   ├── lie-detector.ts           # 위변조 탐지 (CreepJS 스타일)
│   ├── ip-analyzer.ts            # ProxyCheck.io
│   ├── ip-api-analyzer.ts        # ip-api.com
│   ├── multi-source-analyzer.ts  # 통합 분석기
│   ├── ip-logger.ts              # IP 조회 로깅
│   ├── debug-logger.ts           # 디버그 로깅
│   └── ip-types.ts               # 타입 정의
│
├── instrumentation.ts            # 서버 시작 시 API 상태 체크
└── middleware.ts                 # curl/브라우저 라우팅
```

---

## 🔧 환경 변수

`.env.example`을 `.env`로 복사 후 설정:

| 변수명               | 필수 | 기본값       | 설명                                                                               |
| -------------------- | ---- | ------------ | ---------------------------------------------------------------------------------- |
| `PROXYCHECK_API_KEY` | ✅   | -            | [ProxyCheck.io](https://proxycheck.io) API 키                                      |
| `TZ`                 | ❌   | `Asia/Seoul` | 로그 타임존 ([목록](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)) |

```env
PROXYCHECK_API_KEY=your-api-key-here
TZ=Asia/Seoul
```

---

## 📡 API 엔드포인트

### 브라우저 접속

| 경로               | 설명                        |
| ------------------ | --------------------------- |
| `GET /`            | `/fingerprint`로 리다이렉트 |
| `GET /fingerprint` | 핑거프린트 대시보드         |

### CLI 접속 (curl/wget)

| 경로               | 설명                  |
| ------------------ | --------------------- |
| `GET /`            | 요청자 IP 정보 (JSON) |
| `GET /:ip`         | 특정 IP 정보 조회     |
| `GET /api/cli`     | 요청자 IP 정보        |
| `GET /api/cli/:ip` | 특정 IP 정보 조회     |

### 내부 API

| 경로                         | 설명         |
| ---------------------------- | ------------ |
| `GET /api/ip/analyze`        | 웹용 IP 분석 |
| `GET /api/ip/analyze?ip=:ip` | 특정 IP 분석 |

---

## 📊 로그 시스템

### 터미널 출력

서버 시작 시 API 상태 확인:

```text
╔═══════════════════════════════════════════════════════════╗
║           🔍 Fingerprint Detector - API Status            ║
╠═══════════════════════════════════════════════════════════╣
║  ProxyCheck.io : ✅ 정상 (301ms)                           ║
║  IP-API.com    : ✅ 정상 (339ms)                           ║
╚═══════════════════════════════════════════════════════════╝
```

요청별 로그 (ISO 8601 타임스탬프):

```text
[2025-12-13T17:40:47] [Finger] VISIT : 58.XXX.226.XXX - P : 1 / I : 1
[2025-12-13T17:41:00] [CURL] SELF : 58.XXX.226.XXX - P : 1 / I : 1
[2025-12-13T17:41:15] [CURL] OTHER : 203.237.xx.xx -> 8.8.8.8 - P : 1 / I : 1
```

| 태그             | 설명                    |
| ---------------- | ----------------------- |
| `[Finger] VISIT` | 웹 페이지 방문          |
| `[CURL] SELF`    | CLI로 자기 IP 조회      |
| `[CURL] OTHER`   | CLI로 다른 IP 조회      |
| `P : 1/0`        | ProxyCheck.io 성공/실패 |
| `I : 1/0`        | ip-api.com 성공/실패    |

### 로그 파일

```text
logs/
├── ip-queries.log    # IP 조회 기록 (JSON)
├── debug.log         # 디버그 로그 (250MB 제한)
└── debug.log.old     # 백업 (자동 로테이션)
```

---

## 🛠️ 기술 스택

| 분류            | 기술                                    |
| --------------- | --------------------------------------- |
| **Framework**   | Next.js 16.0.10 (App Router, Turbopack) |
| **Language**    | TypeScript 5                            |
| **Styling**     | Tailwind CSS 4                          |
| **UI**          | shadcn/ui, Radix UI                     |
| **Map**         | Leaflet, OpenStreetMap                  |
| **IP Analysis** | ProxyCheck.io, ip-api.com               |
| **Fingerprint** | FingerprintJS + Custom Lie Detector     |

---

## 🔬 핑거프린트 분석 상세

### 추적 가능성 점수 계산

실제 통계 데이터 기반으로 각 속성의 고유성을 계산합니다:

| 속성         | 통계 기반 고유성 계산                        |
| ------------ | -------------------------------------------- |
| 화면 해상도  | 1920x1080(23%), 1366x768(15%) 등 점유율 반영 |
| CPU 코어     | 8코어(30%), 4코어(25%) 등 분포 반영          |
| 메모리       | 8GB(35%), 16GB(25%) 등 분포 반영             |
| Canvas/WebGL | 해시값 기반 거의 고유 (92-99%)               |
| User-Agent   | 브라우저/OS 조합별 점유율 반영               |

### 위변조 탐지 (Lie Detector)

CreepJS 스타일의 브라우저 조작 탐지:

- **Prototype 검사**: Navigator, Screen, Canvas 등의 getter 변조 감지
- **타이밍 분석**: performance.now() 정밀도 변조 감지
- **일관성 검사**: UA와 플랫폼, 화면 크기 등 불일치 탐지
- **개인정보 도구**: Brave, Firefox Resist Fingerprinting 등 감지

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 👤 Contact

- **Email:** [admin@colio.net](mailto:admin@colio.net)
- **GitHub:** [JJ-IM/fingerprint-detector](https://github.com/JJ-IM/fingerprint-detector)

---

## ⚠️ Disclaimer

> 이 프로젝트는 **Vibe Coding** (바이브 코딩)으로 제작되었습니다.
> AI 어시스턴트와 함께 빠르게 개발하는 방식으로 만들어져, 예상치 못한 버그나 미흡한 부분이 있을 수 있습니다.
> 문제 발견 시 Issue나 PR을 환영합니다! 🙏
