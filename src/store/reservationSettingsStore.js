import { create } from 'zustand';
import axios from 'axios';

/**
 * 숙박 타입 매핑
 * 프론트엔드 <-> 백엔드 데이터 변환
 */
export const stayTypeMap = {
  '대실': 'hourly',
  '숙박': 'nightly',
  '장기': 'longTerm'
};

export const reverseStayTypeMap = {
  hourly: '대실',
  nightly: '숙박',
  longTerm: '장기'
};

const useReservationSettingsStore = create((set, get) => ({
  // 상태
  settings: {
    hourly: null,
    nightly: null,
    longTerm: null
  },
  isLoading: false,
  error: null,

  // 설정 조회
  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/api/mypage/reservation-settings');
      
      // 응답 데이터 매핑
      const mappedSettings = {
        hourly: null,
        nightly: null,
        longTerm: null
      };

      response.data.forEach(setting => {
        const type = stayTypeMap[setting.stay_type];
        if (type) {
          mappedSettings[type] = {
            id: setting.id,
            stay_type: setting.stay_type,
            default_duration: setting.default_duration || 127, // 기본값: 모든 요일 선택
            check_in_time: setting.check_in_time || '15:00',
            check_out_time: setting.check_out_time || '11:00',
            weekday_rate: setting.weekday_rate || 0,
            friday_rate: setting.friday_rate || 0,
            weekend_rate: setting.weekend_rate || 0
          };
        }
      });

      set({ settings: mappedSettings, isLoading: false });
    } catch (error) {
      console.error('설정 로드 실패:', error);
      set({ error: '설정을 불러오는데 실패했습니다.', isLoading: false });
    }
  },

  // 설정 업데이트
  updateSettings: async (type, newSettings) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put('/api/mypage/reservation-settings', {
        id: newSettings.id,
        stay_type: type,
        default_duration: newSettings.default_duration,
        check_in_time: newSettings.check_in_time,
        check_out_time: newSettings.check_out_time,
        weekday_rate: newSettings.weekday_rate,
        friday_rate: newSettings.friday_rate,
        weekend_rate: newSettings.weekend_rate
      });

      if (response.data) {
        const mappedType = stayTypeMap[type];
        const currentSettings = { ...get().settings };
        currentSettings[mappedType] = {
          ...response.data,
          stay_type: type
        };
        set({ settings: currentSettings, isLoading: false });
      }
    } catch (error) {
      console.error('설정 업데이트 실패:', error);
      set({ error: '설정 업데이트에 실패했습니다.', isLoading: false });
      throw error;
    }
  }
}));

export default useReservationSettingsStore;