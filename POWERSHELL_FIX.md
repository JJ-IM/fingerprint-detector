# PowerShell 실행 정책 문제 해결 가이드

## ✅ 추천 방법 1: VSCode 기본 터미널을 CMD로 변경 (영구적, 안전)

`.vscode/settings.json` 파일이 생성되었습니다.
이제 VSCode를 재시작하거나 새 터미널을 열면 자동으로 CMD가 기본 터미널이 됩니다.

**장점**:

- 시스템 설정 변경 없음
- 프로젝트 단위로 적용
- 팀원들과 공유 가능

**사용법**:

```bash
# 이제 그냥 실행하면 됩니다
npm run dev
npm install
```

---

## 방법 2: PowerShell 실행 정책 변경 (전역 적용)

### Option A: CurrentUser 스코프 (관리자 권한 불필요)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Option B: LocalMachine 스코프 (관리자 권한 필요)

```powershell
# 관리자 권한으로 PowerShell 실행 후:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine
```

**실행 정책 설명**:

- `Restricted`: 모든 스크립트 실행 차단 (기본값)
- `RemoteSigned`: 인터넷에서 다운로드한 스크립트만 서명 필요
- `Bypass`: 모든 제한 없음 (권장하지 않음)

---

## 방법 3: 임시 우회 (매번 실행)

PowerShell에서 매번 이렇게 실행:

```powershell
# 방법 A
cmd /c "npm run dev"

# 방법 B
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

---

## 🎯 추천 순서

1. **방법 1 (VSCode 설정)** ← 지금 바로 사용 가능! ✅
2. 방법 2A (CurrentUser 정책 변경)
3. 방법 2B (LocalMachine 정책 변경)
4. 방법 3 (임시 우회)

---

## 확인 방법

현재 실행 정책 확인:

```powershell
Get-ExecutionPolicy -List
```

정책이 제대로 설정되었는지 테스트:

```powershell
npm --version
npm run dev
```

---

## 지금 적용된 설정

`.vscode/settings.json`에서 기본 터미널이 CMD로 설정되었습니다.

**다음 단계**:

1. VSCode에서 새 터미널 열기 (Ctrl + Shift + `)
2. `npm run dev` 실행
3. 정상 작동 확인!
