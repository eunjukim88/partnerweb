import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useReservationSettingsStore from './reservationSettingsStore';
import useRoomStore from './roomStore';

const useReservationStore = create(
  persist(
    (set, get) => ({
      reservations: [],
      isLoading: false,
      error: null,


      // 요금 계산 함수
      calculateRate: (checkInDate, stayType, roomId) => {
        try {
          const room = useRoomStore.getState().rooms.find(r => r.room_id === roomId);
          const settings = useReservationSettingsStore.getState().settings;
          
          if (!room) {
            throw new Error('객실을 찾을 수 없습니다.');
          }

          const checkInDay = new Date(checkInDate).getDay();
          let rate_amount = 0;
          
          // 1. 먼저 객실별 요금 확인
          if (stayType === '대실') {
            if (checkInDay === 5) rate_amount = room.rate_hourly_friday;
            else if (checkInDay === 6 || checkInDay === 0) rate_amount = room.rate_hourly_weekend;
            else rate_amount = room.rate_hourly_weekday;
          } else {
            if (checkInDay === 5) rate_amount = room.rate_nightly_friday;
            else if (checkInDay === 6 || checkInDay === 0) rate_amount = room.rate_nightly_weekend;
            else rate_amount = room.rate_nightly_weekday;
          }

          // 2. 객실별 요금이 없으면(0이면) 기본 설정 요금 사용
          if (!rate_amount) {
            const stayTypeSettings = settings[stayType];
            if (!stayTypeSettings) {
              throw new Error('예약 설정을 찾을 수 없습니다.');
            }

            if (checkInDay === 5) rate_amount = stayTypeSettings.friday_rate;
            else if (checkInDay === 6 || checkInDay === 0) rate_amount = stayTypeSettings.weekend_rate;
            else rate_amount = stayTypeSettings.weekday_rate;
          }

          console.log('요금 계산 결과:', {
            객실ID: roomId,
            숙박유형: stayType,
            체크인날짜: checkInDate,
            요일: checkInDay,
            객실요금존재: !!rate_amount,
            최종요금: rate_amount
          });

          return rate_amount;
        } catch (error) {
          console.error('요금 계산 실패:', error);
          throw error;
        }
      },

      // 예약 가능 여부 확인
      validateReservation: async (data) => {
        try {
          const roomStore = useRoomStore.getState();
          const settingsStore = useReservationSettingsStore.getState();
          
          console.log('검증 데이터:', {
            rooms: roomStore.rooms,
            settings: settingsStore.settings,
            reservationData: data
          });

          // 1. 객실 존재 여부 확인
          const room = roomStore.rooms.find(r => r.room_id === data.room_id);
          if (!room) {
            throw new Error('객실을 찾을 수 없습니다.');
          }

          // 2. 예약 설정 확인
          const stayTypeSettings = settingsStore.settings[data.stay_type];
          if (!stayTypeSettings) {
            throw new Error('예약 설정을 찾을 수 없습니다.');
          }

          // 3. 날짜 가능 여부 확인
          const dayIndex = new Date(data.check_in_date).getDay();
          const availableDays = stayTypeSettings.available_days.split('');
          
          console.log('날짜 검증:', {
            dayIndex,
            availableDays,
            isAvailable: availableDays[dayIndex] === '1'
          });

          if (availableDays[dayIndex] === '0') {
            throw new Error('선택하신 날짜는 예약이 불가능합니다.');
          }

          // 4. ��실 예약 중복 확인
          const reservations = get().reservations;
          const hasOverlap = reservations.some(r => 
            r.room_id === data.room_id &&
            !(new Date(r.check_out_date) <= new Date(data.check_in_date) || 
              new Date(r.check_in_date) >= new Date(data.check_out_date))
          );

          console.log('중복 예약 검증:', {
            existingReservations: reservations,
            hasOverlap
          });

          if (hasOverlap) {
            throw new Error('해당 기간에 이미 예약이 존재합니다.');
          }

          return true;
        } catch (error) {
          console.error('예약 검증 실패:', error);
          throw error;
        }
      },

      // 예약번호 중복 체크 함수 추가
      validateReservationNumber: (data) => {
        const reservations = get().reservations;
        const isDuplicate = reservations.some(r => 
          r.reservation_number === data.reservation_number &&
          r.check_in_date === data.check_in_date &&
          r.guest_name === data.guest_name
        );

        if (isDuplicate) {
          throw new Error('동일한 날짜에 같은 예약자의 동일 예약번호가 이미 존재합니다.');
        }

        return true;
      },

      // 예약 생성
      createReservation: async (data) => {
        set({ isLoading: true });
        try {
          // 예약번호 중복 체크 추가
          get().validateReservationNumber(data);
          await get().validateReservation(data);
          
          // 숙박 유형별 설정 가져오기
          const settings = useReservationSettingsStore.getState().settings;
          const stayTypeSettings = settings[data.stay_type];
          
          // rate_amount를 숫자로 변환
          let finalRate;
          if (data.custom_rate) {
            finalRate = parseInt(data.rate_amount) || 0;
          } else {
            finalRate = get().calculateRate(data.check_in_date, data.stay_type, data.room_id);
          }

          const requestData = {
            ...data,
            check_in_time: stayTypeSettings.check_in_time,
            check_out_time: stayTypeSettings.check_out_time,
            rate_amount: finalRate
          };

          console.log('예약 요청 데이터:', requestData);

          const response = await axios.post('/api/reservations/reservations', requestData);
          
          set(state => ({
            reservations: [...state.reservations, response.data],
            isLoading: false
          }));

          return response.data;
        } catch (error) {
          console.error('예약 생성 실패:', error);
          set({ isLoading: false, error: error.response?.data?.error || error.message });
          throw error;
        }
      },

      // 예약 조회
      fetchReservations: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/reservations/reservations');
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
          const settings = useReservationSettingsStore.getState().settings;
          const reservations = get().reservations;

          console.log('객실 조회 시작:', {
            totalRooms: rooms.length,
            settings,
            stayType,
            checkInDate,
            checkOutDate
          });

          // 1. 예약 설정 확인
          const stayTypeSettings = settings[stayType];
          if (!stayTypeSettings) {
            throw new Error('예약 설정을 찾을 수 없습니다.');
          }

          // 2. 요일 체크
          const dayIndex = new Date(checkInDate).getDay();
          const availableDays = stayTypeSettings.available_days.split('');
          
          if (availableDays[dayIndex] === '0') {
            throw new Error('선택하신 날짜는 예약이 불가능합니다.');
          }

          // 3. 사용 가능한 객실 필터링
          let availableRooms = rooms.filter(room => {
            const hasOverlap = reservations.some(r => 
              r.room_id === room.room_id &&
              new Date(r.check_out_date) > new Date(checkInDate) &&
              new Date(r.check_in_date) < new Date(checkOutDate)
            );
            return !hasOverlap;
          });

          console.log('조회된 객실:', {
            availableRooms,
            count: availableRooms.length
          });

          return availableRooms;
        } catch (error) {
          console.error('사용 가능한 객실 조회 실패:', error);
          throw error;
        }
      },

      // 예약 업데이트
      updateReservation: async (reservation_id, data) => {
        set({ isLoading: true });
        try {
          const response = await axios.put('/api/reservations/reservations', {
            reservation_id,
            ...data
          });
          set(state => ({
            reservations: state.reservations.map(r => 
              r.reservation_id === reservation_id ? response.data : r
            ),
            isLoading: false
          }));
          return response.data;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      // 예약 삭제
      deleteReservation: async (reservation_id) => {
        set({ isLoading: true });
        try {
          await axios.delete(`/api/reservations/reservations?reservation_id=${reservation_id}`);
          set(state => ({
            reservations: state.reservations.filter(r => r.reservation_id !== reservation_id),
            isLoading: false
          }));
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
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