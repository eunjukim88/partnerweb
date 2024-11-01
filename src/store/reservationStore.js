import { create } from 'zustand';

const useReservationStore = create((set, get) => ({
  reservations: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  fetchReservations: async () => {
    const currentTime = new Date().getTime();
    const lastFetched = get().lastFetched;
    
    if (lastFetched && currentTime - lastFetched < 60000) {
      return;
    }

    set({ isLoading: true });
    try {
      const response = await fetch('/api/reservations');
      const data = await response.json();
      set({ 
        reservations: data.reservations || [],
        lastFetched: currentTime,
        isLoading: false 
      });
    } catch (error) {
      console.error('예약 데이터 로드 실패:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  getReservation: (id) => {
    const { reservations } = get();
    return reservations.find(r => r.id === id);
  },

  addReservation: async (reservationData) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      });
      const newReservation = await response.json();
      
      set(state => ({
        reservations: [newReservation, ...state.reservations],
        isLoading: false
      }));
      return newReservation;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateReservation: async (id, updateData) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      const updatedReservation = await response.json();
      
      set(state => ({
        reservations: state.reservations.map(r => 
          r.id === id ? updatedReservation : r
        ),
        isLoading: false
      }));
      return updatedReservation;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteReservation: async (id) => {
    set({ isLoading: true });
    try {
      await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
      set(state => ({
        reservations: state.reservations.filter(r => r.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  resetState: () => {
    set({
      reservations: [],
      isLoading: false,
      error: null,
      lastFetched: null
    });
  }
}));

export default useReservationStore;