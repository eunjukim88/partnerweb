import { create } from 'zustand';
import axios from 'axios';
import useReservationSettingsStore from './reservationSettingsStore';

/**
 * 예약 관리 스토어
 * 
 * 연관 스토어:
 * - reservationSettingsStore: 예약 설정 참조
 * - roomStore: 객실 정보 참조
 * 
 * API 연계:
 * - /api/reservations: 예약 CRUD
 * - /api/mypage/rooms: 객실 정보 조회
 * - /api/reservations/reserved-rooms: 예약 가능 객실 조회
 */
const useReservationStore = create((set, get) => ({
  reservations: [],
  isLoading: false,
  error: null,

  /**
   * 예약 가능 요일 조회
   * @param {string} stayType - 숙박 타입 (대실/숙박/장기)
   * 
   * 처리 과정:
   * 1. 설정 스토어에서 타입별 설정 조회
   * 2. 요일 비트마스크 반환
   * 
   * 사용처:
   * - 예약 폼의 날짜 선택 제한
   * - 캘린더 뷰의 예약 가능일 표시
   */
  getAvailableDays: async (stayType) => {
    try {
      const settings = useReservationSettingsStore.getState().settings;
      console.log('store - 현재 settings:', settings);
      console.log('store - 요청된 stayType:', stayType);
      
      const typeToKey = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };
      
      const mappedType = typeToKey[stayType];
      const stayTypeSettings = settings[mappedType];

      if (!stayTypeSettings) {
        console.log('설정을 찾을 수 없음. 현재 settings:', settings);
        throw new Error('예약 설정을 찾을 수 없습니다.');
      }

      return {
        duration: stayTypeSettings.default_duration
      };
    } catch (error) {
      console.error('예약 가능 요일 조회 실패:', error);
      throw error;
    }
  },

  /**
   * 날짜 유효성 검증
   * @param {Date} date - 검증할 날짜
   * @param {number} duration - 요일 비트마스크
   * 
   * 처리 과정:
   * 1. 날짜의 요일 확인
   * 2. 비트마스크로 예약 가능 여부 확인
   * 
   * 사용처:
   * - 예약 생성 시 날짜 검증
   * - 예약 수정 시 날짜 검증
   */
  validateDate: (date, duration) => {
    if (!date || !duration) return true;

    const dayOfWeek = date.getDay();
    const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    const isAvailable = !!(duration & (1 << (adjustedDay - 1)));
    if (!isAvailable) {
      throw new Error('INVALID_DATE');
    }
    
    return true;
  },

  /**
   * 예약 가능 객실 조회
   * @param {Object} params
   * @param {string} params.checkIn - 체크인 날짜
   * @param {string} params.checkOut - 체크아웃 날짜
   * @param {string} params.stayType - 숙박 타입
   * 
   * 사용처:
   * - 예약 생성 시 객실 선택
   * - 예약 수정 시 객실 변경
   */
  getAvailableRooms: async ({ checkIn, checkOut, stayType }) => {
    try {
      set({ isLoading: true });
      
      const response = await axios.get('/api/reservations/reserved-rooms', {
        params: {
          checkIn,
          checkOut,
          stayType
        }
      });

      return response.data;
    } catch (error) {
      console.error('객실 조회 실패:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 예약 생성
   * @param {Object} formData - 예약 폼 데이터
   * 
   * 처리 과정:
   * 1. 객실 정보 조회 및 검증
   * 2. 판매 제한 확인
   * 3. 예약 가능 여부 확인
   * 4. 요금 계산
   * 5. 예약 데이터 생성
   * 
   * 연관 API:
   * - /api/mypage/rooms: 객실 정보
   * - /api/reservations/reserved-rooms: 가용성 체크
   * - /api/mypage/reservation-settings: 요금 설정
   * - /api/reservations: 예약 생성
   */
  createReservation: async (formData) => {
    try {
      // 1. 객실 정보 조회
      const roomResponse = await axios.get('/api/mypage/rooms');
      const room = roomResponse.data.find(r => r.id === formData.roomId);
      
      if (!room) {
        throw new Error('객실을 찾을 수 없습니다.');
      }

      // 2. salesLimit 체크
      const stayTypeToLimit = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };
      
      if (room.salesLimit[stayTypeToLimit[formData.stayType]]) {
        throw new Error('현재 예약이 제한된 객실입니다.');
      }

      // 3. 예약 가능 여부 확인
      const availabilityCheck = await axios.get('/api/reservations/reserved-rooms', {
        params: {
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          stayType: formData.stayType
        }
      });

      const isAvailable = availabilityCheck.data.some(r => r.id === formData.roomId);
      if (!isAvailable) {
        throw new Error('이미 예약된 객실입니다.');
      }

      // 4. 요금 계산
      const checkInDate = new Date(formData.checkIn);
      const dayOfWeek = checkInDate.getDay();
      
      // 예약 설정에서 기본 요금 조회
      const settingsResponse = await axios.get('/api/mypage/reservation-settings');
      const settings = settingsResponse.data.find(s => s.stay_type === formData.stayType);
      
      let price = 0;
      
      // 객실별 요금이 있으면 우선 적용
      if (room.rates) {
        const rateType = stayTypeToLimit[formData.stayType];
        if (dayOfWeek === 5) { // 금요일
          price = room.rates[rateType]?.friday || 0;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 주말
          price = room.rates[rateType]?.weekend || 0;
        } else { // 평일
          price = room.rates[rateType]?.weekday || 0;
        }
      }
      
      // 객실별 요금이 없으면 기본 요금 적용
      if (price === 0 && settings) {
        if (dayOfWeek === 5) {
          price = settings.friday_rate;
        } else if (dayOfWeek === 0 || dayOfWeek === 6) {
          price = settings.weekend_rate;
        } else {
          price = settings.weekday_rate;
        }
      }

      // 5. 예약 데이터 생성
      const reservationData = {
        reservation_number: formData.reservationNumber, // 클라이언트에서 입력받은 값
        room_id: formData.roomId, // rooms 테이블의 id 참조
        room_number: room.number,
        guest_name: formData.guestName,
        phone: formData.phoneNumber,
        booking_source: formData.bookingSource,
        stay_type: formData.stayType,
        check_in: formData.checkIn,
        check_out: formData.checkOut,
        price: price,
        memo: formData.memo || ''
      };

      console.log('예약 생성 요청 데이터:', reservationData);
      
      const response = await axios.post('/api/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('예약 생성 실패:', error);
      throw new Error(error.response?.data?.error || '예약 생성에 실패했습니다.');
    }
  }
}));

export default useReservationStore;