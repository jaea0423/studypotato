-- =====================================================
-- Option C: 기기 등록 기반 인증 (Device-bound Authentication)
-- =====================================================
-- 목적: 학번이 노출돼도 비밀번호(PIN) 6자리만으로 로그인되는
--       보안 취약점 해결.
--
-- 흐름:
--   1) 회원가입 직후 첫 기기 자동 등록
--   2) 로그인 시도 시
--      - 등록된 기기 → PIN 입력
--      - 미등록 기기 → 메일 OTP 인증 → PIN 입력 → 기기 등록
--   3) 사용자가 "기기 관리"에서 기기 해제 가능
--
-- 적용 순서:
--   ① 이 SQL을 Supabase SQL Editor에서 실행
--   ② preview/js/device.js 가 클라이언트에서 device_id 발급
--   ③ auth.html 가입/로그인 흐름 수정 (다음 단계)
-- =====================================================


-- ----------------------------------------------------
-- 1. 테이블 생성
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registered_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- 클라이언트가 localStorage에서 발급한 UUID (서버는 검증만)
  device_id       text NOT NULL,
  -- 사용자에게 보여줄 라벨 (예: 'Chrome · Windows', 'Safari · iPhone')
  device_label    text,
  -- 디버깅/포렌식용 원본 UA
  user_agent      text,
  registered_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at    timestamptz NOT NULL DEFAULT now(),

  -- 같은 사용자의 같은 device_id 중복 등록 금지
  CONSTRAINT registered_devices_unique UNIQUE (user_id, device_id)
);

-- 본인 기기 조회 빠르게
CREATE INDEX IF NOT EXISTS idx_registered_devices_user
  ON public.registered_devices (user_id);


-- ----------------------------------------------------
-- 2. RLS 정책 (본인 기기만 접근)
-- ----------------------------------------------------
ALTER TABLE public.registered_devices ENABLE ROW LEVEL SECURITY;

-- 본인 기기 목록 조회
DROP POLICY IF EXISTS "own devices select" ON public.registered_devices;
CREATE POLICY "own devices select"
  ON public.registered_devices FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 본인 기기 등록 (회원가입 후 / 새 기기 OTP 인증 후)
DROP POLICY IF EXISTS "own devices insert" ON public.registered_devices;
CREATE POLICY "own devices insert"
  ON public.registered_devices FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 본인 기기 해제 (기기 관리 화면)
DROP POLICY IF EXISTS "own devices delete" ON public.registered_devices;
CREATE POLICY "own devices delete"
  ON public.registered_devices FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- last_used_at, device_label 갱신
DROP POLICY IF EXISTS "own devices update" ON public.registered_devices;
CREATE POLICY "own devices update"
  ON public.registered_devices FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());


-- ----------------------------------------------------
-- 3. RPC: 현재 기기 등록 여부 확인 (로그인 직후 호출)
-- ----------------------------------------------------
-- 로그인 성공 직후, 이 RPC로 현재 device_id가 본인 등록 기기인지 확인.
-- 만약 아니면 클라이언트는 즉시 로그아웃 + 새 기기 OTP 흐름으로 전환.
CREATE OR REPLACE FUNCTION public.is_my_device_registered(p_device_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.registered_devices
    WHERE user_id   = auth.uid()
      AND device_id = p_device_id
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_my_device_registered(text) TO authenticated;


-- ----------------------------------------------------
-- 4. RPC: 기기 등록 (회원가입 직후 / 새 기기 OTP 인증 직후)
-- ----------------------------------------------------
-- last_used_at 갱신 포함 (이미 등록된 기기면 갱신만)
CREATE OR REPLACE FUNCTION public.register_my_device(
  p_device_id    text,
  p_device_label text DEFAULT NULL,
  p_user_agent   text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.registered_devices (user_id, device_id, device_label, user_agent)
  VALUES (auth.uid(), p_device_id, p_device_label, p_user_agent)
  ON CONFLICT (user_id, device_id)
  DO UPDATE SET
    last_used_at = now(),
    device_label = COALESCE(EXCLUDED.device_label, public.registered_devices.device_label);
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_my_device(text, text, text) TO authenticated;


-- ----------------------------------------------------
-- 5. RPC: 다른 기기 모두 로그아웃 (현재 기기만 남김)
-- ----------------------------------------------------
-- 사용자가 "이 기기 외 모두 로그아웃"을 누르면 호출.
-- DB의 등록 기기에서 현재 device_id를 제외한 모두 삭제 → 그 기기들은
-- 다음 로그인 시 OTP 인증 다시 받아야 함.
-- (Supabase 세션 자체를 강제 종료하려면 admin API가 필요해서 우선 등록만 해제)
CREATE OR REPLACE FUNCTION public.revoke_other_devices(p_current_device_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  WITH del AS (
    DELETE FROM public.registered_devices
     WHERE user_id    = auth.uid()
       AND device_id <> p_current_device_id
    RETURNING 1
  )
  SELECT count(*) INTO v_count FROM del;

  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_other_devices(text) TO authenticated;


-- ----------------------------------------------------
-- 검증용 쿼리 (실행 후 확인)
-- ----------------------------------------------------
-- SELECT * FROM public.registered_devices;
-- SELECT public.is_my_device_registered('test-device-id');
