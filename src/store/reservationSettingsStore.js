import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { format, parse } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  STAY_TYPES,
  DEFAULT_TIMES,
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

      formatTimeToAmPm: (time) => {
        try {
          const parsed = parse(time, 'HH:mm', new Date());
          return format(parsed, 'a h:mm', { locale: ko });
        } catch {
          return time;
        }
      },

      toggleDay: (currentDays, dayIndex) => {
        const dayArray = currentDays.split('');
        dayArray[dayIndex] = dayArray[dayIndex] === '1' ? '0' : '1';
        return dayArray.join('');
      },

      fetchSettings: async (forceFetch = false) => {
        const now = Date.now();
        const lastFetched = get().lastFetched;
        
        if (!forceFetch && lastFetched && (now - lastFetched < CACHE_DURATION)) {
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await axios.get('/api/mypage/reservation-settings');
          
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
                available_days: setting.available_days || DEFAULT_AVAILABLE_DAYS,
                check_in_time: setting.check_in_time || DEFAULT_TIMES.CHECK_IN,
                check_out_time: setting.check_out_time || DEFAULT_TIMES.CHECK_OUT,
                weekday_rate: setting.weekday_rate || DEFAULT_RATES.WEEKDAY,
                friday_rate: setting.friday_rate || DEFAULT_RATES.FRIDAY,
                weekend_rate: setting.weekend_rate || DEFAULT_RATES.WEEKEND
              };
            }
          });

          set({ 
            settings: mappedSettings, 
            isLoading: false,
            lastFetched: now 
          });
        } catch (error) {
          set({ 
            error: {
              message: '설정을 불러오는데 실패했습니다.',
              action: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
              retryFn: () => get().fetchSettings(true)
            }, 
            isLoading: false 
          });
        }
      },

      updateSettings: async (type, newSettings) => {
        set({ isLoading: true, error: null });
        try {
          const currentSettings = get().settings[type];
          const changedFields = {};
          
          Object.keys(newSettings).forEach(key => {
            if (newSettings[key] !== currentSettings?.[key]) {
              if (key === 'check_in_time' || key === 'check_out_time') {
                changedFields[key] = newSettings[key];
              }
              else if (['weekday_rate', 'friday_rate', 'weekend_rate'].includes(key)) {
                changedFields[key] = parseInt(newSettings[key]);
              }
              else if (key === 'available_days') {
                changedFields[key] = newSettings[key];
              }
              else {
                changedFields[key] = newSettings[key];
              }
            }
          });

          if (Object.keys(changedFields).length === 0) {
            return currentSettings;
          }

          const response = await axios.put('/api/mypage/reservation-settings', {
            stay_type: type,
            ...changedFields
          });

          if (response.data) {
            const updatedSettings = { ...get().settings };
            updatedSettings[type] = {
              ...response.data,
              stay_type: type
            };
            
            set({ 
              settings: updatedSettings, 
              isLoading: false,
              lastFetched: Date.now()
            });
            
            return response.data;
          }
        } catch (error) {
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