export const BOOKING_SOURCES = [
  '직접예약',
  '에어비앤비',
  '야놀자',
  '여기어때',
  '부킹닷컴',
  '아고다',
  '기타'
];

export const STAY_TYPES = [
  '대실',
  '숙박',
  '장기'
];

export const formatDateTime = (date, includeEndTime = false) => {
  if (!date) return '';
  
  const targetDate = new Date(date);
  if (includeEndTime) {
    targetDate.setHours(23, 59, 59, 999);
  }
  return targetDate.toISOString();
};

export const formatTimeToAmPm = (timeStr) => {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? '오후' : '오전';
    const hour = hours % 12 || 12;
    return `${period} ${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    console.error('시간 형식 변환 오류:', error);
    return '';
  }
}; 