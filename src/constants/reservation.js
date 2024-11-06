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

// 숙박 타입 (DB와 동일)
export const STAY_TYPES = [
  { value: '대실', label: '대실' },
  { value: '숙박', label: '숙박' },
  { value: '장기', label: '장기' }
];

export const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];