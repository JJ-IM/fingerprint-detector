# Fingerprint Detector - 시나리오 검증 문서

## ✅ 구현 완료된 시나리오

### 1. 페이지 로드 시 (초기 로딩)

```
사용자 접속
    ↓
브라우저 지문 수집 시작 (FingerprintCollector)
    ├─ 15개 카테고리 수집 (navigator, screen, webgl, canvas, audio, fonts...)
    ├─ SHA-256 해시 생성
    └─ fingerprint 상태 업데이트
    ↓
기본 IP 정보 가져오기 (/api/ip/basic)
    ├─ ip-api.com 무료 API 사용
    ├─ x-forwarded-for 헤더로 클라이언트 IP 감지
    ├─ 로컬 IP인 경우 자동으로 실제 공인 IP 조회
    └─ 기본 정보만 표시 (IP, 위치, ISP, 타임존)
    ↓
UI 렌더링
    ├─ IP 정보 카드 (기본 정보 + "IP 정보 확인" 버튼)
    ├─ 브라우저 요약 카드 (12개 주요 항목)
    └─ 지문 상세 섹션 (15개 카테고리, 접기/펼치기)
```

### 2. "IP 정보 확인" 버튼 클릭 시

```
사용자가 "IP 정보 확인" 버튼 클릭
    ↓
fetchDetailedIPInfo() 함수 실행
    ├─ detailedLoading = true
    └─ /api/ip?ip={클라이언트IP} 호출
    ↓
IPQualityScore API 호출 (유료/횟수제한)
    ├─ 클라이언트에서 받은 IP로 정확한 조회
    ├─ fraud_score (0-100 사기 점수)
    ├─ VPN/Tor/Proxy 실시간 감지
    ├─ active_vpn, active_tor (능동적 사용 여부)
    ├─ abuse_velocity (악용 속도)
    ├─ 40+ 상세 필드
    └─ 위험도 계산 (high/medium/low)
    ↓
상세 정보 UI 업데이트
    ├─ 사기 점수 게이지 표시
    ├─ 6개 위험 배지 (VPN, Proxy, Tor, Bot, 보안스캐너, 최근남용)
    ├─ 연결 타입, 악용 속도 표시
    ├─ OS, 브라우저 정보 표시
    └─ 종합 위험도 평가 섹션
    ↓
"IP 정보 확인" 버튼 숨김 (hasDetailedInfo = true)
```

## 🎯 주요 시나리오 검증

### ✅ 시나리오 1: 일반 사용자 접속 (VPN 미사용)

```
접속 → 기본 IP 표시 → "IP 정보 확인" 클릭
→ 사기 점수: 0-30 (낮음)
→ 위험 배지: 모두 녹색 체크
→ 종합 위험도: ✅ 낮음 - 일반 네트워크
```

### ✅ 시나리오 2: VPN 사용자 접속

```
접속 → 기본 IP 표시 → "IP 정보 확인" 클릭
→ 사기 점수: 75-100 (높음)
→ 위험 배지: "Active VPN" 빨간색 경고
→ 종합 위험도: 🚨 높음 - VPN/Proxy/위협 감지
```

### ✅ 시나리오 3: 로컬 개발 환경 (127.0.0.1)

```
접속 (localhost:3000)
→ /api/ip/basic가 ip-api.com에 자동으로 실제 공인 IP 조회
→ 실제 ISP IP 정보 표시 (서버 IP 아님!)
→ "IP 정보 확인" 클릭하면 해당 공인 IP로 상세 분석
```

### ✅ 시나리오 4: 프록시/데이터센터 접속

```
접속 → 기본 IP 표시 → "IP 정보 확인" 클릭
→ connection_type: "Data Center"
→ isHosting: true
→ 위험 배지: "Proxy" 빨간색 경고
→ 종합 위험도: 🚨 높음 - VPN/Proxy/위협 감지
```

## 🔧 API 구조

### 기본 API: `/api/ip/basic` (무료, 무제한)

- **사용 API**: ip-api.com
- **호출 타이밍**: 페이지 로드시 자동
- **제공 정보**:
  - IP 주소
  - 국가, 도시, 지역
  - ISP, 조직, AS 번호
  - 위도/경도, 타임존
  - riskLevel: "unknown" (상세 분석 전)

### 상세 API: `/api/ip?ip={IP}` (횟수제한)

- **사용 API**: IPQualityScore (API Key 사용)
- **호출 타이밍**: 버튼 클릭시에만
- **제공 정보**:
  - fraud_score (0-100)
  - VPN/Tor/Proxy 감지 (active/passive 구분)
  - bot_status, security_scanner
  - abuse_velocity, recent_abuse, frequent_abuser
  - connection_type (Residential/Data Center/Mobile)
  - device 정보 (OS, 브라우저, 모델, 브랜드)
  - riskLevel: "high"/"medium"/"low" (계산된 값)

## 📊 위험도 계산 로직

```typescript
function calculateRiskLevel(data) {
  // 1순위: 사기 점수
  if (fraud_score >= 85) return "high";
  if (fraud_score >= 75) return "medium";

  // 2순위: 능동적 VPN/Tor 사용
  if (active_vpn || active_tor || tor) return "high";
  if (vpn || proxy) return "high";

  // 3순위: 봇/스캐너
  if (bot_status || security_scanner) return "high";

  // 4순위: 악용 이력
  if (frequent_abuser || high_risk_attacks) return "high";
  if (recent_abuse) return "medium";

  // 5순위: 악용 속도
  if (abuse_velocity === "high") return "medium";
  if (fraud_score >= 50) return "medium";

  return "low";
}
```

## 🛡️ 클라이언트 IP 정확성 보장

### 헤더 우선순위:

1. `x-forwarded-for` (프록시/로드밸런서 통과시)
2. `x-real-ip` (Nginx 등)
3. 빈 문자열 → ip-api.com이 자동 감지

### 로컬 IP 처리:

- `127.0.0.1`, `::1`, `unknown` 감지
- → ip-api.com에 빈 요청 전송
- → 서비스가 요청자의 실제 공인 IP 반환

## 📁 파일 구조

```
src/
├── app/
│   ├── page.tsx ........................ 메인 페이지 (180줄)
│   └── api/
│       └── ip/
│           ├── basic/
│           │   └── route.ts ............ 기본 IP API (무료)
│           └── route.ts ................ 상세 IP API (IPQualityScore)
├── components/
│   ├── ip/
│   │   ├── IPInfoCard.tsx .............. IP 정보 카드 + 버튼
│   │   └── RiskBadge.tsx ............... 위험 배지 컴포넌트
│   ├── summary/
│   │   ├── BrowserSummaryCard.tsx ...... 브라우저 요약
│   │   └── SummaryRow.tsx .............. 요약 행
│   └── fingerprint/
│       ├── FingerprintSection.tsx ...... 접기/펼치기 섹션
│       ├── DataRow.tsx ................. 데이터 행
│       └── StatCard.tsx ................ 통계 카드
└── lib/
    ├── types.ts ........................ TypeScript 인터페이스
    ├── fingerprint.ts .................. 지문 수집 엔진 (944줄)
    ├── utils.ts ........................ 유틸리티 함수
    ├── constants.ts .................... 상수 정의
    └── categoryConfig.tsx .............. 카테고리 설정
```

## 🎨 UI/UX 흐름

1. **로딩 화면** (3-5초)

   - 회전하는 원형 애니메이션
   - "브라우저 지문 수집 중..."

2. **메인 화면**

   - 상단: SHA-256 해시 배너 (복사 버튼)
   - 중단: 2열 그리드
     - 왼쪽: IP 정보 카드 (기본 정보 + 버튼)
     - 오른쪽: 브라우저 요약 카드
   - 하단: 15개 카테고리 접기/펼치기 섹션
   - 푸터: 4개 통계 카드

3. **"IP 정보 확인" 버튼 클릭 후**
   - 버튼 텍스트: "분석 중..."
   - 2-3초 후 상세 정보 표시
   - 버튼 숨김
   - 사기 점수 게이지 애니메이션
   - 위험 배지 색상 변경
   - 종합 위험도 섹션 추가

## ✅ 타입 안정성

- `FingerprintData`: 인덱스 시그니처 추가 (`[key: string]`)
- `IPData`: 모든 상세 필드 optional (`?:`)
- `RiskBadge`: `detected: boolean | undefined` 허용
- null-safe 연산자 사용 (`?.`, `??`, `!!`)

## 🚀 성능 최적화

- 기본 API와 상세 API 분리 → 횟수 절약
- 병렬 처리: 지문 수집 + 기본 IP 조회 동시 실행
- 상세 정보는 사용자 요청시에만 로드
- Tailwind CSS 4 (bg-linear-to-\*) 사용

## 🔍 2차 검증 완료 체크리스트

- ✅ 페이지 로드시 기본 IP만 가져옴
- ✅ "IP 정보 확인" 버튼으로 상세 정보 조회
- ✅ 클라이언트 IP 정확하게 전달 (서버 IP 아님)
- ✅ 로컬 개발시에도 실제 공인 IP 조회
- ✅ TypeScript 타입 에러 0개
- ✅ ESLint 경고 최소화
- ✅ Tailwind 4 문법 준수
- ✅ Optional chaining으로 안전한 접근
- ✅ Boolean 강제 변환 (`!!`)으로 undefined 제거
- ✅ 컴포넌트 재사용성 확보
- ✅ 위험도 계산 로직 명확화
- ✅ UI/UX 시나리오 검증 완료
