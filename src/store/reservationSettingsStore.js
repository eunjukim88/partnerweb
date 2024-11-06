import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const CACHE_DURATION = 10 * 60 * 1000;

// 기본 설정값 추가
const DEFAULT_SETTINGS = {
  대실: {
    stay_type: '대실',
    available_days: '1111111', // 모든 요일 가능
    check_in_time: '09:00',
    check_out_time: '21:00',
    weekday_rate: 0,
    friday_rate: 0,
    weekend_rate: 0
  },
  숙박: {
    stay_type: '숙박',
    available_days: '1111111',
    check_in_time: '15:00',
    check_out_time: '11:00',
    weekday_rate: 0,
    friday_rate: 0,
    weekend_rate: 0
  },
  장기: {
    stay_type: '장기',
    available_days: '1111111',
    check_in_time: '15:00',
    check_out_time: '11:00',
    weekday_rate: 0,
    friday_rate: 0,
    weekend_rate: 0
  }
};

const useReservationSettingsStore = create(
  persist(
    (set, get) => ({
      // 초기 상태를 기본값으로 설정
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchSettings: async (forceFetch = false) => {
        const now = Date.now();
        const lastFetched = get().lastFetched;
        
        if (!forceFetch && lastFetched && (now - lastFetched < CACHE_DURATION)) {
          return get().settings;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/mypage/reservation-settings');
          
          // 기존 기본값에 서버 데이터 병합
          const mappedSettings = { ...DEFAULT_SETTINGS };

          response.data.forEach(setting => {
            mappedSettings[setting.stay_type] = {
              ...DEFAULT_SETTINGS[setting.stay_type],
              ...setting,
              check_in_time: setting.check_in_time,
              check_out_time: setting.check_out_time,
              available_days: setting.available_days.padStart(7, '0')
            };
          });

          console.log('설정 로드 결과:', mappedSettings); // 디버깅용

          set({ 
            settings: mappedSettings, 
            isLoading: false,
            lastFetched: now 
          });

          return mappedSettings;
        } catch (error) {
          console.error('설정 로드 실패:', error);
          set({ 
            error: error.response?.data?.error || '설정을 불러오는데 실패했습니다.', 
            isLoading: false 
          });
          throw error;
        }
      },

      updateSettings: async (type, newSettings) => {
        set({ isLoading: true, error: null });
        try {
          const requestData = {
            stay_type: type,
            available_days: newSettings.available_days,
            check_in_time: newSettings.check_in_time,
            check_out_time: newSettings.check_out_time,
            weekday_rate: parseInt(newSettings.weekday_rate),
            friday_rate: parseInt(newSettings.friday_rate),
            weekend_rate: parseInt(newSettings.weekend_rate)
          };

          const response = await axios.put('/api/mypage/reservation-settings', requestData);
          
          set(state => ({
            settings: {
              ...state.settings,
              [type]: {
                ...DEFAULT_SETTINGS[type], // 기본값 유지
                ...response.data, // 서버 응답으로 덮어쓰기
                available_days: response.data.available_days.padStart(7, '0'),
                check_in_time: response.data.check_in_time.slice(0, 5),
                check_out_time: response.data.check_out_time.slice(0, 5)
              }
            },
            isLoading: false
          }));

          return response.data;
        } catch (error) {
          console.error('설정 업데이트 실패:', error);
          set({ 
            error: error.response?.data?.error || '설정 업데이트에 실패했습니다.', 
            isLoading: false 
          });
          throw error;
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'reservation-settings-storage',
      partialize: (state) => ({ 
        settings: state.settings,
        lastFetched: state.lastFetched 
      })
    }
  )
);

export default useReservationSettingsStore;