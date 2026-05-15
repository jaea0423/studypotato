# 공부하는 감자 — 진행 상황 기록

> 마지막 업데이트: 2026-05-15 (이메일 템플릿 적용 성공 / OTP 자릿수 이슈 발견)
> 다음 세션 시작 시 이 파일을 먼저 읽어주세요.

## 🎯 다음에 시작할 작업 (TOP PRIORITY)

**OTP 인증코드가 8자리로 옴 → 6자리로 수정**

원인 추정: Supabase Auth 설정 어딘가에 OTP 길이 옵션이 있음. 확인 위치 후보:
- Authentication → Providers → Email → "Email OTP Length" 설정
- Authentication → Settings → "Email OTP Expiry / Length"
- 또는 Email Templates의 `{{ .Token }}` 변수 옆에 길이 옵션이 따로 있을 수도

현재 클라이언트 코드(`auth.html`)는 PIN 셀 6칸으로 고정되어 있고 `verifyOtp`도 6자리 코드를 모아서 보내는 상태. **Supabase 대시보드에서 6자리로 강제하는 게 우선.** 만약 Supabase에서 8자리만 가능하다면 클라이언트 PIN 셀을 8개로 늘려야 함.

---

## ✅ 완료된 작업

### Phase 1: 디자인 프로토타입 (17개 화면)
- auth, dashboard, matchcard, groupcreate, matchresponse, teamresponse
- teamconfirm-leader/member, notifications, terms/privacy/rules
- profile-edit, password-change, team-detail, community-write/detail
- notification-settings

### Phase 2: 브랜딩
- "공부하는 감자" 정식 명칭 (캐주얼: "공감")
- "AI 매칭" → "자동 매칭"
- "노쇼" → "No-Show"

### Phase 3: 백엔드 셋업
- 도메인: studypotato.com (namecheap)
- GitHub Pages 연결 완료
- Supabase 프로젝트 생성
- pre_register 테이블 + 사전신청 페이지 가동 중

### Phase 4: 인증 시스템 (진행 중)
- ✅ DB 스키마 (profiles + consents 테이블)
- ✅ RLS 정책 + 트리거 (출생연도 변경 금지, 닉네임 30일, 학과 180일)
- ✅ RPC `is_nickname_available`
- ✅ Custom SMTP (Resend) 연결 — **한글 템플릿 적용 성공**
- ✅ 5-1: 이메일 입력 → signInWithOtp 발송
- ✅ 5-2: OTP 검증 (verifyOtp)
- ✅ 5-3: 닉네임 중복확인 (RPC) + 비밀번호(PIN 6자리)
- ✅ 5-4: 학년/재학상태/출생연도 + **학과 입력 필드 추가** (Option A)

---

## ⛔ 현재 막혀있는 문제

### 🟡 OTP 인증코드가 8자리로 옴 (다음 세션 최우선 작업)

**증상:**
- 한글 템플릿은 정상 적용됨 ✅
- 그런데 `{{ .Token }}` 자리에 6자리가 아닌 **8자리 숫자**가 옴
- 클라이언트 PIN 셀은 6칸이라 입력 자체가 불가능

**해결 방향 (확정):**
Authentication → Providers → Email 에서 두 값 모두 변경
- **Email OTP Length: 6** (현재 8 → 클라이언트 PIN 6칸과 일치)
- **Email OTP Expiration: 300** (현재 3600 → 클라이언트 5분 타이머와 일치)
  - 만료 시간을 클라이언트와 맞추지 않으면, "시간 만료" 표시 후에도 코드가 유효한 모순 발생

---

## 🔜 다음 작업 (이메일 문제 해결 후)

### 5-5: finishSignup() 실제 저장
1. 약관 화면 체크박스에 `data-consent-type` 속성 부여
   - terms / privacy / rules / campus / service_email / community_email
2. `finishSignup()` 안에서:
   - 필수 동의 6개 모두 체크 검증
   - `supabaseClient.auth.updateUser({ password: state.password })` — 비밀번호 설정
   - `profiles` INSERT (id, nickname, grade, enrollment_status, birth_year, major, notify_email)
   - `consents` INSERT 4~6건 (각 동의 항목별)
   - 성공 → dashboard.html 이동, 실패 → alert + 화면 유지
3. 에러 처리 (RLS 위반, 닉네임 중복 등)

### 5-6: 로그인 화면 Supabase 연결
- `signInWithPassword({ email, password })`
- 5회 틀리면 메일 인증 잠금 해제 (선택)
- 비밀번호 재설정 플로우

### 그 이후
- 다른 이메일 템플릿 한글화 (Reset Password, Change Email)
- **사전신청 완료 자동 메일** (studypotato.com 메인)
  - 내용: "사전신청 완료 / 6개월간 보관 / 정식 출시 시 알림 / 감사합니다"
  - 구현 옵션: Supabase Edge Function + Resend API, 또는 DB 트리거 + pg_net
- 매칭 카드, 팀 관리, 커뮤니티 백엔드 연동

---

## 📁 주요 파일 위치

- `C:\GitHub\studypotato\index.html` — 사전신청 (가동 중)
- `C:\GitHub\studypotato\preview\auth.html` — 가입/로그인 (작업 중)
- `C:\GitHub\jaealee.com\study\` — 이전 프로토타입들 (참고용)

---

## 🔑 환경 정보

- Supabase URL: `https://mleypjquzggtyouepfha.supabase.co`
- 도메인: studypotato.com (Namecheap → GitHub Pages)
- SMTP: Resend (noreply@studypotato.com)
