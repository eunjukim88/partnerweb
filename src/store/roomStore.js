import { create } from 'zustand';
import { sql } from '@vercel/postgres';

const useRoomStore = create((set, get) => ({
  rooms: [],
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const { rows } = await sql`
        SELECT number 
        FROM rooms 
        ORDER BY number
      `;
      
      set({ 
        rooms: rows,
        isLoading: false, 
        error: null 
      });
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ 
        error: error.message, 
        isLoading: false 
      });
    }
  },

  getSortedRoomNumbers: () => {
    const { rooms } = get();
    if (!rooms.length) return [];
    
    return rooms
      .map(room => room.number)
      .sort((a, b) => parseInt(a) - parseInt(b));
  }
}));

export default useRoomStore;