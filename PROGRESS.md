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
- ✅ OTP 6자리 / 5분 만료 설정 (Supabase Expiration 300 유지)
- ✅ PIN 셀 영문/한글 입력 차단 + iOS 숫자 키패드 보장
- ✅ 인증 화면에 메일 도착 지연 안내
- ✅ 비밀번호 PIN 즉시 마스킹 (type=text + ● 직접 치환, 실제 값은 dataset.actualValue)
- ✅ 5-6-A: 로그인 화면 Supabase 연결 (signInWithPassword)
  - 에러 메시지를 alert이 아닌 hint 영역에 표시 (에러 색상)
  - 실패 시 PIN 자동 클리어 + 첫 셀 focus
  - 세션은 supabase가 localStorage에 자동 저장
- ✅ 중복 가입/같은 비번 에러 처리 보강
  - RPC에 `profile_exists` 분기 추가 (이미 가입된 계정 vs 닉네임 중복 구분)
  - OTP 인증 직후 profiles 체크 → 이미 가입이면 로그인 화면으로 자동 이동
  - `updateUser`의 'same password' 에러는 무시하고 RPC 진행 (자연 복구)
- ✅ studypotato 21개 HTML 파일에 🥔 favicon 일괄 추가 (인라인 SVG)
- ✅ profiles_enrollment_valid CHECK 제약 한글 값으로 재정의 + grade도 정리
- ✅ 알림 메일 가입 단계 사전 중복 검사 (`is_notify_email_available` RPC)
- ✅ done 화면 summary card에 매칭 동의 / 커뮤니티 동의 / 가입일 표시
- ✅ 로그인 화면 동적 suffix
  - 기본은 `@kangwon.ac.kr` 표시 → 사용자가 `@` 입력하면 자동 숨김
  - 아이디만 입력 → 강원대 웹메일로 자동 보정 후 RPC 변환
- ✅ 알림 메일로도 로그인 가능
  - SQL: `notify_email` UNIQUE 제약 + RPC `resolve_login_email`
  - 로그인 화면: suffix 제거, 자유 입력 (웹메일/알림 메일 둘 다 OK)
  - 알림 메일 입력 화면에 "로그인 가능, 신중히 입력" 안내
  - 보안: 비밀번호 재설정 등 민감 작업은 웹메일 OTP만 사용 (예정)
- ✅ 매칭 알림 동의 항목 가입 화면에서 제거 (필수라 표시 X)
  - finishSignup이 service_email은 자동으로 consents에 추가 (법적 동의 기록 유지)
  - done 화면 summary card에서도 매칭 알림 행 제거
- ✅ 고객의 소리 화면 (feedback.html) 신규
  - 카테고리 칩 (문의/신고/제안) + 카테고리별 안내문 동적 변경
  - 제목 + 내용 입력 (글자 수 카운트, 신고에 대한 톤 정중)
  - 답변은 알림 메일로 발송 안내, 답변 지연 가능 명시
  - dashboard 프로필 메뉴 → "고객의 소리" 진입점 연결
  - preview/index.html 카드 추가
  - **백엔드 연동은 추후** (현재는 alert만)
- ✅ 이미 가입된 메일 전용 화면 (alert → screen-already-registered)
  - "로그인하러 가기" 버튼으로 메일 자동 채움
  - "비밀번호 찾기" 자리는 마련됨 (실제 화면은 5-6-C에서)
- ✅ 회원가입 환영 메일 자동 발송
  - Edge Function: `supabase/functions/send-welcome-email/index.ts`
  - 알림 메일로 발송 (강원대 웹메일 X)
  - `nickname` 동적 삽입 + 시작하기 버튼
- ✅ 알림 메일 입력 화면에 "강원대 웹메일도 사용 가능" 안내 추가
- ✅ 사전신청 완료 안내 메일 자동 발송
  - Edge Function: `supabase/functions/send-pre-register-email/index.ts`
  - Resend API 호출 + 한글 디자인 메일 본문
  - 클라이언트에서 fire-and-forget 호출 (메일 실패해도 등록은 성공)
  - 환경변수: `RESEND_API_KEY` (Project Settings → Edge Functions → Secrets)

---

## 🔍 현재 진단 중

### 메일 지연 (1분 30초)
원인 후보 (확률 순):
1. **그레이리스팅** — 강원대 메일 서버가 새 발신자 1차 거부, 재시도 시 수락. 두 번째 메일은 빨라짐
2. **DNS 인증 미완료** — Resend Domains에서 SPF/DKIM/DMARC 모두 Verified 상태인지 확인 필요
3. **평판 낮음** — 신규 도메인이라 시간 지나며 자연 해결

진단 액션:
- [ ] 두 번째 메일 속도 측정 (그레이리스팅 판정)
- [ ] Resend → Domains → studypotato.com Verified 확인
- [ ] 받은 메일 원본 보기 → Received 헤더 시간 도장 분석
- ✅ RPC `create_user_profile` (profiles + consents 트랜잭션 묶음)
- ✅ 5-5: `finishSignup()` 실제 Supabase 저장 — updateUser(password) + RPC 호출 + 에러 분기
- ✅ 약관 화면 6개 항목 (필수 5 + 선택 1) + data-consent-type 식별자

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
- **[보안 검토]** 6자리 숫자 PIN은 100만 조합이라 약함.
  로그인 시도 횟수 제한 + rate limiting 외에 정식 출시 전 추가 방어 검토 필요
  (예: 잠금 후 메일 인증으로만 해제, 동일 IP 다중 시도 차단)
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
