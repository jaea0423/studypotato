-- =====================================================
-- 기기별 PIN 간편로그인 (Device-bound Quick Login PIN)
-- =====================================================
-- 작성: 2026-06-25 / 인증 모델 확정안 반영
--
-- 핵심 결정:
--   - PIN은 "계정 단위"가 아니라 "기기 단위"로 저장한다.
--     (한 기기 PIN이 새도 다른 기기는 안전 = 격리)
--   - PIN 5회 틀리면 그 기기 등록을 통째로 해제(삭제)한다.
--     → 별도 잠금 타이머(pin_locked_until) 불필요.
--   - 약한 PIN(000000 등)은 차단하지 않는다 (본인 허락 기기 + 5회 제한 한정).
--
-- ⚠️ 실행 순서:
--   ① 먼저 registered_devices.sql 실행 (테이블 생성)
--   ② 그 다음 이 파일 실행
--
-- ⚠️ 중요(읽어주세요):
--   "PIN으로 로그인" = 로그인 화면(= 아직 비로그인 상태)에서 일어남.
--   이때는 auth.uid() 가 없으므로, PIN을 검증하고 "세션을 새로 발급"하는 일은
--   SQL RPC만으로 못 한다 → 서버 권한(service_role)을 가진 Edge Function이 필요하다.
--   이 파일은 (1) 데이터 구조 (2) 로그인된 상태에서의 PIN 관리(set/clear)
--   (3) Edge Function이 호출할 검증 함수까지만 담는다.
--   실제 "PIN → 세션 발급" Edge Function은 다음 단계에서 작성.
-- =====================================================


-- ----------------------------------------------------
-- 0. bcrypt 해시용 확장 (없으면 설치)
-- ----------------------------------------------------
-- crypt(), gen_salt() 함수를 쓰기 위함. PIN 원본은 절대 저장하지 않고
-- bcrypt 해시만 저장한다.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ----------------------------------------------------
-- 1. registered_devices 에 PIN 컬럼 추가
-- ----------------------------------------------------
-- pin_hash         : 이 기기 전용 PIN의 bcrypt 해시 (NULL = 이 기기는 PIN 미설정)
-- pin_failed_count : 연속 실패 횟수 (5 도달 시 이 기기 row 삭제)
ALTER TABLE public.registered_devices
  ADD COLUMN IF NOT EXISTS pin_hash         text,
  ADD COLUMN IF NOT EXISTS pin_failed_count int NOT NULL DEFAULT 0;


-- ----------------------------------------------------
-- 2. RPC: 이 기기에 PIN 설정/변경  (로그인된 상태에서 호출)
-- ----------------------------------------------------
-- 가입 직후 권유 / 설정 화면에서 사용.
-- 본인(auth.uid())의 해당 device_id row 에만 적용된다.
CREATE OR REPLACE FUNCTION public.set_device_pin(
  p_device_id text,
  p_pin       text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 로그인 상태여야 함
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- PIN 형식: 숫자 정확히 6자리 (약한 PIN 자체는 막지 않음)
  IF p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'invalid_pin_format';
  END IF;

  -- 본인 + 등록된 기기에만 PIN 저장 (bcrypt 해시)
  UPDATE public.registered_devices
     SET pin_hash         = crypt(p_pin, gen_salt('bf')),
         pin_failed_count = 0
   WHERE user_id   = auth.uid()
     AND device_id = p_device_id;

  -- 해당 기기가 등록돼 있지 않으면 에러 (먼저 register_my_device 필요)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'device_not_registered';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_device_pin(text, text) TO authenticated;


-- ----------------------------------------------------
-- 3. RPC: 이 기기 PIN 해제  (로그인된 상태에서 호출)
-- ----------------------------------------------------
-- 설정 화면의 "PIN 해제". 기기 등록 자체는 유지하고 PIN만 지운다.
-- (해제 후 이 기기는 비밀번호로 로그인)
CREATE OR REPLACE FUNCTION public.clear_device_pin(
  p_device_id text
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

  UPDATE public.registered_devices
     SET pin_hash         = NULL,
         pin_failed_count = 0
   WHERE user_id   = auth.uid()
     AND device_id = p_device_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.clear_device_pin(text) TO authenticated;


-- ----------------------------------------------------
-- 4. RPC: 이 기기에 PIN이 설정돼 있는지  (로그인된 상태에서 호출)
-- ----------------------------------------------------
-- 설정 화면 토글의 현재 상태(켜짐/꺼짐) 표시용.
CREATE OR REPLACE FUNCTION public.device_has_pin(
  p_device_id text
)
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
      AND pin_hash IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.device_has_pin(text) TO authenticated;


-- ----------------------------------------------------
-- 5. RPC: PIN 검증 + 실패 처리  (Edge Function / service_role 전용)
-- ----------------------------------------------------
-- ⚠️ 이 함수는 "비로그인 상태의 로그인 화면"에서 쓰인다.
--    그래서 auth.uid() 대신 p_user_id 를 인자로 받는다.
--    → Edge Function이 (이메일로 user_id 조회한 뒤) service_role 권한으로 호출.
--
-- 동작:
--   - 일치  → pin_failed_count 0으로 리셋, last_used_at 갱신, true 반환
--   - 불일치 → pin_failed_count +1, 5 도달하면 그 기기 row 삭제(등록 해제), false 반환
--   - 등록 안 됐거나 PIN 미설정 → false
--
-- 보안: anon / authenticated 에게 GRANT 하지 않는다.
--       (일반 클라이언트가 직접 호출해 무차별 대입하는 것 차단.
--        service_role 은 GRANT 여부와 무관하게 호출 가능)
CREATE OR REPLACE FUNCTION public.verify_and_consume_device_pin(
  p_user_id   uuid,
  p_device_id text,
  p_pin       text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id    uuid;
  v_hash  text;
  v_count int;
BEGIN
  -- 해당 사용자 + 기기 row 조회
  SELECT id, pin_hash, pin_failed_count
    INTO v_id, v_hash, v_count
    FROM public.registered_devices
   WHERE user_id   = p_user_id
     AND device_id = p_device_id;

  -- 등록 안 됐거나 PIN 미설정 → 실패
  IF v_id IS NULL OR v_hash IS NULL THEN
    RETURN false;
  END IF;

  -- PIN 일치 (bcrypt 비교)
  IF v_hash = crypt(p_pin, v_hash) THEN
    UPDATE public.registered_devices
       SET pin_failed_count = 0,
           last_used_at     = now()
     WHERE id = v_id;
    RETURN true;
  END IF;

  -- 불일치 → 실패 +1, 5회 도달하면 이 기기 등록 해제(삭제)
  IF v_count + 1 >= 5 THEN
    DELETE FROM public.registered_devices WHERE id = v_id;
  ELSE
    UPDATE public.registered_devices
       SET pin_failed_count = v_count + 1
     WHERE id = v_id;
  END IF;

  RETURN false;
END;
$$;

-- 일반 클라이언트 호출 차단 (service_role 전용)
REVOKE ALL ON FUNCTION public.verify_and_consume_device_pin(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_and_consume_device_pin(uuid, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.verify_and_consume_device_pin(uuid, text, text) FROM authenticated;


-- ----------------------------------------------------
-- 검증용 쿼리 (실행 후 확인)
-- ----------------------------------------------------
-- 컬럼 추가 확인:
--   SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'registered_devices' ORDER BY ordinal_position;
-- 함수 목록 확인:
--   SELECT proname FROM pg_proc
--    WHERE proname IN ('set_device_pin','clear_device_pin',
--                      'device_has_pin','verify_and_consume_device_pin');
