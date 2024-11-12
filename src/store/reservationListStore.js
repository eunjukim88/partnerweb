import { create } from 'zustand';
import axios from 'axios';

const dateUtils = {
  formatDate: (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

const useReservationListStore = create((set, get) => ({
  // 상태
  reservations: [],
  filteredReservations: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  listSize: 10,
  
  // 필터 상태
  searchTerm: '',
  searchType: 'reservation_number',
  startDate: new Date(),
  endDate: new Date(),
  
  // 액션
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
  setSearchType: (type) => set({ searchType: type, currentPage: 1 }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setListSize: (size) => set({ listSize: size }),
  
  // 예약 목록 조회
  fetchReservations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { startDate, endDate } = get();
      const params = {};
      
      if (startDate && endDate) {
        params.startDate = dateUtils.formatDate(startDate);
        params.endDate = dateUtils.formatDate(endDate);
      }
      
      const response = await axios.get('/api/reservations/reservations', { params });
      console.log('조회된 예약:', response.data);
      
      set({ 
        reservations: response.data,
        filteredReservations: response.data,
        isLoading: false 
      });
    } catch (error) {
      console.error('예약 조회 실패:', error);
      set({ 
        error: error.response?.data?.message || '예약 조회 실패',
        isLoading: false,
        reservations: [],
        filteredReservations: []
      });
    }
  },
  
  // 검색 필터 적용
  applyFilters: () => {
    const { reservations, searchTerm, searchType } = get();
    
    if (!searchTerm) {
      set({ filteredReservations: reservations });
      return;
    }
    
    const filtered = reservations.filter(reservation => {
      const searchValue = String(reservation[searchType] || '').toLowerCase();
      return searchValue.includes(searchTerm.toLowerCase());
    });
    
    set({ 
      filteredReservations: filtered,
      currentPage: 1
    });
  },
  
  // 필터 초기화
  resetFilters: () => {
    const today = new Date();
    set({
      searchTerm: '',
      searchType: 'reservation_number',
      startDate: today,
      endDate: today,
      currentPage: 1
    });
  }
}));

export default useReservationListStore; 