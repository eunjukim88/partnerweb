import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const useRoomStore = create(persist(
  (set, get) => ({
    rooms: [],
    isLoading: false,
    error: null,

    // 방 정보를 가져오는 함수
    fetchRooms: async () => {
      set({ isLoading: true, error: null });
      try {
        const response = await axios.get('/api/mypage/rooms');
        console.log('Raw API Response:', response.data); // 디버깅

        const mappedRooms = response.data.map(room => {
          // room_id가 유효한지 확인
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
            show_floor: Boolean(room.show_floor),
            show_building: Boolean(room.show_building),
            show_name: Boolean(room.show_name),
            show_type: Boolean(room.show_type),
            hourly: Boolean(room.hourly),
            nightly: Boolean(room.nightly),
            long_term: Boolean(room.long_term),
            rate_hourly_weekday: parseInt(room.rate_hourly_weekday) || 0,
            rate_hourly_friday: parseInt(room.rate_hourly_friday) || 0,
            rate_hourly_weekend: parseInt(room.rate_hourly_weekend) || 0,
            rate_nightly_weekday: parseInt(room.rate_nightly_weekday) || 0,
            rate_nightly_friday: parseInt(room.rate_nightly_friday) || 0,
            rate_nightly_weekend: parseInt(room.rate_nightly_weekend) || 0
          };
        }).filter(room => room !== null); // 유효하지 않은 데이터 필터링

        console.log('Mapped rooms:', mappedRooms); // 디버깅
        set({ rooms: mappedRooms, isLoading: false, error: null });
      } catch (error) {
        console.error('객실 조회 실패:', error);
        set({ error: error.response?.data?.error || '객실 조회에 실패했습니다.', isLoading: false });
      }
    },

    // 방과 요금을 업데이트하는 함수
    updateRoom: async (room_id, updatedData) => {
      set({ isLoading: true, error: null });
      try {
        console.log('=== updateRoom 시작 ===');
        
        const requestData = {
          room_id,
          ...updatedData.roomData,
          rates: updatedData.ratesData
        };

        console.log('Request Data:', requestData);

        const response = await axios.put('/api/mypage/rooms', requestData);
        
        if (response.data) {
          // 서버에서 받은 새로운 데이터로 상태 업데이트
          const updatedRooms = get().rooms.map((room) =>
            room.room_id === room_id ? response.data : room
          );
          set({ rooms: updatedRooms, isLoading: false });
          
          // 캐시된 데이터 갱신을 위해 rooms 다시 조회
          await get().fetchRooms();
          
          return response.data;
        }
      } catch (error) {
        console.error('=== 에러 상세 ===');
        console.error('Error:', error);
        console.error('Response:', error.response);
        const errorMessage = error.response?.data?.error || '객실 수정에 실패했습니다.';
        set({ error: errorMessage, isLoading: false });
        throw error;
      }
    },

    clearError: () => set({ error: null }),
  }),
  {
    name: 'room-storage', // 저장소 이름 지정
    getStorage: () => (typeof window !== "undefined" ? localStorage : null), // SSR 문제 해결
  }
));

export default useRoomStore;
