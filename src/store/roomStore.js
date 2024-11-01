import { create } from 'zustand';
import axios from 'axios';

const useRoomStore = create((set, get) => ({
  rooms: [],
  isLoading: false,
  error: null,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const response = await axios.get('/api/rooms');
      console.log('Room API Response:', response.data);
      
      const roomsWithSettings = response.data.map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        building: room.building,
        name: room.name,
        type: room.type,
        status: room.status,
        show_floor: room.show_floor || false,
        show_building: room.show_building || false,
        show_name: room.show_name || false,
        show_type: room.show_type || false
      }));

      set({ 
        rooms: roomsWithSettings,
        isLoading: false, 
        error: null 
      });

      return roomsWithSettings;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      set({ error: error.message, isLoading: false });
      throw error;
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