import { create } from 'zustand';
import axios from 'axios';

const useReservationStore = create((set, get) => ({
  reservations: [],
  isLoading: false,
  error: null,

  fetchReservations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/reservations');
      console.log('Reservation API Response:', response.data);
      
      if (!response.data) {
        throw new Error('데이터가 없습니다.');
      }

      const formattedReservations = response.data.map(reservation => ({
        ...reservation,
        check_in: new Date(reservation.check_in),
        check_out: new Date(reservation.check_out)
      }));

      set({ 
        reservations: formattedReservations,
        isLoading: false 
      });

      return formattedReservations;
    } catch (error) {
      console.error('Error fetching reservations:', error);
      set({ 
        error: '예약 데이터를 불러오는데 실패했습니다.',
        isLoading: false,
        reservations: [] 
      });
      throw error;
    }
  },

  getReservation: (id) => {
    const { reservations } = get();
    return reservations.find(r => r.id === id);
  },

  addReservation: async (reservationData) => {
    set({ isLoading: true });
    try {
      const response = await axios.post('/api/reservations', reservationData);
      const newReservation = response.data;
      
      set(state => ({
        reservations: [
          {
            ...newReservation,
            check_in: new Date(newReservation.check_in),
            check_out: new Date(newReservation.check_out)
          }, 
          ...state.reservations
        ],
        isLoading: false
      }));
      return newReservation;
    } catch (error) {
      console.error('Error adding reservation:', error);
      set({ error: '예약 추가에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  updateReservation: async (id, updateData) => {
    set({ isLoading: true });
    try {
      const response = await axios.put(`/api/reservations/${id}`, updateData);
      const updatedReservation = response.data;
      
      set(state => ({
        reservations: state.reservations.map(r => 
          r.id === id ? {
            ...updatedReservation,
            check_in: new Date(updatedReservation.check_in),
            check_out: new Date(updatedReservation.check_out)
          } : r
        ),
        isLoading: false
      }));
      return updatedReservation;
    } catch (error) {
      console.error('Error updating reservation:', error);
      set({ error: '예약 수정에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  deleteReservation: async (id) => {
    set({ isLoading: true });
    try {
      await axios.delete(`/api/reservations/${id}`);
      set(state => ({
        reservations: state.reservations.filter(r => r.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('Error deleting reservation:', error);
      set({ error: '예약 삭제에 실패했습니다.', isLoading: false });
      throw error;
    }
  },

  resetState: () => {
    set({
      reservations: [],
      isLoading: false,
      error: null
    });
  }
}));

export default useReservationStore;