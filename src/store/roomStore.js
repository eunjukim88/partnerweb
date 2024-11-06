import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useRoomStore = create(persist(
  (set, get) => ({
    rooms: [],
    isLoading: false,
    error: null,

    fetchRooms: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get('/api/mypage/rooms');
        console.log('Raw API Response:', response.data);

        const mappedRooms = response.data.map(room => {
          const parsedRoomId = parseInt(room.room_id);
          if (isNaN(parsedRoomId)) {
            console.error('Invalid room_id in response:', room);
            return null;
          }

          return {
            room_id: parsedRoomId,
            room_number: room.room_number?.toString() || '',
            room_floor: room.room_floor || '',
            room_building: room.room_building || '',
            room_name: room.room_name || '',
            room_type: room.room_type || '',
            stay_type: room.stay_type || null,
            room_status: room.room_status || null,
            show_floor: Boolean(room.show_floor),
            show_building: Boolean(room.show_building),
            show_name: Boolean(room.show_name),
            show_type: Boolean(room.show_type),
            memo: room.memo || '',
            rate_hourly_weekday: parseInt(room.rate_hourly_weekday) || 0,
            rate_hourly_friday: parseInt(room.rate_hourly_friday) || 0,
            rate_hourly_weekend: parseInt(room.rate_hourly_weekend) || 0,
            rate_nightly_weekday: parseInt(room.rate_nightly_weekday) || 0,
            rate_nightly_friday: parseInt(room.rate_nightly_friday) || 0,
            rate_nightly_weekend: parseInt(room.rate_nightly_weekend) || 0
          };
        }).filter(room => room !== null);

        set({ rooms: mappedRooms, isLoading: false, error: null });
      } catch (error) {
        console.error('객실 조회 실패:', error);
        set({ error: error.response?.data?.error || '객실 조회에 실패했습니다.', isLoading: false });
      }
    },

    updateRoom: async (room_id, updatedData) => {
      set({ isLoading: true, error: null });
      try {
        const requestData = {
          room_id,
          room_floor: updatedData.roomData.room_floor,
          room_building: updatedData.roomData.room_building,
          room_name: updatedData.roomData.room_name,
          room_type: updatedData.roomData.room_type,
          show_floor: updatedData.roomData.show_floor,
          show_building: updatedData.roomData.show_building,
          show_name: updatedData.roomData.show_name,
          show_type: updatedData.roomData.show_type,
          ...updatedData.ratesData
        };

        const response = await axios.put('/api/mypage/rooms', requestData);
        
        if (response.data) {
          set(state => ({
            rooms: state.rooms.map(room =>
              room.room_id === room_id ? { ...room, ...response.data } : room
            ),
            isLoading: false,
            error: null
          }));
          return response.data;
        }
      } catch (error) {
        console.error('객실 수정 실패:', error);
        const errorMessage = error.response?.data?.error || '객실 수정에 실패했습니다.';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    clearError: () => set({ error: null })
  }),
  {
    name: 'room-storage',
    getStorage: () => (typeof window !== "undefined" ? localStorage : null),
  }
));

export default useRoomStore;
