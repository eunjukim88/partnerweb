import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { STAY_TYPES, BOOKING_SOURCES, STAY_TYPE_MAP } from '../constants/reservation';
import useReservationSettingsStore from './reservationSettingsStore';
import useRoomStore from './roomStore';

const useReservationStore = create(
  persist(
    (set, get) => ({
      reservations: [],
      isLoading: false,
      error: null,

      // 예약번호 생성 함수
      generateReservationNumber: () => {
        const date = new Date();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `R${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${random}`;
      },

      // 요금 계산 함수
      calculateRate: (checkInDate, stayType) => {
        const settings = useReservationSettingsStore.getState().settings[stayType];
        if (!settings) return 0;

        const checkInDay = new Date(checkInDate).getDay();
        const availableDays = settings.available_days.split('');
        
        // 예약 불가능한 요일인 경우
        if (availableDays[checkInDay] === '0') {
          throw new Error('선택하신 날짜는 예약이 불가능합니다.');
        }
        
        // 요일별 요금 계산
        if (checkInDay === 5) {
          return settings.friday_rate;
        } else if (checkInDay === 6 || checkInDay === 0) {
          return settings.weekend_rate;
        }
        return settings.weekday_rate;
      },

      // 예약 가능 여부 확인
      validateReservation: async (data) => {
        const roomStore = useRoomStore.getState();
        const settingsStore = useReservationSettingsStore.getState();

        // 1. 객실 판매 가능 여부 확인
        const room = roomStore.rooms.find(r => r.id === data.room_id);
        if (!room[data.stay_type]) {
          throw new Error('선택하신 객실은 해당 숙박 유형으로 예약이 불가능합니다.');
        }

        // 2. 날짜 가능 여부 확인
        const dayIndex = new Date(data.check_in_date).getDay();
        const availableDays = settingsStore.settings[data.stay_type].available_days.split('');
        if (availableDays[dayIndex] === '0') {
          throw new Error('선택하신 날짜는 예약이 불가능합니다.');
        }

        // 3. 객실 예약 중복 확인
        const hasOverlap = get().reservations.some(r => 
          r.room_id === data.room_id &&
          !(new Date(r.check_out_date) <= new Date(data.check_in_date) || 
            new Date(r.check_in_date) >= new Date(data.check_out_date))
        );

        if (hasOverlap) {
          throw new Error('해당 기간에 이미 예약이 존재합니다.');
        }

        return true;
      },

      // 예약 생성
      createReservation: async (data) => {
        set({ isLoading: true });
        try {
          // stay_type이 DB 형식과 일치하는지 확인
          if (!['hourly', 'nightly', 'long_term'].includes(data.stay_type)) {
            throw new Error('잘못된 숙박 유형입니다.');
          }

          await get().validateReservation(data);
          const response = await axios.post('/api/reservations', data);
          
          // 객실 상태 업데이트
          await useRoomStore.getState().updateRoomStatus(
            data.room_id,
            data.stay_type
          );

          set(state => ({
            reservations: [...state.reservations, response.data],
            isLoading: false
          }));

          return response.data;
        } catch (error) {
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // 예약 조회
      fetchReservations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/reservations');
          set({ reservations: response.data, isLoading: false });
        } catch (error) {
          set({ 
            error: error.response?.data?.message || '예약 조회 실패',
            isLoading: false 
          });
        }
      },

      // 예약 가능한 객실 조회
      getAvailableRooms: async (checkInDate, checkOutDate, stayType) => {
        try {
          const rooms = useRoomStore.getState().rooms;
          const reservations = get().reservations;
          
          // 프론트엔드 타입을 백엔드 타입으로 변환
          const backendStayType = STAY_TYPE_MAP[stayType];
          
          if (!backendStayType) {
            console.error('Invalid stay type:', stayType);
            return [];
          }

          console.log('조회 파라미터:', {
            frontendType: stayType,
            backendType: backendStayType,
            checkInDate,
            checkOutDate,
            totalRooms: rooms.length
          });

          // 1. 숙박 타입에 따른 필터링
          let availableRooms = rooms.filter(room => {
            return room[backendStayType] === true;  // true일 때 예약 가능
          });

          // 2. 날짜 중복 체크
          if (checkInDate && checkOutDate) {
            availableRooms = availableRooms.filter(room => {
              const hasOverlap = reservations.some(r => 
                r.room_id === room.room_id &&
                new Date(r.check_out_date) > new Date(checkInDate) &&
                new Date(r.check_in_date) < new Date(checkOutDate)
              );
              return !hasOverlap;
            });
          }

          console.log('조회된 객실:', availableRooms);
          return availableRooms;
        } catch (error) {
          console.error('사용 가능한 객실 조회 실패:', error);
          throw new Error('사용 가능한 객실을 조회하는데 실패했습니다.');
        }
      },

      // 기타 필요한 메서드들...
    }),
    {
      name: 'reservation-storage'
    }
  )
);

export default useReservationStore;