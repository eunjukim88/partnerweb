/**
 * 예약 관련 상수 정의
 */

// 예약 경로
export const BOOKING_SOURCES = [
  { value: 'DIRECT', label: '직접예약' },
  { value: 'AIRBNB', label: '에어비앤비' },
  { value: 'YANOLJA', label: '야놀자' },
  { value: 'YEOGI', label: '여기어때' },
  { value: 'BOOKING', label: '부킹닷컴' },
  { value: 'AGODA', label: '아고다' },
  { value: 'OTHER', label: '기타' }
];

// 숙박 타입
export const STAY_TYPES = {
  HOURLY: 'hourly',
  NIGHTLY: 'nightly',
  LONG_TERM: 'long_term'
};

// 숙박 타입 매핑 (프론트엔드 <-> 백엔드)
export const STAY_TYPE_MAP = {
  '대실': STAY_TYPES.HOURLY,
  '숙박': STAY_TYPES.NIGHTLY,
  '장기': STAY_TYPES.LONG_TERM
};

// 숙박 타입 역매핑 (백엔드 -> 프론트엔드)
export const REVERSE_STAY_TYPE_MAP = {
  [STAY_TYPES.HOURLY]: '대실',
  [STAY_TYPES.NIGHTLY]: '숙박',
  [STAY_TYPES.LONG_TERM]: '장기'
};

// 기본 시간 설정
export const DEFAULT_TIMES = {
  CHECK_IN: '15:00',
  CHECK_OUT: '11:00',
  HOURLY_DURATION: '18:00'  // 대실 체크아웃
};

// 기본 요금 설정
export const DEFAULT_RATES = {
  WEEKDAY: 0,
  FRIDAY: 0,
  WEEKEND: 0
};

// 요일 설정 (비트마스크 기본값)
export const DEFAULT_AVAILABLE_DAYS = '1111111';  // 월화수목금토일 모두 가능
