// 게시글/댓글 시간 표시 포맷터
// 표시 규칙:
//   - 1분 미만   : '지금'
//   - 1~59분    : 'N분 전'
//   - 같은 날(>=1시간) : 'HH:MM' (24시간제)
//   - 어제      : '어제'
//   - 그 외     : 'M월 D일'
//
// 사용법:
//   <span class="time" data-time="2026-05-19T14:30:00+09:00"></span>
//   <span class="time" data-mins-ago="120"></span>   ← 더미 데이터 편의용
//   applyPostTimes() 또는 자동 (DOMContentLoaded)

(function(){
  // 단일 시각 → 표시 문자열
  function formatPostTime(dateLike){
    var target = new Date(dateLike);
    if(isNaN(target.getTime())) return '';
    var now = new Date();
    var diffMin = Math.floor((now - target) / 60000);

    // 미래 시각이면 그냥 '지금'으로 처리
    if(diffMin < 1) return '지금';
    if(diffMin < 60) return diffMin + '분 전';

    // 같은 날 ? → HH:MM
    var sameDay = target.getFullYear() === now.getFullYear()
               && target.getMonth()    === now.getMonth()
               && target.getDate()     === now.getDate();
    if(sameDay){
      var h = String(target.getHours()).padStart(2, '0');
      var m = String(target.getMinutes()).padStart(2, '0');
      return h + ':' + m;
    }

    // 어제 ? → '어제'
    var y = new Date(now);
    y.setDate(y.getDate() - 1);
    var isYesterday = target.getFullYear() === y.getFullYear()
                   && target.getMonth()    === y.getMonth()
                   && target.getDate()     === y.getDate();
    if(isYesterday) return '어제';

    // 그 외 → 'M월 D일'
    return (target.getMonth() + 1) + '월 ' + target.getDate() + '일';
  }

  // data-time(ISO) 혹은 data-mins-ago(숫자, 더미용) 속성이 있는 모든 요소에 적용
  function applyPostTimes(root){
    var scope = root || document;
    var els = scope.querySelectorAll('[data-time], [data-mins-ago]');
    var now = Date.now();
    els.forEach(function(el){
      var ts;
      if(el.dataset.minsAgo){
        // 더미: 지금으로부터 N분 전
        ts = now - Number(el.dataset.minsAgo) * 60 * 1000;
      } else {
        ts = el.dataset.time;
      }
      el.textContent = formatPostTime(ts);
    });
  }

  // 전역에 노출 (다른 스크립트에서 사용 가능)
  window.formatPostTime = formatPostTime;
  window.applyPostTimes = applyPostTimes;

  // 페이지 로드 시 자동 적용
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ applyPostTimes(); });
  } else {
    applyPostTimes();
  }
})();
