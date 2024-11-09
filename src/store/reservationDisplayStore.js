import { create } from 'zustand';
import axios from 'axios';

const useReservationDisplayStore = create((set, get) => ({
  reservations: [],
  isLoading: false,
  error: null,

  filteredReservations: [],
  totalFilteredReservations: [],

  currentPage: 1,
  listSize: 10,

  searchTerm: '',
  searchType: 'reservation_number',
  check_in_date: new Date(new Date().setHours(0, 0, 0, 0)),
  check_out_date: new Date(new Date().setHours(23, 59, 59, 999)),
  bookingSource: 'all',
  stayType: 'all',

  isModalOpen: false,
  selectedReservation: null,

  startDate: new Date(new Date().setHours(0, 0, 0, 0)),
  endDate: new Date(new Date().setHours(23, 59, 59, 999)),

  activeTab: 'list',
  setActiveTab: (tab) => set({ activeTab: tab }),

  timelineStartDate: new Date(),
  setTimelineStartDate: (date) => set({ timelineStartDate: date }),

  setCurrentPage: (page) => set({ currentPage: page }),
  setListSize: (size) => set({ listSize: size }),
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  setSearchType: (type) => set({ searchType: type, currentPage: 1 }),
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setBookingSource: (source) => set({ bookingSource: source, currentPage: 1 }),
  setStayType: (type) => set({ stayType: type, currentPage: 1 }),
  setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
  setSelectedReservation: (reservation) => set({ selectedReservation: reservation }),

  resetFilters: () => set({
    searchTerm: '',
    searchType: 'reservationNumber',
    startDate: new Date(new Date().setHours(0, 0, 0, 0)),
    endDate: new Date(new Date().setHours(23, 59, 59, 999)),
    bookingSource: 'all',
    stayType: 'all',
    currentPage: 1
  }),

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

  // 예약 목록 조회
  fetchReservations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/reservations/reservations');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '서버 응답 오류');
      }

      const data = await response.json();
      // rooms 정보를 포함한 예약 데이터 처리
      const reservationsWithRoomInfo = data.map(reservation => ({
        ...reservation,
        room_info: {
          room_number: reservation.room_number,
          room_floor: reservation.room_floor,
          room_building: reservation.room_building,
          room_type: reservation.room_type
        }
      }));

      set({ 
        reservations: reservationsWithRoomInfo,
        filteredReservations: reservationsWithRoomInfo,
        isLoading: false 
      });
      return reservationsWithRoomInfo;
    } catch (error) {
      const errorMessage = handleApiError(error);
      set({ 
        error: errorMessage, 
        isLoading: false,
        reservations: [],
        filteredReservations: []
      });
      throw new Error(errorMessage);
    }
  },

  // 예약 삭제
  deleteReservation: async (reservation_id) => {
    set({ isLoading: true });
    try {
      const response = await axios.delete(`/api/reservations/reservations?reservation_id=${reservation_id}`);
      
      if (response.status === 200) {
        set(state => {
          const updatedReservations = state.reservations.filter(
            r => r.reservation_id !== reservation_id
          );
          return {
            reservations: updatedReservations,
            filteredReservations: updatedReservations.filter(/* 현재 필터 조건 적용 */),
            isLoading: false
          };
        });
        // 검색 결과 업데이트
        get().handleSearch();
      }
    } catch (error) {
      set({ 
        error: error.response?.data?.error || error.message, 
        isLoading: false 
      });
      throw error;
    }
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

  // 객실별 예약 상태 조회
  getRoomReservationStatus: (roomId) => {
    const state = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const currentReservation = state.filteredReservations.find(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      return reservation.room_id === roomId &&
             checkIn <= endOfDay &&
             checkOut >= today;
    });

    if (!currentReservation) return 'vacant';

    switch(currentReservation.stay_type) {
      case '대실': return 'hourlyStay';
      case '숙박': return 'overnightStay';
      case '장기': return 'longStay';
      default: return 'reservationComplete';
    }
  },

  // 객실별 예약 시간 조회
  getRoomReservationTimes: (roomId) => {
    const state = get();
    const status = state.getRoomReservationStatus(roomId);
    if (status === 'vacant') return null;

    const reservation = state.filteredReservations.find(r => r.room_id === roomId);
    if (!reservation) return null;

    return {
      checkInTime: reservation.check_in_time,
      checkOutTime: reservation.check_out_time
    };
  }
}));

export default useReservationDisplayStore;

// 공통 에러 처리 함수
const handleApiError = (error) => {
  const errorMessage = error.response?.data?.error || 
                      error.response?.data?.details || 
                      error.message || 
                      '알 수 없는 오류가 발생했습니다.';
  return errorMessage;
};