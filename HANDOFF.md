# 🥔 공부하는 감자 — 차기 세션 핸드오프

> 다음 세션의 클로드가 컨텍스트 0에서 바로 작업을 이어받기 위한 문서.
> 작성: 2026-06-24 / 이전 세션: Claude Sonnet · 새 세션: 상위 모델 예정

---

## 0. 빠른 시작 (TL;DR)

- **무엇**: 강원대학교 춘천캠퍼스 학생 스터디 매칭 플랫폼 ("공부하는 감자", 캐주얼명 "공감")
- **누가**: 이재아 (CS 2학년) — 비영리, 본인이 1인 개발 + 운영
- **어디**: studypotato.com (GitHub Pages + Supabase 백엔드)
- **현재 단계**: 사전신청 페이지 운영 중. 본 서비스(`/preview/` 경로의 모든 화면) 디자인·기능 거의 완성. 정식 출시 전.
- **지금 막힌 곳**: Supabase 무료 프로젝트가 7일 활동 없어서 **paused 추정** → 회원가입/사전신청 등 모든 기능 실패. 사용자가 Supabase 대시보드에서 **Restore** 눌러야 복구.
- **이번 세션 변경사항**: 로컬에만 있고 commit/push 아직 안 됨. **새 세션이 가장 먼저 해야 할 일은 git status로 변경 파일 확인하고 의도된 변경인지 검증.**

---

## 1. 사용자 (이재아) 정보 + 응대 스타일

### 기본
- 강원대학교 컴퓨터공학과 2학년
- 자바 기초 학습 완료. C / Python 독학 중 (스스로 "매우 못한다"고 평가)
- 영어 능력 부족 — 고급 영단어 어려워함
- 현재 수강: 자료구조, 리눅스프로그래밍, 웹프로그래밍, 이산수학

### 응대 규칙 (절대 지킬 것)
- **항상 높임말** 사용
- **1~2줄 핵심 요약 먼저**, 그 다음 상세 설명
- 간단한 질문 → 3줄 이내. 복잡한 질문만 길게
- 어려운 개념 → **일상 비유 먼저**, 기술 설명 나중
- **코드엔 반드시 한국어 주석 포함**
- 학문적 키워드는 **괄호로 영어 병기**: 예) 가상화(virtualization), 강화학습(reinforcement learning)

### 태도
- 사용자의 **논리적 오류나 더 나은 방법이 있으면 먼저 지적**할 것
- 칭찬보다 **개선점 우선**
- 틀렸을 때 **직접적으로** 말할 것
- "좋은 질문이에요" 같은 **불필요한 칭찬 금지**
- **모르면 모른다고** 솔직하게. 억지로 답 만들지 말 것

### 연결 학습
- 자료구조/리눅스프로그래밍/웹프로그래밍/이산수학 강의와 **연결해서 설명**할 것

---

## 2. 기술 스택 + 환경 정보

### 프론트엔드
- **Vanilla HTML + CSS + JS** (프레임워크 없음, 모바일 우선)
- 모바일 화면 — `max-width: 480px`
- 폰트: Pretendard Variable + JetBrains Mono
- 디자인 토큰: 강원대 블루(#0047BB), 강원대 오렌지(#FE5000), 크림(#F7F3EC), 멘토 그린(#16A34A)

### 백엔드
- **Supabase** (Auth + PostgreSQL + Edge Functions)
  - URL: `https://mleypjquzggtyouepfha.supabase.co`
  - ANON KEY: 코드에 노출됨 (공개 키. RLS로 보호하므로 OK)
  - 프로젝트 ID: `mleypjquzggtyouepfha`
- **Resend** — SMTP + API (메일 발송. `noreply@studypotato.com`)
- **Edge Functions** (Deno + TypeScript) — `supabase/functions/`
  - `send-pre-register-email` — 사전신청 완료 메일
  - `send-welcome-email` — 가입 환영 메일

### 인프라
- **GitHub**: https://github.com/jaea0423/studypotato (jaea0423 계정)
- **호스팅**: GitHub Pages → studypotato.com (Namecheap DNS, CNAME apex)
- **로컬 작업 폴더**: `C:\GitHub\studypotato`
- **이전 프로토타입(참고용)**: `C:\GitHub\jaealee.com\study\` — 더 이상 사용 안 함

### 도메인
- `studypotato.com` (apex) ✅ 활성
- `www.studypotato.com` ⚠️ CNAME 미설정 (사용자 결정 대기 — 그냥 무시 vs Namecheap에서 CNAME 추가)

### 운영자 계정 (admin.html — 더미 모드)
- ID: `jaea_admin`
- 비밀번호: `jaea1234`
- 2차 PIN: `123456`
- ⚠️ 정식 출시 전 변경 + DB 이관 필요

---

## 3. 파일 구조

```
C:\GitHub\studypotato\
├── index.html                     ← 사전신청 페이지 (production)
├── CNAME                          ← studypotato.com (LF 한 줄)
├── PROGRESS.md                    ← 상세 진행 상황
├── HANDOFF.md                     ← 이 문서
│
├── preview/                       ← 본 서비스 화면 모음 (출시 시 root로 승격 예정)
│   ├── index.html                 ← 화면 트리 (개발용 사이트맵)
│   ├── auth.html                  ← 가입/로그인/비번재설정/잠금
│   ├── dashboard.html             ← 홈 (5탭: 홈/매칭/내스터디/커뮤니티/프로필)
│   ├── matchcard.html             ← 매칭 카드 생성/수정 (9항목)
│   ├── groupcreate.html           ← 팀 만들기
│   ├── matchresponse.html         ← 자동 매칭 응답
│   ├── teamresponse.html          ← 팀 매칭 알림
│   ├── teamconfirm-leader.html    ← 팀장용 확정
│   ├── teamconfirm-member.html    ← 팀원용 확정
│   ├── team-detail.html           ← 팀 상세 + 지원 모달
│   ├── community-write.html       ← 커뮤니티 글쓰기
│   ├── community-detail.html      ← 게시글 + 댓글
│   ├── notifications.html         ← 알림 목록
│   ├── profile-edit.html          ← 프로필 수정
│   ├── password-change.html       ← 비번 변경 (현 6자리 PIN)
│   ├── notification-settings.html ← 알림 ON/OFF
│   ├── language-settings.html     ← 언어 (KO/EN soon/中文 soon) — 이번 세션 신규
│   ├── feedback.html              ← 고객의 소리
│   ├── mentoring-list.html        ← 감자사이 목록
│   ├── mentoring-create.html      ← 감자사이 멘토 카드 작성
│   ├── mentoring-detail.html      ← 감자사이 상세 + 지원
│   ├── terms.html / privacy.html / rules.html  ← 약관·정책·규칙
│   ├── admin.html                 ← 운영자 콘솔 (별도 인증)
│   └── js/
│       ├── anonymous.js           ← 익명 닉네임 생성 (형용사+채소)
│       ├── time.js                ← 시간 포맷터 (이번 세션 신규)
│       └── device.js              ← 기기 ID 발급 (이번 세션 신규, Option C)
│
├── sql/
│   └── registered_devices.sql     ← 이번 세션 신규. ⚠️ 사용자 아직 실행 안 함
│
├── supabase/functions/
│   ├── send-pre-register-email/index.ts
│   └── send-welcome-email/index.ts
│
└── docs/
    └── study-potato-overview.docx ← 서비스 소개서 (12 섹션, 12~13 페이지)
```

---

## 4. DB 스키마 (현재 Supabase에 적용된 것)

### `auth.users` (Supabase 기본 — 건드리지 않음)

### `public.profiles`
사용자 프로필. `auth.users.id` 1:1 관계.
```
id              uuid PK (auth.users.id)
nickname        text UNIQUE  -- 닉네임 (30일 변경 제한)
nickname_changed_at  timestamptz
grade           text -- '1학년'~'4학년 이상', '대학원', '졸업'
enrollment_status text -- '재학', '휴학', '졸업' 등
birth_year      int
major           text  -- 학과 (180일 변경 제한)
major_changed_at timestamptz
notify_email    text UNIQUE -- 강원대 메일과 별개. 로그인에도 사용 가능
role            text DEFAULT 'user' -- 'user' / 'moderator' / 'admin'
created_at      timestamptz
```
CHECK 제약:
- `enrollment_status IN ('재학','휴학','졸업','수료')`
- `grade IN ('1학년','2학년','3학년','4학년 이상','대학원')` (profiles_enrollment_valid)

### `public.consents`
약관 동의 기록 (법적 보관 의무).
```
user_id  uuid FK
consent_type   text  -- 'service','privacy','marketing','community_email','service_email','campus','rules'
version  text
consented bool
created_at timestamptz
```
⚠️ `consent_type` CHECK 제약에 `campus`, `rules` 추가 필요 (task #76 미해결)

### `public.match_cards`
매칭 카드. 사용자 1명이 최대 3개. active는 1개만.
```
id          uuid PK
user_id     uuid FK
category    text -- '시험대비' 등
level       text
intro       text NOT NULL  -- 한 줄 소개 (필수)
target_grade text
time_pref   jsonb
style       text
meet_mode   text
extra       jsonb  -- 선택 5개 항목 묶음
is_active   bool
created_at  timestamptz
```
- 트리거 `check_max_cards`: 4개째 INSERT 차단
- 부분 unique index: 같은 user_id에서 is_active=true는 1개만

### `public.registered_devices` (⚠️ 이번 세션 작성, 사용자 아직 SQL 실행 안 함)
Option C 보안: 등록된 기기에서만 PIN 로그인 허용.
```
id            uuid PK
user_id       uuid FK
device_id     text  -- 클라이언트가 localStorage UUID 발급
device_label  text  -- 'Chrome · Windows' 등
user_agent    text
registered_at timestamptz
last_used_at  timestamptz
UNIQUE(user_id, device_id)
```
SQL 파일: `sql/registered_devices.sql`

### RPC 함수들 (이미 적용된 것)
- `create_user_profile(...)` — 가입 시 profiles + consents 트랜잭션
- `resolve_login_email(p_input)` — 알림메일 → 강대메일 변환 (로그인용)
- `is_notify_email_available(p_email)` — 알림 메일 중복 검사
- `is_nickname_forbidden(p_nickname)` — 닉네임 금칙어 검사
- `cleanup_unverified_users()` — OTP 미인증 user 정리
- `my_role()` — 본인 권한 조회

### RPC 함수들 (registered_devices.sql 실행 후 추가될 것)
- `register_my_device(p_device_id, p_device_label, p_user_agent)` — 기기 등록
- `is_my_device_registered(p_device_id)` — 본인 기기인지 확인
- `revoke_other_devices(p_current_device_id)` — 다른 기기 모두 해제

### RLS 정책 — 거의 모든 테이블 `user_id = auth.uid()` 본인만

---

## 5. 완성된 기능 체크리스트

### 인증
- [x] 가입: 메일 OTP → 닉네임/학과/학년 → 비번 PIN 6자리 → 약관 → 완료
- [x] 로그인 (강대메일 또는 알림메일 + PIN)
- [x] 비밀번호 5회 실패 잠금 → 메일 인증으로 해제
- [x] 비밀번호 재설정 흐름
- [x] 로그인 상태 시 auth.html 진입 차단 (역방향 가드)
- [x] 보호 화면 인증 가드 (12개 파일)
- [x] OTP 미인증 user 정리 함수

### 대시보드 / 매칭
- [x] 5 탭 구조 + 하단 탭바
- [x] 매칭 카드 본인 목록 표시 + active 배너 + 카운트다운
- [x] 매칭 카드 생성/수정/삭제, 3개 제한
- [x] 직접 찾아보기 (검색 + 5개 필터 + 정렬)
- [x] 팀 만들기, 팀 상세, 지원 모달
- [x] 매칭 확정 (팀장/팀원 분리)
- [x] 알림 목록

### 커뮤니티
- [x] 글쓰기 (4 카테고리, 가이드)
- [x] 게시글 상세 + 댓글 + 대댓글 + 익명
- [x] 시간 표시 포맷터 (지금/N분 전/HH:MM/어제/M월 D일) ← 이번 세션
- [x] 익명 닉네임 생성 (형용사+채소 ~1330 조합)
- [x] 운영 규칙 명문화

### 감자사이 (멘토링)
- [x] 목록/작성/상세 3개 화면 (COMING SOON)
- [x] 학년 제한 (멘토 학년에 따른 멘티 자동 제한)
- [x] 멘토 동기부여: 활동 인증서 PDF + 통계 + 감사 메일
- [x] 카드 색상: 주황 기본, 가득차면 빨강(hot), D-3 이하 마감임박 ← 이번 세션
- [x] 컬러: 보라 → 딥그린 #16A34A

### 운영자 콘솔 (admin.html)
- [x] 별도 ID/PW + 2차 PIN
- [x] 30분 idle + 탭 닫기 시 자동 로그아웃
- [x] 사이드 메뉴 6개 + 메인 탭 4개
- [x] 매칭/팀/커뮤니티 모니터링, 신고 처리, 사용자 관리, 운영자 게시판, 활동 로그, 긴급 운영 중단
- [x] 2차 비번 3단계 변경

### 정책 / 문서
- [x] terms.html / privacy.html (초안 — 법률 검토 전)
- [x] rules.html (확정)
- [x] 서비스 소개서 docx (12 섹션)
- [x] 카드뉴스 / 홍보 전략 PROGRESS.md에 정리

### 기타
- [x] 모든 페이지 🥔 favicon
- [x] 사전신청 완료 메일 (Edge Function)
- [x] 가입 환영 메일 (Edge Function)
- [x] 익명 정책 명문화 (확정 후 매칭 알림 시 닉네임 공개)
- [x] 언어 설정 화면 (KO 기본 / EN soon / 中文 soon) ← 이번 세션
- [x] preview/index.html 트리 형식 재구성 ← 이번 세션

---

## 6. ⚠️ 이번 세션 변경사항 (commit/push 안 됨)

### 신규 파일
- `preview/js/time.js` — 시간 포맷터
- `preview/js/device.js` — 기기 ID 유틸 (Option C)
- `preview/language-settings.html` — 언어 설정 화면
- `sql/registered_devices.sql` — 기기 등록 테이블 + RPC 3개

### 수정 파일
- `preview/dashboard.html` — time.js import + 커뮤니티 시간 data-mins-ago + 언어설정 메뉴
- `preview/community-detail.html` — time.js import + 댓글 data-mins-ago
- `preview/mentoring-list.html` — 색상 로직 (hot/마감임박)
- `preview/auth.html` — device.js import + 가입 직후 register_my_device 호출
- `preview/index.html` — **완전히 재작성** (기존 카드 그리드 → 트리 구조 + 검색)
- `PROGRESS.md` — Option C 남은 작업 + 새 인증 모델 7단계 기록

### ⚠️ 로컬 EOL 문제
`git status`에 `CNAME`과 일부 파일이 modified로 보일 수 있는데, 이는 Windows git의 **autocrlf** 가 LF → CRLF 자동 변환한 것. 내용은 동일.
- 의도된 변경 아님 → `git checkout -- CNAME` 같이 폐기 후 commit 진행 권장
- **CNAME이 CRLF로 push되면 GitHub Pages가 도메인 인식 실패함** (주의!)

### 권장 commit 절차 (다음 세션)
```bash
cd C:\GitHub\studypotato
git status                          # 변경 파일 확인
git diff CNAME index.html           # EOL만 바뀐 거면 폐기
git checkout -- CNAME index.html    # (필요 시) 원복
git add preview/ sql/ PROGRESS.md HANDOFF.md
git commit -m "feat: 시간 포맷터/언어 설정/멘토링 색상/트리 재구성/Option C 1단계"
git push origin main
```

---

## 7. 진행 중인 작업: 새 인증 모델 (가장 우선)

### 결정된 방향
기존 6자리 PIN = 비밀번호 모델은 학번 노출 시 100만 조합으로 약함.
변경 → **일반 비밀번호(필수) + PIN 6자리(선택, 등록 기기 간편 로그인용)**

### 최종 흐름 (목표)
| 케이스 | 입력 |
|---|---|
| 신규 가입 | 메일 OTP → 비밀번호(필수) + (선택) PIN 설정 |
| 등록 기기 + PIN 설정 | PIN 6자리 |
| 등록 기기 + PIN 미설정 | 비밀번호 |
| 새 기기 | OTP + 비밀번호 → 기기 등록 → PIN 권유 |

### 사용자가 결정해야 할 사항 (다음 세션 시작 전 합의 필요)
1. **비밀번호 정책** — 최소 자릿수? 영문+숫자? 특수문자 필수?
   - 권장: 최소 8자, 영문+숫자 조합. 특수문자는 선택
2. **가입 직후 PIN 설정 UX** — 모달? 작은 버튼? 별도 화면?
   - 권장: 가입 완료 화면(done)에 "💡 다음 로그인부터 6자리 PIN으로 빨라요" 작은 버튼
3. **PIN 잠금 정책** — 비밀번호 5회 잠금과 동일하게?
4. **PIN 분실 시** — 비밀번호 로그인 → PIN 재설정 (단순)

### 7단계 작업 (PROGRESS.md에 상세 기록됨, 6~10시간)
1. DB 변경 (SQL) — `profiles.pin_hash` + `pin_failed_count` + `pin_locked_until` + RPC 4개
2. auth.html 대규모 수정 — 가입 비번 input 일반화, 로그인 화면 자동 분기
3. `pin-setup.html` 신규 + 마이페이지 메뉴
4. 기기 관리 화면 (Option C 후속)
5. password-change.html 재구성
6. 비번 재설정 흐름 일반 비번으로 변경
7. (현재 사용자 0명이라 마이그레이션 단순)

---

## 8. 막힌 곳 / 알려진 문제

### 🚨 현재 막힌 곳
- **Supabase 무료 프로젝트 paused 추정** — 7일 미사용 자동 정지. 회원가입/사전신청 등 모든 기능 실패.
- 해결: 사용자가 https://supabase.com/dashboard 에서 프로젝트 → "Restore project" 클릭. 1~3분 대기.

### 미해결 작업 (낮은 우선순위)
- [ ] task #70: 메일 지연 원인 진단 (Resend 발송 지연)
- [ ] task #76: `consents.consent_type` CHECK 제약 재정의 (campus, rules 추가)
- [ ] Supabase Dashboard에서 OTP 8자리 → 6자리 (이전 작업)
- [ ] `www.studypotato.com` CNAME 추가 (Namecheap) — 사용자 결정 대기

### 큰 미완성 작업
- [ ] **매칭 알고리즘** (가장 큰 산) — 매칭 카드 데이터로 어떤 사람들을 묶을지 점수 계산 + 자동 매칭 스케줄
- [ ] 사용자가 100명 모이면 PWA 변환 (manifest + service worker + 아이콘)
- [ ] 사용자가 500명 모이면 Capacitor 정식 앱
- [ ] 매칭 탭 더미 → 실데이터 연동 (현재 dev-toggle)
- [ ] 내 스터디 더미 → 실데이터
- [ ] 고객의 소리 백엔드 (feedback 테이블 + Edge Function)
- [ ] 인앱 알림 시스템 (현재 메일만)
- [ ] 정보보안 교수님 메일 (서비스 완성 후)

---

## 9. 작업 규칙 (중요)

1. **docx는 명시적 요청 시에만 수정** — 사용자가 "소개서 수정해줘" 같이 직접 말한 경우만
2. **SQL 실행은 사용자가** — Claude가 직접 못 함. SQL 파일 제공하고 사용자가 Supabase SQL Editor에서 실행
3. **이메일 템플릿은 명시 요청 시만** 수정 (Resend/Supabase 둘 다)
4. **상위 모델로 옮긴 후 첫 세션**: 가장 먼저 `git status` 실행해서 EOL 문제 확인 + 이번 세션 변경사항 의도 확인 후 commit

---

## 10. 차기 세션 추천 첫 작업 순서

1. **확인** — Supabase paused 여부, studypotato.com 동작 여부, git status
2. **commit/push** — 이번 세션 변경사항 정리 (EOL 폐기 → add → commit → push)
3. **사용자와 합의** — 새 인증 모델 결정 사항 4가지 (위 7번 섹션)
4. **구현** — registered_devices.sql 실행 확인 → 새 인증 모델 7단계 진행
5. **그 다음** — 매칭 알고리즘 설계 (가장 큰 산. 별도 세션 추천)

---

## 부록: 자주 쓰는 명령어

```bash
# 변경사항 확인
cd C:\GitHub\studypotato
git status
git diff [파일]

# EOL 문제 검사 (CRLF로 바뀐 파일 확인)
git diff --stat
file CNAME index.html

# Supabase 함수 배포 (Edge Function 수정 시)
supabase functions deploy send-welcome-email
supabase functions deploy send-pre-register-email

# 로컬 미리보기 (preview 폴더)
cd C:\GitHub\studypotato\preview
python -m http.server 8000   # 또는 npx serve
# 브라우저: http://localhost:8000
```

---

**작성**: 이번 세션 마지막 (Sonnet)
**다음 세션 시작 시 안내 멘트 예시**: 
> "C:\GitHub\studypotato\HANDOFF.md 파일을 먼저 읽고 컨텍스트 파악 후 작업 시작해줘"
