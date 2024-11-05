import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { 
  STAY_TYPES,
  DEFAULT_RATES,
  DEFAULT_AVAILABLE_DAYS
} from '../constants/reservation';

const CACHE_DURATION = 10 * 60 * 1000;

const useReservationSettingsStore = create(
  persist(
    (set, get) => ({
      settings: {
        [STAY_TYPES.HOURLY]: null,
        [STAY_TYPES.NIGHTLY]: null,
        [STAY_TYPES.LONG_TERM]: null
      },
      isLoading: false,
      error: null,
      lastFetched: null,

      // 시간을 HH:mm:ss 형식에서 HH:mm 형식으로 변환하는 함수
      formatTimeToHHmm: (time) => {
        return time ? time.slice(0, 5) : '';  // 'HH:mm:ss' -> 'HH:mm'
      },

      toggleDay: (currentDays, dayIndex) => {
        const dayArray = currentDays.split('');
        dayArray[dayIndex] = dayArray[dayIndex] === '1' ? '0' : '1';
        return dayArray.join('');
      },

      fetchSettings: async (forceFetch = false) => {
        const now = Date.now();
        const lastFetched = get().lastFetched;
        const currentSettings = get().settings;

        // 캐시된 데이터가 있고 강제 새로고침이 아닌 경우
        if (!forceFetch && lastFetched && (now - lastFetched < CACHE_DURATION)) {
          return currentSettings;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/mypage/reservation-settings');
          console.log('Fetched settings:', response.data); // 디버깅

          const mappedSettings = {
            [STAY_TYPES.HOURLY]: null,
            [STAY_TYPES.NIGHTLY]: null,
            [STAY_TYPES.LONG_TERM]: null
          };

          response.data.forEach(setting => {
            const type = setting.stay_type;
            if (Object.values(STAY_TYPES).includes(type)) {
              mappedSettings[type] = {
                stay_type: type,
                // 서버 데이터 또는 기존 설정값 사용
                available_days: setting.available_days || 
                              (currentSettings[type]?.available_days) || 
                              DEFAULT_AVAILABLE_DAYS,
                check_in_time: get().formatTimeToHHmm(setting.check_in_time),
                check_out_time: get().formatTimeToHHmm(setting.check_out_time),
                weekday_rate: setting.weekday_rate || DEFAULT_RATES.WEEKDAY,
                friday_rate: setting.friday_rate || DEFAULT_RATES.FRIDAY,
                weekend_rate: setting.weekend_rate || DEFAULT_RATES.WEEKEND
              };
            }
          });

          console.log('Mapped settings:', mappedSettings); // 디버깅

          set({ 
            settings: mappedSettings, 
            isLoading: false,
            lastFetched: now 
          });

          return mappedSettings;
        } catch (error) {
          console.error('Settings fetch error:', error); // 디버깅
          set({ 
            error: {
              message: '설정을 불러오는데 실패했습니다.',
              action: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
              retryFn: () => get().fetchSettings(true)
            }, 
            isLoading: false 
          });
          return null;
        }
      },

      updateSettings: async (type, newSettings) => {
        set({ isLoading: true, error: null });
        try {
          console.log('Updating settings:', { type, newSettings }); // 디버깅

          const response = await axios.put('/api/mypage/reservation-settings', {
            stay_type: type,
            ...newSettings
          });

          if (response.data) {
            // 현재 상태 가져오기
            const currentSettings = get().settings;
            
            // 새로운 설정으로 상태 업데이트
            const updatedSettings = {
              ...currentSettings,
              [type]: {
                ...currentSettings[type],
                ...response.data
              }
            };

            console.log('Updated settings:', updatedSettings); // 디버깅

            set({ 
              settings: updatedSettings,
              isLoading: false,
              lastFetched: Date.now()
            });

            return response.data;
          }
        } catch (error) {
          console.error('Settings update error:', error); // 디버깅
          set({
            error: {
              message: '설정 업데이트에 실패했습니다.',
              action: '입력값을 확인하고 다시 시도해주세요.',
              retryFn: () => get().updateSettings(type, newSettings)
            },
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