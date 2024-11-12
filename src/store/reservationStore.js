import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useReservationSettingsStore from './reservationSettingsStore';
import useRoomStore from './roomStore';
import { reservationUtils } from '../utils/reservationUtils';

const useReservationStore = create(
  persist(
    (set, get) => ({
      // 상태 관리
      reservations: [],
      filteredReservations: [],
      totalFilteredReservations: [],
      isLoading: false,
      error: null,

      // UI 상태
      isModalOpen: false,
      selectedReservation: null,
      currentPage: 1,
      activeTab: 'list',     
      
      // 필터 상태
      searchTerm: '',
      searchType: 'reservation_number',
      startDate: new Date(new Date().setHours(0, 0, 0, 0)),
      endDate: new Date(new Date().setHours(23, 59, 59, 999)),
      bookingSource: 'all',
      stayType: 'all',
      timelineStartDate: new Date(),

      // UI 액션
      setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
      setSelectedReservation: (reservation) => set({ selectedReservation: reservation }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentPage: (page) => set({ currentPage: page }),
      setListSize: (size) => set({ listSize: size }),
      setTimelineStartDate: (date) => set({ timelineStartDate: date }),

      // 필터 액션
      setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
      setSearchType: (type) => set({ searchType: type, currentPage: 1 }),
      setStartDate: (date) => set({ startDate: date }),
      setEndDate: (date) => set({ endDate: date }),
      setBookingSource: (source) => set({ bookingSource: source, currentPage: 1 }),
      setStayType: (type) => set({ stayType: type, currentPage: 1 }),

      // 필터 초기화
      resetFilters: () => set({
        searchTerm: '',
        searchType: 'reservation_number',
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        bookingSource: 'all',
        stayType: 'all',
        currentPage: 1
      }),

      getCurrentReservation: (roomId) => {
        const { reservations } = get();
        const now = new Date();
        
        return reservations.find(reservation => {
          if (reservation.room_id !== roomId) return false;
          
          const checkInDate = new Date(reservation.check_in_date);
          const checkOutDate = new Date(reservation.check_out_date);
          const [inHours, inMinutes] = reservation.check_in_time.split(':');
          const [outHours, outMinutes] = reservation.check_out_time.split(':');
          
          const checkInDateTime = new Date(checkInDate);
          checkInDateTime.setHours(parseInt(inHours), parseInt(inMinutes), 0);
          
          const checkOutDateTime = new Date(checkOutDate);
          checkOutDateTime.setHours(parseInt(outHours), parseInt(outMinutes), 0);
          
          return now >= checkInDateTime && now <= checkOutDateTime;
        });
      },

      handleQuickDate: (days) => {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        const newEndDate = new Date(endDate);
        newEndDate.setDate(endDate.getDate() + days - 1);
        
        set({
          startDate,
          endDate: newEndDate,
          currentPage: 1
        });
        
        // 검색 실행
        get().handleSearch();
      },

      // 검색 로직
      handleSearch: () => {
        const state = get();
        if (!Array.isArray(state.reservations)) {
          set({ 
            filteredReservations: [],
            totalFilteredReservations: []
          });
          return;
        }
    
        let filtered = [...state.reservations];
        
        if (state.startDate && state.endDate) {
          filtered = filtered.filter(reservation => {
            const checkIn = new Date(reservation.check_in_date);
            const checkOut = new Date(reservation.check_out_date);
            return checkIn <= state.endDate && checkOut >= state.startDate;
          });
        }
    
        if (state.searchTerm) {
          filtered = filtered.filter(reservation => {
            switch (state.searchType) {
              case 'reservation_number':
                return reservation.reservation_number?.toString().toLowerCase()
                  .includes(state.searchTerm.toLowerCase());
              case 'guest_name':
                return reservation.guest_name?.toLowerCase()
                  .includes(state.searchTerm.toLowerCase());
              case 'phone':
                return reservation.phone?.toLowerCase()
                  .includes(state.searchTerm.toLowerCase());
              default:
                return false;
            }
          });
        }
    
        if (state.bookingSource !== 'all') {
          filtered = filtered.filter(reservation => 
            reservation.booking_source === state.bookingSource
          );
        }
    
        if (state.stayType !== 'all') {
          filtered = filtered.filter(reservation => 
            reservation.stay_type === state.stayType
          );
        }
    
        set({ 
          filteredReservations: filtered,
          totalFilteredReservations: filtered
        });
      },
    

      // API 관련 액션
      fetchReservations: async () => {
        const state = get();
        set({ isLoading: true, error: null });
        
        try {
          const response = await axios.get('/api/reservations/reservations', {
            params: {
              searchTerm: state.searchTerm,
              searchType: state.searchType,
              startDate: reservationUtils.formatDate(state.startDate),
              endDate: reservationUtils.formatDate(state.endDate)
            }
          });

          set({ 
            reservations: response.data,
            filteredReservations: response.data,
            isLoading: false 
          });
          
          return response.data;
        } catch (error) {
          set({ 
            error: reservationUtils.handleApiError(error), 
            isLoading: false 
          });
          throw error;
        }
      },

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

          console.log('금 계산 결과:', {
            객실ID: roomId,
            숙박유형: stayType,
            체크인날짜: checkInDate,
            요일: checkInDay,
            객실요금존재: !!rate_amount,
            최종요금: rate_amount
          });   

          return rate_amount;
        } catch (error) {
          console.error('요금 계산 실:', error);
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
        try {
          const response = await axios.post('/api/reservations/reservations', data);
          set(state => ({
            reservations: [...state.reservations, response.data]
          }));
          return response.data;
        } catch (error) {
          throw new Error(reservationUtils.handleApiError(error));
        }
      },

      // 예약 조회
      fetchReservations: async () => {
        set({ isLoading: true });
        try {
          const response = await axios.get('/api/reservations/reservations');
          const reservations = response.data;
          
          set({ 
            reservations,
            filteredReservations: reservations,
            isLoading: false 
          });
        } catch (error) {
          console.error('예약 조회 실패:', error);
          set({ 
            error: '예약 조회에 실패했습니다.',
            isLoading: false 
          });
        }
      },


      // 예약 가능한 객실 조회
      getAvailableRooms: (checkInDate, checkOutDate, stayType) => {
        const { reservations } = get();
        const rooms = useRoomStore.getState().rooms;
        
        return rooms.filter(room => {
          if (room.room_status === 'salesStopped') return false;
          
          const hasOverlap = reservationUtils.checkReservationOverlap(
            reservations,
            room.room_id,
            checkInDate,
            checkOutDate
          );
          
          return !hasOverlap;
        });
      },


      // 예약 업데이트
      updateReservation: async (reservationId, data) => {
        try {
          console.log('Update Request:', {
            reservationId,
            data
          });

          // PATCH 대신 PUT 사용하고, reservation_id를 body에 포함
          const response = await axios.put('/api/reservations/reservations', {
            ...data,
            reservation_id: reservationId
          });
          
          console.log('Update Response:', response.data);

          set(state => ({
            reservations: state.reservations.map(r => 
              r.reservation_id === reservationId ? response.data : r
            ),
            filteredReservations: state.filteredReservations.map(r => 
              r.reservation_id === reservationId ? response.data : r
            )
          }));
          
          return response.data;
        } catch (error) {
          console.error('Update Error:', error);
          throw new Error(reservationUtils.handleApiError(error));
        }
      },

      // 예약 삭제
      deleteReservation: async (reservationId) => {
        try {
          await axios.delete(`/api/reservations/reservations/${reservationId}`);
          set(state => ({
            reservations: state.reservations.filter(r => r.reservation_id !== reservationId)
          }));
        } catch (error) {
          throw new Error(reservationUtils.handleApiError(error));
        }
      },

      // 객실별 예약 상태 조회
      getRoomReservationStatus: (roomId) => {
        const room = useRoomStore.getState().rooms.find(r => r.room_id === roomId);
        if (room?.room_status && room.room_status !== 'vacant') {
          return room.room_status;
        }

        const currentReservation = get().getCurrentReservation(roomId);
        if (!currentReservation) return 'vacant';

        const stayTypeMap = {
          '대실': 'hourlyStay',
          '숙박': 'overnightStay',
          '장기': 'longStay'
        };

        return stayTypeMap[currentReservation.stay_type] || 'reservationComplete';
      },

      getRoomReservationTimes: (roomId) => {
        const currentReservation = get().getCurrentReservation(roomId);
        if (!currentReservation) return null;

        return {
          checkInTime: currentReservation.check_in_time,
          checkOutTime: currentReservation.check_out_time,
          checkInDate: currentReservation.check_in_date,
          checkOutDate: currentReservation.check_out_date
        };
      },

      getRoomsByStayType: (stayType) => {
        const state = get();
        const rooms = useRoomStore.getState().rooms;
        
        if (stayType === 'all') return rooms;

        return rooms.filter(room => {
          const status = state.getRoomReservationStatus(room.room_id);
          return status === stayType;
        });
      },

      getStayTypeCount: (stayType) => {
        if (stayType === 'all') return useRoomStore.getState().rooms.length;
        
        const rooms = useRoomStore.getState().rooms;
        return rooms.filter(room => {
          const status = get().getRoomReservationStatus(room.room_id);
          return status === stayType;
        }).length;
      },

      setFilteredReservations: (filtered) => set({ filteredReservations: filtered }),

      setSearchTerm: (term) => {
        const state = get();
        const value = term.toLowerCase();
        
        if (!value.trim()) {
          set({ 
            searchTerm: term,
            filteredReservations: state.reservations,
            currentPage: 1
          });
          return;
        }

        const filtered = state.reservations.filter(reservation => {
          switch (state.searchType) {
            case 'reservation_number':
              return reservation.reservation_number?.toLowerCase().includes(value);
            case 'guest_name':
              return reservation.guest_name?.toLowerCase().includes(value);
            case 'phone':
              return reservation.phone?.includes(value);
            default:
              return true;
          }
        });

        set({ 
          searchTerm: term,
          filteredReservations: filtered,
          currentPage: 1
        });
      },

      setSearchType: (type) => {
        const state = get();
        set({ 
          searchType: type,
          currentPage: 1
        });
        
        if (state.searchTerm) {
          state.setSearchTerm(state.searchTerm);
        }
      },

      validateReservation: async (data) => {
        try {
          const settingsStore = useReservationSettingsStore.getState();
          return reservationUtils.validateReservation(data, settingsStore.settings);
        } catch (error) {
          throw error;
        }
      },

      // dateUtils를 store의 상태로 추가
      dateUtils: {
        formatDate: reservationUtils.formatDate,
        getKSTDate: reservationUtils.getKSTDate,
        startOfDay: reservationUtils.startOfDay,
        endOfDay: reservationUtils.endOfDay,
        parseDate: reservationUtils.parseDate,
        startOfDayKST: reservationUtils.startOfDayKST,
        endOfDayKST: reservationUtils.endOfDayKST
      },
    }),
    {
      name: 'reservation-storage'
    }
  )
);

export default useReservationStore;
