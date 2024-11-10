import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useRoomStore = create(persist(
  (set, get) => ({
    rooms: [],
    isLoading: false,
    error: null,
    roomStatuses: {},

    updateRoomStatus: (roomId, status) => {
      set(state => ({
        roomStatuses: {
          ...state.roomStatuses,
          [roomId]: {
            ...state.roomStatuses[roomId],
            status: status || 'vacant',
            mainCard: status === 'vacant' ? Math.random() > 0.5 : state.roomStatuses[roomId]?.mainCard,
            subCard: status === 'vacant' ? Math.random() > 0.5 : state.roomStatuses[roomId]?.subCard,
            lastUpdated: new Date().toISOString()
          }
        }
      }));
    },

    updateCardStatus: (roomId, mainCard, subCard) => {
      set(state => ({
        roomStatuses: {
          ...state.roomStatuses,
          [roomId]: {
            ...state.roomStatuses[roomId],
            mainCard,
            subCard,
            lastUpdated: new Date().toISOString()
          }
        }
      }));
    },

    fetchRooms: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get('/api/mypage/rooms');
        if (!response.data) {
          throw new Error('데이터가 없습니다');
        }
        
        const sortedRooms = response.data.sort((a, b) => {
          const aNum = parseInt(a.room_number);
          const bNum = parseInt(b.room_number);
          return isNaN(aNum) || isNaN(bNum) ? 0 : aNum - bNum;
        });

        const initialStatuses = {};
        sortedRooms.forEach(room => {
          initialStatuses[room.room_id] = {
            status: room.room_status || 'vacant',
            mainCard: Math.random() > 0.5,
            subCard: Math.random() > 0.5,
            lastUpdated: new Date().toISOString()
          };
        });

        set({ 
          rooms: sortedRooms,
          roomStatuses: initialStatuses,
          isLoading: false 
        });
      } catch (error) {
        console.error('객실 조회 실패:', error);
        set({ 
          error: error.response?.data?.details || error.message,
          isLoading: false,
          rooms: [] 
        });
      }
    },

    updateRoom: async (room_id, updatedData) => {
      set({ isLoading: true, error: null });
      try {
        const currentRoom = get().rooms.find(r => r.room_id === parseInt(room_id));
        
        if (!currentRoom) {
          throw new Error('객실을 찾을 수 없습니다.');
        }

        const roomData = {
          room_floor: updatedData.room_floor,
          room_building: updatedData.room_building,
          room_name: updatedData.room_name,
          room_type: updatedData.room_type,
          room_status: updatedData.room_status,
          stay_type: updatedData.stay_type || null,
          show_floor: updatedData.show_floor,
          show_building: updatedData.show_building,
          show_name: updatedData.show_name,
          show_type: updatedData.show_type,
          memo: updatedData.memo
        };

        const response = await axios.put('/api/mypage/rooms', {
          room_id: parseInt(room_id),
          roomData
        });

        if (!response.data || !response.data.room_id) {
          throw new Error('서버 응답 데이터가 올바르지 않습니다.');
        }

        set(state => ({
          rooms: state.rooms.map(room => 
            room.room_id === parseInt(room_id) ? response.data : room
          )
        }));

        return response.data;
      } catch (error) {
        console.error('객실 수정 실패:', error);
        set({ 
          error: error.response?.data?.error || error.message, 
          isLoading: false 
        });
        throw error;
      }
    },

    clearError: () => set({ error: null }),

    getRoomStatus: (roomId) => {
      const state = get();
      return state.roomStatuses[roomId] || {
        status: 'vacant',
        mainCard: true,
        subCard: true,
        lastUpdated: new Date().toISOString()
      };
    }
  }),
  {
    name: 'room-storage',
    getStorage: () => (typeof window !== "undefined" ? localStorage : null),
  }
));

export default useRoomStore;
