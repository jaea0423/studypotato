// ============================================================
// 익명 닉네임 생성 유틸
// 사용 예:
//   genAnonymous()              → "익명 씩씩한감자"
//   genAnonymous(seed)          → 시드 기반 deterministic (글마다 다른 익명, 같은 글 안에선 일관)
//   genAnonymousList(n, seed)   → 글 안 댓글 작성자별로 "익명 1, 익명 2..." 같은 단순 표시 원할 때
//
// 정책:
//  - 익명 표시는 항상 "익명 + 닉네임" 패턴으로 익명임을 명확히
//  - 형용사 + 채소 조합으로 친근하게
//  - 매칭/팀 확정 후에는 사용 X (실제 닉네임으로 표시)
// ============================================================

// 긍정적 형용사 (부정적/공격적인 단어 금지)
const ADJECTIVES = [
  '씩씩한', '귀여운', '똘똘한', '용감한', '친절한', '상냥한', '활발한',
  '재밌는', '따뜻한', '부지런한', '느긋한', '꼼꼼한', '담담한', '온순한',
  '명랑한', '발랄한', '조용한', '지혜로운', '슬기로운', '의젓한',
  '센스있는', '수줍은', '솔직한', '든든한', '기특한', '소중한',
  '반짝이는', '포근한', '말랑한', '쫀쫀한', '바삭한', '향긋한',
  '졸린', '배고픈', '신나는', '두근거리는', '평온한', '뽀송한'
];

// 친숙한 채소 (2~4글자)
const VEGETABLES = [
  '감자', '고구마', '대파', '당근', '양파', '마늘', '오이', '호박',
  '가지', '시금치', '상추', '깻잎', '브로콜리', '콩나물', '버섯', '무',
  '배추', '양배추', '파프리카', '피망', '토마토', '옥수수', '완두콩',
  '고추', '생강', '연근', '우엉', '도라지', '쑥갓', '청경채',
  '아보카도', '아스파라거스', '셀러리', '비트', '루꼴라'
];

/**
 * 시드(글 id 등)와 사용자 id 조합으로 deterministic한 익명 닉네임 생성
 * 같은 (post_id, user_id) 조합은 항상 같은 익명 닉네임을 반환
 * 다른 글로 가면 같은 사용자라도 다른 익명 닉네임 (추적 방지)
 *
 * @param {string|number} seed - 글/스레드 식별자 (없으면 랜덤)
 * @param {string|number} userId - 사용자 식별자 (있어야 같은 글에서 일관성)
 * @returns {string} "익명 씩씩한감자" 형태
 */
function genAnonymous(seed = null, userId = null){
  let hash;
  if(seed !== null && userId !== null){
    // deterministic — 같은 (seed, userId)는 항상 같은 결과
    hash = simpleHash(`${seed}:${userId}`);
  } else {
    // 완전 랜덤
    hash = Math.floor(Math.random() * 0xffffffff);
  }
  const adj = ADJECTIVES[hash % ADJECTIVES.length];
  const veg = VEGETABLES[Math.floor(hash / ADJECTIVES.length) % VEGETABLES.length];
  return `익명 ${adj}${veg}`;
}

/**
 * 글 안에서 댓글 작성자별로 순서대로 부여하는 단순 익명 ("익명 1", "익명 2"...)
 * 같은 user는 같은 번호 유지
 *
 * @param {Array<string>} userIdList - 댓글 작성 순서대로의 사용자 id 배열
 * @returns {Map<string, string>} userId → "익명 1" 같은 매핑
 */
function genAnonymousMap(userIdList){
  const map = new Map();
  let counter = 1;
  for(const uid of userIdList){
    if(!map.has(uid)){
      map.set(uid, `익명 ${counter}`);
      counter++;
    }
  }
  return map;
}

// 간단한 문자열 → 정수 해시 (FNV-1a 변형)
function simpleHash(str){
  let h = 2166136261;
  for(let i = 0; i < str.length; i++){
    h ^= str.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

// 다른 파일에서 사용 가능하게 window에 노출
if(typeof window !== 'undefined'){
  window.AnonymousNick = { genAnonymous, genAnonymousMap };
}
