import { format } from 'date-fns';

// dateUtils 추가
const dateUtils = {
  startOfDay: (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  },
  
  endOfDay: (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  },

  formatDate: (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDate: (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  },

  getKSTDate: (date = new Date()) => {
    const kstOffset = 9 * 60;
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (kstOffset * 60000));
  }
};

// 기존 유틸리티 함수들
const formatTime = (time) => {
  if (!time) return '';
  return time.slice(0, 5);
};

const checkDelayStatus = (checkInTime, checkOutTime, stayType) => {
  if (!checkInTime || !checkOutTime) return { isDelayed: false, type: null };
  
  const now = new Date();
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const [inHours, inMinutes] = checkInTime.slice(0, 5).split(':');
  const [outHours, outMinutes] = checkOutTime.slice(0, 5).split(':');
  
  let checkInDate = new Date();
  let checkOutDate = new Date();
  
  checkInDate.setHours(parseInt(inHours), parseInt(inMinutes), 0);
  
  if (stayType === 'hourlyStay') {
    checkOutDate.setHours(parseInt(outHours), parseInt(outMinutes), 0);
    if (now > checkOutDate) {
      return { isDelayed: true, type: 'checkout' };
    } else if (now > checkInDate) {
      return { isDelayed: true, type: 'checkin' };
    }
  } else {
    checkOutDate = new Date(tomorrow);
    checkOutDate.setHours(parseInt(outHours), parseInt(outMinutes), 0);
    
    const isToday = now.getDate() === today.getDate();
    const isTomorrow = now.getDate() === tomorrow.getDate();
    
    if (isToday && now > checkInDate) {
      return { isDelayed: true, type: 'checkin' };
    } else if (isTomorrow && now > checkOutDate) {
      return { isDelayed: true, type: 'checkout' };
    }
  }
  
  return { isDelayed: false, type: null };
};

const checkReservationOverlap = (reservations, roomId, checkIn, checkOut, excludeReservationId = null) => {
  return reservations.some(r => 
    r.room_id === roomId &&
    r.reservation_id !== excludeReservationId &&
    new Date(r.check_out_date) > new Date(checkIn) &&
    new Date(r.check_in_date) < new Date(checkOut)
  );
};

const getStatusText = (status) => {
  const statusMap = {
    longStay: '장기',
    overnightStay: '숙박',
    hourlyStay: '대실',
    vacant: '공실',
    reservationComplete: '예약완료',
    cleaningRequested: '청소요청',
    cleaningInProgress: '청소중',
    cleaningComplete: '청소완료',
    inspectionRequested: '점검요청',
    underInspection: '점검중',
    inspectionComplete: '점검완료',
    salesStopped: '판매중지'
  };
  return statusMap[status] || status;
};

const validateReservation = (data, settings) => {
  // 필수 필드 검증
  const requiredFields = [
    'reservation_number',
    'guest_name',
    'phone',
    'booking_source',
    'stay_type',
    'check_in_date',
    'check_out_date',
    'room_id'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${getFieldName(field)}은(는) 필수 입력 항목입니다.`);
    }
  }

  // 날짜 유효성 검증
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  const now = dateUtils.startOfDay(new Date());

  if (checkIn < now) {
    throw new Error('체크인 날짜는 오늘 이후여야 합니다.');
  }

  if (checkOut < checkIn) {
    throw new Error('체크아웃 날짜는 체크인 날짜 이후여야 합니다.');
  }

  // 숙박 유형별 설정 검증
  const stayTypeSettings = settings?.[data.stay_type];
  if (!stayTypeSettings) {
    throw new Error('올바르지 않은 숙박 유형입니다.');
  }

  // 체크인/아웃 시간 검증
  if (!data.check_in_time || !data.check_out_time) {
    throw new Error('체크인/아웃 시간이 설정되어 있지 않습니다.');
  }

  return true;
};

// 필드명 한글화
const getFieldName = (field) => {
  const fieldNames = {
    reservation_number: '예약번호',
    guest_name: '예약자명',
    phone: '연락처',
    booking_source: '예약 경로',
    stay_type: '숙박 유형',
    check_in_date: '체크인 날짜',
    check_out_date: '체크아웃 날짜',
    room_id: '객실'
  };
  return fieldNames[field] || field;
};

// API 에러 처리
const handleApiError = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  return error.message || '알 수 없는 오류가 발생했습니다.';
};

export const reservationUtils = {
  formatTime,
  checkDelayStatus,
  checkReservationOverlap,
  getStatusText,
  dateUtils,
  validateReservation,
  handleApiError
}; 