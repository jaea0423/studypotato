// =====================================================
// device.js — 기기 식별 유틸 (Option C 기기 등록 인증)
// =====================================================
// 역할:
//   - 이 브라우저 고유의 device_id (UUID) 발급 및 보관
//   - 사람이 알아볼 수 있는 device_label 생성 (예: 'Chrome · Windows')
//   - localStorage에 영속 보관 (브라우저 데이터 지우면 새 기기로 인식)
//
// 보안 메모:
//   - device_id 자체는 비밀이 아님(localStorage에 평문 저장)
//   - 보안의 핵심은 "이 device_id가 서버 registered_devices 테이블에
//     등록되어 있는지 + 본인 user_id와 매칭되는지"를 RPC로 검증하는 것
//   - 즉, 공격자가 device_id를 알아도 본인 계정으로 OTP 인증을
//     통과하지 않으면 등록할 수 없음
// =====================================================

(function(){
  var KEY_DEVICE_ID    = 'studypotato_device_id';
  var KEY_DEVICE_LABEL = 'studypotato_device_label';

  // RFC4122 v4 UUID (crypto API 사용)
  function uuidv4(){
    // crypto.randomUUID가 있으면 그것 사용 (모던 브라우저)
    if(window.crypto && typeof window.crypto.randomUUID === 'function'){
      return window.crypto.randomUUID();
    }
    // fallback: getRandomValues
    var bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    // version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // variant 10
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.from(bytes).map(function(b){
      return b.toString(16).padStart(2, '0');
    }).join('');
    return hex.slice(0,8) + '-' + hex.slice(8,12) + '-' +
           hex.slice(12,16) + '-' + hex.slice(16,20) + '-' + hex.slice(20);
  }

  // UA에서 브라우저 + OS 추론 (사용자 표시용)
  function detectLabel(){
    var ua = navigator.userAgent || '';
    var browser = 'Unknown';
    var os = '';

    // 브라우저 — 순서 중요 (Edge가 Chrome 문자열을 포함)
    if(/Edg\//.test(ua))         browser = 'Edge';
    else if(/OPR\//.test(ua))    browser = 'Opera';
    else if(/Chrome\//.test(ua) && !/Chromium\//.test(ua)) browser = 'Chrome';
    else if(/Firefox\//.test(ua))browser = 'Firefox';
    else if(/Safari\//.test(ua)) browser = 'Safari';
    else if(/SamsungBrowser/.test(ua)) browser = 'Samsung Internet';

    // OS
    if(/iPhone|iPad|iPod/.test(ua))      os = 'iOS';
    else if(/Android/.test(ua))          os = 'Android';
    else if(/Windows/.test(ua))          os = 'Windows';
    else if(/Mac OS X/.test(ua))         os = 'Mac';
    else if(/Linux/.test(ua))            os = 'Linux';

    return os ? (browser + ' · ' + os) : browser;
  }

  // 기기 ID 가져오기 (없으면 새로 발급)
  function getDeviceId(){
    var id = null;
    try { id = localStorage.getItem(KEY_DEVICE_ID); } catch(e){}
    if(!id){
      id = uuidv4();
      try { localStorage.setItem(KEY_DEVICE_ID, id); } catch(e){}
    }
    return id;
  }

  // 기기 라벨 (사용자에게 표시)
  function getDeviceLabel(){
    var label = null;
    try { label = localStorage.getItem(KEY_DEVICE_LABEL); } catch(e){}
    if(!label){
      label = detectLabel();
      try { localStorage.setItem(KEY_DEVICE_LABEL, label); } catch(e){}
    }
    return label;
  }

  // device_id가 localStorage에 이미 있었는지 (= '등록된 기기' 후보)
  function hasExistingDeviceId(){
    try { return !!localStorage.getItem(KEY_DEVICE_ID); }
    catch(e){ return false; }
  }

  // 강제로 새 device_id 발급 (테스트/디버그용)
  function resetDeviceId(){
    try {
      localStorage.removeItem(KEY_DEVICE_ID);
      localStorage.removeItem(KEY_DEVICE_LABEL);
    } catch(e){}
    return getDeviceId();
  }

  // 전역에 노출
  window.deviceUtil = {
    getDeviceId:        getDeviceId,
    getDeviceLabel:     getDeviceLabel,
    hasExistingDeviceId: hasExistingDeviceId,
    resetDeviceId:      resetDeviceId,
    userAgent:          navigator.userAgent
  };
})();
