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

  setCurrentPage: (page) => set({ currentPage: page }),
  setListSize: (size) => set({ listSize: size }),
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  setSearchType: (type) => set({ searchType: type, currentPage: 1 }),
  setStartDate: (date) => set({ check_in_date: date, currentPage: 1 }),
  setEndDate: (date) => set({ check_out_date: date, currentPage: 1 }),
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
        const value = reservation[state.searchType]?.toString().toLowerCase() || '';
        return value.includes(state.searchTerm.toLowerCase());
      });
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
      const response = await fetch('/api/reservations/reservations', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류');
      }

      const data = await response.json();
      set({ 
        reservations: data,
        filteredReservations: data,
        isLoading: false 
      });
      return data;
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false,
        reservations: [],
        filteredReservations: []
      });
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
}));

export default useReservationDisplayStore;