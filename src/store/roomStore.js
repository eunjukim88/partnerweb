import { create } from 'zustand';
import axios from 'axios';
import { stayTypeMap } from './reservationSettingsStore';
import { formatDate } from './reservationStore';

/**
 * 객실 관리 스토어
 * 
 * 연관 스토어:
 * - reservationSettingsStore: 기본 요금 및 설정
 * - reservationStore: 예약 관리
 * 
 * API 연계:
 * - /api/mypage/rooms: 객실 정보 CRUD
 * - /api/mypage/rooms/available: 가용 객실 조회
 */
const useRoomStore = create((set, get) => ({
  rooms: [],
  isLoading: false,
  error: null,

  /**
   * 객실별 설정 조회
   * @param {string} roomNumber - 객실 번호
   * @param {string} stayType - 숙박 타입
   * 
   * 처리 과정:
   * 1. 객실별 설정 확인
   * 2. 공통 설정과 병합
   * 3. 판매 제한 체크
   * 
   * 사용처:
   * - 예약 생성 시 요금 계산
   * - 객실 정보 표시
   */
  getRoomSettings: (roomNumber, stayType) => {
    const room = get().rooms.find(r => r.number === roomNumber);
    const commonSettings = useReservationSettingsStore.getState().settings;
    
    if (!room || !commonSettings) {
      console.log('설정을 찾을 수 없음:', { room, commonSettings });
      return null;
    }

    if (!room.salesLimit[stayType]) {
      console.log(`${roomNumber}호 ${stayType} 판매 제한됨`);
      return null;
    }

    // 객실별 요금과 공통 요금 병합
    const rates = {
      weekday: room.rates[`${stayType}_weekday`] || commonSettings[stayType]?.weekday_rate,
      friday: room.rates[`${stayType}_friday`] || commonSettings[stayType]?.friday_rate,
      weekend: room.rates[`${stayType}_weekend`] || commonSettings[stayType]?.weekend_rate
    };

    console.log('최종 객실 설정:', {
      roomNumber,
      stayType,
      rates,
      useCustomRates: !!room.rates[`${stayType}_weekday`]
    });

    return {
      ...commonSettings[stayType],
      ...rates,
      roomNumber
    };
  },

  /**
   * 예약 가능 객실 조회
   * @param {string} stayType - 숙박 타입
   * @param {Date} checkIn - 체크인 날짜
   * @param {Date} checkOut - 체크아웃 날짜
   * 
   * 처리 과정:
   * 1. 판매 제한 체크
   * 2. 날짜 유효성 검증
   * 3. API 호출로 가용성 확인
   * 4. 요금 계산
   * 
   * 사용처:
   * - 예약 생성 시 객실 선택
   * - 캘린더 뷰 가용 객실 표시
   */
  getAvailableRooms: async (stayType, checkIn, checkOut) => {
    try {
      const rooms = get().rooms;
      const mappedType = stayTypeMap[stayType];
      
      // 유효성 검증
      if (!mappedType) {
        throw new Error('잘못된 숙박 유형입니다.');
      }

      if (checkIn >= checkOut) {
        throw new Error('체크아웃 시간은 체크인 시간보다 이후여야 합니다.');
      }

      // KST 시간 변환
      const formatToKST = (date) => {
        const d = new Date(date);
        return d.toISOString();
      };

      // 판매 제한 필터링
      const availableRooms = rooms.filter(room => {
        return room.salesLimit && !room.salesLimit[mappedType];
      });

      // API로 가용성 확인
      const response = await axios.get('/api/mypage/rooms/available', {
        params: {
          stayType: mappedType,
          checkIn: formatToKST(checkIn),
          checkOut: formatToKST(checkOut)
        }
      });

      // 최종 가용 객실 목록 생성
      const finalAvailableRooms = availableRooms
        .filter(room => response.data.some(availableRoom => availableRoom.number === room.number))
        .map(room => {
          const settings = get().getRoomSettings(room.number, mappedType);
          return {
            ...room,
            price: settings ? calculatePrice(settings, checkIn, checkOut) : 0
          };
        });

      return finalAvailableRooms;
    } catch (error) {
      console.error('가용 객실 조회 실패:', error);
      return [];
    }
  },

  /**
   * 전체 객실 정보 조회
   * 
   * 처리 과정:
   * 1. API 호출
   * 2. 응답 데이터 구조화
   * 3. 상태 업데이트
   * 
   * 사용처:
   * - 객실 관리 페이지
   * - 대시보드 현황
   */
  fetchRooms: async () => {
    console.log('객실 정보 로딩 시작');
    set({ isLoading: true });
    try {
      const response = await axios.get('/api/mypage/rooms');
      
      const roomsWithSettings = response.data.map(room => ({
        ...room,
        display: {
          floor: room.show_floor || false,
          building: room.show_building || false,
          name: room.show_name || false,
          type: room.show_type || false
        },
        salesLimit: {
          hourly: room.hourly || false,
          nightly: room.nightly || false,
          long_term: room.long_term || false
        },
        rates: {
          hourly_weekday: room.hourly_weekday || '',
          hourly_friday: room.hourly_friday || '',
          hourly_weekend: room.hourly_weekend || '',
          nightly_weekday: room.nightly_weekday || '',
          nightly_friday: room.nightly_friday || '',
          nightly_weekend: room.nightly_weekend || ''
        }
      }));

      set({ 
        rooms: roomsWithSettings,
        isLoading: false, 
        error: null 
      });

      return roomsWithSettings;
    } catch (error) {
      console.error('객실 정보 로딩 실패:', error);
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  /**
   * 정렬된 객실 번호 목록 반환
   * 
   * 사용처:
   * - 객실 선택 드롭다운
   * - 객실 목록 표시
   */
  getSortedRoomNumbers: () => {
    const { rooms } = get();
    if (!rooms.length) return [];
    
    return rooms
      .map(room => room.number)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }
}));

export default useRoomStore;