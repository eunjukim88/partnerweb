import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import useReservationSettingsStore from './reservationSettingsStore';
import useRoomStore from './roomStore';

// 날짜 처리 유틸리티 함수 개선
const dateUtils = {
  startOfDay: (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  },
  
  endOfDay: (date) => {
    if (!date) return null;
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  },

  formatDate: (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    
    // 날짜를 YYYY-MM-DD 형식으로 변환하되, 시간대 영향을 받지 않도록 처리
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  parseDate: (dateString) => {
    if (!dateString) return null;
    if (dateString instanceof Date) return dateString;
    
    // YYYY-MM-DD 형식의 문자열을 Date 객체로 변환
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date;
  },

  // 한국 시간으로 변환하는 함수
  getKSTDate: (date = new Date()) => {
    const kstOffset = 9 * 60; // 한국은 UTC+9
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    return new Date(utc + (kstOffset * 60000));
  },

  // 한국 시간 기준으로 시작 시간 설정
  startOfDayKST: (date) => {
    if (!date) return null;
    const kstDate = dateUtils.getKSTDate(new Date(date));
    kstDate.setHours(0, 0, 0, 0);
    return kstDate;
  },

  // 한국 시간 기준으로 종료 시간 설정
  endOfDayKST: (date) => {
    if (!date) return null;
    const kstDate = dateUtils.getKSTDate(new Date(date));
    kstDate.setHours(23, 59, 59, 999);
    return kstDate;
  }
};

// 예약 검증 관련 유틸리티 개선
const reservationUtils = {
  validateDates: (checkIn, checkOut, stayTypeSettings) => {
    const dayIndex = new Date(checkIn).getDay();
    const availableDays = stayTypeSettings.available_days.split('');
    
    if (availableDays[dayIndex] === '0') {
      throw new Error('선택하신 날짜는 예약이 불가능합다.');
    }
    return true;
  },

  checkOverlap: (reservations, roomId, checkIn, checkOut, excludeReservationId = null) => {
    return reservations.some(r => 
      r.room_id === roomId &&
      r.reservation_id !== excludeReservationId &&
      new Date(r.check_out_date) > new Date(checkIn) &&
      new Date(r.check_in_date) < new Date(checkOut)
    );
  },

  // 시간을 분으로 변환하는 유틸리티
  timeToMinutes: (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  },

  // 청소 및 준비 시간 (분 단위)
  CLEANING_BUFFER: 60,

  // 예약 시간 중복 검사 (시간까지 고려)
  checkTimeOverlap: (newReservation, existingReservation, settings) => {
    const newCheckIn = new Date(newReservation.check_in_date);
    const newCheckOut = new Date(newReservation.check_out_date);
    const existingCheckIn = new Date(existingReservation.check_in_date);
    const existingCheckOut = new Date(existingReservation.check_out_date);

    // 체크인/아웃 시간 설정
    const newSettings = settings[newReservation.stay_type];
    const existingSettings = settings[existingReservation.stay_type];
    
    const newInMinutes = reservationUtils.timeToMinutes(newReservation.check_in_time || newSettings.check_in_time);
    const newOutMinutes = reservationUtils.timeToMinutes(newReservation.check_out_time || newSettings.check_out_time);
    const existingInMinutes = reservationUtils.timeToMinutes(existingReservation.check_in_time);
    const existingOutMinutes = reservationUtils.timeToMinutes(existingReservation.check_out_time);

    newCheckIn.setHours(Math.floor(newInMinutes / 60), newInMinutes % 60);
    newCheckOut.setHours(Math.floor(newOutMinutes / 60), newOutMinutes % 60);
    existingCheckIn.setHours(Math.floor(existingInMinutes / 60), existingInMinutes % 60);
    existingCheckOut.setHours(Math.floor(existingOutMinutes / 60), existingOutMinutes % 60);

    // 대실과 숙박/장기 예약 간의 시간 비교
    if (newReservation.stay_type === '대실' && existingReservation.stay_type === '대실') {
      // 대실끼리는 같은 날짜에 시간이 겹치면 안됨
      return newCheckOut > existingCheckIn && newCheckIn < existingCheckOut;
    } else if (newReservation.stay_type === '대실' && 
              (existingReservation.stay_type === '숙박' || existingReservation.stay_type === '장기')) {
      // 대실은 숙박/장기의 체크인 시간 이전에 완료되어야 함
      return newCheckOut.getTime() + (reservationUtils.CLEANING_BUFFER * 60000) > existingCheckIn.getTime();
    } else if ((newReservation.stay_type === '숙박' || newReservation.stay_type === '장기') && 
              existingReservation.stay_type === '대실') {
      // 숙박/장기는 대실의 체크아웃 시간 이후에 시작되어야 함
      return newCheckIn.getTime() < existingCheckOut.getTime() + (reservationUtils.CLEANING_BUFFER * 60000);
    } else {
      // 숙박/장기끼리는 날짜가 겹치면 안됨
      return newCheckOut > existingCheckIn && newCheckIn < existingCheckOut;
    }
  },

  // 예약 가능 여부 확인 함수 추가
  isReservationPossible: (newReservation, existingReservation, settings) => {
    // 다른 날짜면 무조건 가능
    if (newReservation.check_in_date !== existingReservation.check_in_date) {
      return true;
    }

    const newCheckIn = new Date(newReservation.check_in_date);
    const existingCheckIn = new Date(existingReservation.check_in_date);
    
    const newSettings = settings[newReservation.stay_type];
    const existingSettings = settings[existingReservation.stay_type];
    
    const newInTime = reservationUtils.timeToMinutes(newReservation.check_in_time || newSettings.check_in_time);
    const newOutTime = reservationUtils.timeToMinutes(newReservation.check_out_time || newSettings.check_out_time);
    const existingInTime = reservationUtils.timeToMinutes(existingReservation.check_in_time);
    const existingOutTime = reservationUtils.timeToMinutes(existingReservation.check_out_time);

    // 대실과 숙박/장기의 시간이 겹치지 않으면 예약 가능
    if (newReservation.stay_type === '대실' && 
        (existingReservation.stay_type === '숙박' || existingReservation.stay_type === '장기')) {
      return newOutTime + reservationUtils.CLEANING_BUFFER <= existingInTime;
    }
    
    if ((newReservation.stay_type === '숙박' || newReservation.stay_type === '장기') && 
        existingReservation.stay_type === '대실') {
      return existingOutTime + reservationUtils.CLEANING_BUFFER <= newInTime;
    }

    return false;
  }
};


const useReservationStore = create(
  persist(
    (set, get) => {
      // 공통으로 사용되는 유틸리티 함수
      const getCurrentReservationForRoom = (roomId, date = new Date()) => {
        const state = get();
        const currentTime = dateUtils.getKSTDate(date);
        
        return state.reservations.find(reservation => {
          const checkIn = dateUtils.startOfDayKST(reservation.check_in_date);
          const checkOut = dateUtils.endOfDayKST(reservation.check_out_date);
          
          return reservation.room_id === roomId &&
                 checkIn <= currentTime &&
                 checkOut >= currentTime;
        });
      };

      return {
        // 상태 관리
        reservations: [],
        filteredReservations: [],
        totalFilteredReservations: [],
        isLoading: false,
        error: null,

        // UI 상태
        isModalOpen: false,
        selectedReservation: null,
        currentPage: 1,
        activeTab: 'list',     
        
        // 필터 상태
        searchTerm: '',
        searchType: 'reservation_number',
        startDate: new Date(new Date().setHours(0, 0, 0, 0)),
        endDate: new Date(new Date().setHours(23, 59, 59, 999)),
        bookingSource: 'all',
        stayType: 'all',
        timelineStartDate: new Date(),

        // UI 액션
        setModalOpen: (isOpen) => set({ isModalOpen: isOpen }),
        setSelectedReservation: (reservation) => set({ selectedReservation: reservation }),
        setActiveTab: (tab) => set({ activeTab: tab }),
        setCurrentPage: (page) => set({ currentPage: page }),
        setListSize: (size) => set({ listSize: size }),
        setTimelineStartDate: (date) => set({ timelineStartDate: date }),

        // 필터 액션
        setSearchTerm: (term) => set({ searchTerm: term, currentPage: 1 }),
        setSearchType: (type) => set({ searchType: type, currentPage: 1 }),
        setStartDate: (date) => set({ startDate: date }),
        setEndDate: (date) => set({ endDate: date }),
        setBookingSource: (source) => set({ bookingSource: source, currentPage: 1 }),
        setStayType: (type) => set({ stayType: type, currentPage: 1 }),

        // 필터 초기화
        resetFilters: () => set({
          searchTerm: '',
          searchType: 'reservation_number',
          startDate: new Date(new Date().setHours(0, 0, 0, 0)),
          endDate: new Date(new Date().setHours(23, 59, 59, 999)),
          bookingSource: 'all',
          stayType: 'all',
          currentPage: 1
        }),

        handleQuickDate: (days) => {
          const endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          
          const newEndDate = new Date(endDate);
          newEndDate.setDate(endDate.getDate() + days - 1);
          
          set({
            startDate,
            endDate: newEndDate,
            currentPage: 1
          });
          
          // 검색 실행
          get().handleSearch();
        },

        // 검색 로직
        handleSearch: () => {
          const state = get();
          if (!Array.isArray(state.reservations)) {
            set({ 
              filteredReservations: [],
              totalFilteredReservations: []
            });
            return;
          }
      
          let filtered = [...state.reservations];
          
          if (state.startDate && state.endDate) {
            filtered = filtered.filter(reservation => {
              const checkIn = new Date(reservation.check_in_date);
              const checkOut = new Date(reservation.check_out_date);
              return checkIn <= state.endDate && checkOut >= state.startDate;
            });
          }
      
          if (state.searchTerm) {
            filtered = filtered.filter(reservation => {
              switch (state.searchType) {
                case 'reservation_number':
                  return reservation.reservation_number?.toString().toLowerCase()
                    .includes(state.searchTerm.toLowerCase());
                case 'guest_name':
                  return reservation.guest_name?.toLowerCase()
                    .includes(state.searchTerm.toLowerCase());
                case 'phone':
                  return reservation.phone?.toLowerCase()
                    .includes(state.searchTerm.toLowerCase());
                default:
                  return false;
              }
            });
          }
      
          if (state.bookingSource !== 'all') {
            filtered = filtered.filter(reservation => 
              reservation.booking_source === state.bookingSource
            );
          }
      
          if (state.stayType !== 'all') {
            filtered = filtered.filter(reservation => 
              reservation.stay_type === state.stayType
            );
          }
      
          set({ 
            filteredReservations: filtered,
            totalFilteredReservations: filtered
          });
        },
      

        // API 관련 액션
        fetchReservations: async () => {
          const state = get();
          set({ isLoading: true, error: null });
          
          try {
            const response = await axios.get('/api/reservations/reservations', {
              params: {
                searchTerm: state.searchTerm,
                searchType: state.searchType,
                startDate: dateUtils.formatDate(state.startDate),
                endDate: dateUtils.formatDate(state.endDate)
              }
            });

            set({ 
              reservations: response.data,
              filteredReservations: response.data,
              isLoading: false 
            });
            
            return response.data;
          } catch (error) {
            set({ 
              error: handleApiError(error), 
              isLoading: false 
            });
            throw error;
          }
        },

        calculateRate: (checkInDate, stayType, roomId) => {
          try {
            const room = useRoomStore.getState().rooms.find(r => r.room_id === roomId);
            const settings = useReservationSettingsStore.getState().settings;
            
            if (!room) {
              throw new Error('객실을 찾을 수 없습니다.');
            }

            const checkInDay = new Date(checkInDate).getDay();
            let rate_amount = 0;
            
            // 1. 먼저 객실별 요금 확인
            if (stayType === '대실') {
              if (checkInDay === 5) rate_amount = room.rate_hourly_friday;
              else if (checkInDay === 6 || checkInDay === 0) rate_amount = room.rate_hourly_weekend;
              else rate_amount = room.rate_hourly_weekday;
            } else {
              if (checkInDay === 5) rate_amount = room.rate_nightly_friday;
              else if (checkInDay === 6 || checkInDay === 0) rate_amount = room.rate_nightly_weekend;
              else rate_amount = room.rate_nightly_weekday;
            }

            // 2. 객실별 요금이 없으면(0이면) 기본 설정 요금 사용
            if (!rate_amount) {
              const stayTypeSettings = settings[stayType];
              if (!stayTypeSettings) {
                throw new Error('예약 설정을 찾을 수 없습니다.');
              }

              if (checkInDay === 5) rate_amount = stayTypeSettings.friday_rate;
              else if (checkInDay === 6 || checkInDay === 0) rate_amount = stayTypeSettings.weekend_rate;
              else rate_amount = stayTypeSettings.weekday_rate;
            }

            console.log('금 계산 결과:', {
              객실ID: roomId,
              숙박유형: stayType,
              체크인날짜: checkInDate,
              요일: checkInDay,
              객실요금존재: !!rate_amount,
              최종요금: rate_amount
            });   

            return rate_amount;
          } catch (error) {
            console.error('요금 계산 실:', error);
            throw error;
          }
        },

        // 예약번호 중복 체크 함수 추가
        validateReservationNumber: (data) => {
          const reservations = get().reservations;
          const isDuplicate = reservations.some(r => 
            r.reservation_number === data.reservation_number &&
            r.check_in_date === data.check_in_date &&
            r.guest_name === data.guest_name
          );

          if (isDuplicate) {
            throw new Error('동일한 날짜에 같은 예약자의 동일 예약번호가 이미 존재합니다.');
          }

          return true;
        },

        // 예약 생성
        createReservation: async (data) => {
          set({ isLoading: true });
          try {
            // 예약 설정 먼저 로드
            const settingsStore = useReservationSettingsStore.getState();
            await settingsStore.fetchSettings();
            const settings = settingsStore.settings;
            
            if (!settings || !settings[data.stay_type]) {
              throw new Error('예약 정을 불러올 수 없습니다.');
            }

            // 예약번호 중복 검사
            await get().validateReservationNumber(data);
            
            // 예약 가능 여부 검증
            await get().validateReservation(data);
            
            const stayTypeSettings = settings[data.stay_type];
            
            const formattedData = {
              ...data,
              check_in_date: data.check_in_date,
              check_out_date: data.check_out_date,
              check_in_time: stayTypeSettings.check_in_time,
              check_out_time: stayTypeSettings.check_out_time,
              rate_amount: parseInt(data.rate_amount) || 0
            };

            console.log('Creating reservation with data:', formattedData);
            const response = await axios.post('/api/reservations/reservations', formattedData);
            
            set(state => ({
              reservations: [...state.reservations, response.data],
              isLoading: false
            }));

            return response.data;
          } catch (error) {
            set({ isLoading: false });
            throw handleApiError(error);
          }
        },

        // 예약 조회
        fetchReservations: async () => {
          set({ isLoading: true });
          try {
            const response = await axios.get('/api/reservations/reservations');
            const reservations = response.data;
            
            set({ 
              reservations,
              filteredReservations: reservations,
              isLoading: false 
            });
          } catch (error) {
            console.error('예약 조회 실패:', error);
            set({ 
              error: '예약 조회에 실패했습니다.',
              isLoading: false 
            });
          }
        },


        // 예약 가능한 객실 조회
        getAvailableRooms: async (checkInDate, checkOutDate, stayType) => {
          try {
            const rooms = useRoomStore.getState().rooms;
            const settings = useReservationSettingsStore.getState().settings;
            const reservations = get().reservations;

            console.log('객실 조회 시작:', {
              totalRooms: rooms.length,
              settings,
              stayType,
              checkInDate,
              checkOutDate
            });

            // 1. 예약 설정 확인
            const stayTypeSettings = settings[stayType];
            if (!stayTypeSettings) {
              throw new Error('예약 설정을 찾을 수 없습니다.');
            }

            // 2. 요일 체크
            const dayIndex = new Date(checkInDate).getDay();
            const availableDays = stayTypeSettings.available_days.split('');
            
            if (availableDays[dayIndex] === '0') {
              throw new Error('선택하신 날짜는 예약이 불가능합니다.');
            }

            // 3. 사용 가능한 객실 필터링
            let availableRooms = rooms.filter(room => {
              const hasOverlap = reservations.some(r => 
                r.room_id === room.room_id &&
                new Date(r.check_out_date) > new Date(checkInDate) &&
                new Date(r.check_in_date) < new Date(checkOutDate)
              );
              return !hasOverlap;
            });

            console.log('조회된 객실:', {
              availableRooms,
              count: availableRooms.length
            });

            return availableRooms;
          } catch (error) {
            console.error('사용 가능한 객실 조회 실패:', error);
            throw error;
          }
        },


        // 예약 업데이트
        updateReservation: async (reservation_id, data) => {
          set({ isLoading: true });
          try {
            await get().validateReservation(data);
            
            const formattedData = {
              ...data,
              check_in_date: data.check_in_date,
              check_out_date: data.check_out_date,
              rate_amount: parseInt(data.rate_amount) || 0
            };

            const response = await axios.put('/api/reservations/reservations', {
              reservation_id,
              ...formattedData
            });

            set(state => ({
              reservations: state.reservations.map(r => 
                r.reservation_id === reservation_id ? response.data : r
              ),
              isLoading: false
            }));
            
            return response.data;
          } catch (error) {
            throw handleApiError(error);
          }
        },

        // 예약 삭제
        deleteReservation: async (reservation_id) => {
          if (!window.confirm('예약을 삭제하시겠습니까?')) {
            return;
          }

          set({ isLoading: true });
          try {
            const response = await axios.delete(`/api/reservations/reservations`, {
              params: { reservation_id }
            });

            if (response.status === 200) {
              await get().fetchReservations();
              
              set(state => ({
                filteredReservations: state.reservations,
                isLoading: false
              }));
              
              alert('예약이 삭제되었습니다.');
            }
          } catch (error) {
            console.error('예약 삭제 실패:', error);
            set({ 
              error: '예약 삭제에 실패했습니다.',
              isLoading: false 
            });
            alert(error.response?.data?.message || '예약 삭제에 실패했습니다.');
          }
        },

        // 객실별 예약 상태 조회
        getRoomReservationStatus: (roomId) => {
          // 1. 객실 상태 확인
          const room = useRoomStore.getState().rooms.find(r => r.room_id === roomId);
          if (room?.room_status && room.room_status !== 'vacant') {
            return room.room_status;
          }

          // 2. 현재 예약 확인
          const currentReservation = getCurrentReservationForRoom(roomId);
          if (!currentReservation) return 'vacant';

          // 3. 예약 타입에 따른 상태 반환
          const stayTypeMap = {
            '대실': 'hourlyStay',
            '숙박': 'overnightStay',
            '장기': 'longStay'
          };

          return stayTypeMap[currentReservation.stay_type] || 'reservationComplete';
        },

        getCurrentReservation: (roomId) => {
          return getCurrentReservationForRoom(roomId);
        },

        getRoomReservationTimes: (roomId) => {
          const currentReservation = getCurrentReservationForRoom(roomId);
          if (!currentReservation) return null;

          return {
            checkInTime: currentReservation.check_in_time,
            checkOutTime: currentReservation.check_out_time,
            checkInDate: currentReservation.check_in_date,
            checkOutDate: currentReservation.check_out_date
          };
        },

        getRoomsByStayType: (stayType) => {
          const state = get();
          const rooms = useRoomStore.getState().rooms;
          
          if (stayType === 'all') return rooms;

          return rooms.filter(room => {
            const status = state.getRoomReservationStatus(room.room_id);
            return status === stayType;
          });
        },

        getStayTypeCount: (stayType) => {
          if (stayType === 'all') return useRoomStore.getState().rooms.length;
          
          const rooms = useRoomStore.getState().rooms;
          return rooms.filter(room => {
            const status = get().getRoomReservationStatus(room.room_id);
            return status === stayType;
          }).length;
        },

        setFilteredReservations: (filtered) => set({ filteredReservations: filtered }),

        setSearchTerm: (term) => {
          const state = get();
          const value = term.toLowerCase();
          
          if (!value.trim()) {
            set({ 
              searchTerm: term,
              filteredReservations: state.reservations,
              currentPage: 1
            });
            return;
          }

          const filtered = state.reservations.filter(reservation => {
            switch (state.searchType) {
              case 'reservation_number':
                return reservation.reservation_number?.toLowerCase().includes(value);
              case 'guest_name':
                return reservation.guest_name?.toLowerCase().includes(value);
              case 'phone':
                return reservation.phone?.includes(value);
              default:
                return true;
            }
          });

          set({ 
            searchTerm: term,
            filteredReservations: filtered,
            currentPage: 1
          });
        },

        setSearchType: (type) => {
          const state = get();
          set({ 
            searchType: type,
            currentPage: 1
          });
          
          if (state.searchTerm) {
            state.setSearchTerm(state.searchTerm);
          }
        },

        validateReservation: async (data) => {
          try {
            const state = get();
            const settingsStore = useReservationSettingsStore.getState();
            let settings = settingsStore.settings;

            // 설정이 없으면 기본 설정 사용
            if (!settings || !settings[data.stay_type]) {
              settings = {
                대실: {
                  check_in_time: '09:00',
                  check_out_time: '21:00',
                  available_days: '1111111'
                },
                숙박: {
                  check_in_time: '15:00',
                  check_out_time: '11:00',
                  available_days: '1111111'
                },
                장기: {
                  check_in_time: '15:00',
                  check_out_time: '11:00',
                  available_days: '1111111'
                }
              };
            }

            const stayTypeSettings = settings[data.stay_type];

            // 1. 날짜 유효성 검사
            reservationUtils.validateDates(
              data.check_in_date,
              data.check_out_date,
              stayTypeSettings
            );

            // 2. 시간 유효성 검사
            const checkInTime = data.check_in_time || stayTypeSettings.check_in_time;
            const checkOutTime = data.check_out_time || stayTypeSettings.check_out_time;
            
            if (!checkInTime || !checkOutTime) {
              throw new Error('체크인/아웃 시간이 올바르지 않습니다.');
            }

            // 3. 객실 중복 예약 검사
            const existingReservations = state.reservations.filter(
              r => r.room_id === data.room_id && 
                  r.reservation_id !== data.reservation_id
            );

            for (const existing of existingReservations) {
              // 예약 가능 여부 확인
              if (!reservationUtils.isReservationPossible(
                { ...data, check_in_time: checkInTime, check_out_time: checkOutTime },
                existing,
                settings
              )) {
                const hasOverlap = reservationUtils.checkTimeOverlap(
                  { ...data, check_in_time: checkInTime, check_out_time: checkOutTime },
                  existing,
                  settings
                );

                if (hasOverlap) {
                  throw new Error('해당 시간에 이미 예약이 존재합니다.');
                }
              }
            }

            return true;
          } catch (error) {
            console.error('예약 검증 실패:', error);
            throw error;
          }
        },

        // dateUtils를 store의 상태로 추가
        dateUtils: {
          formatDate: dateUtils.formatDate,
          getKSTDate: dateUtils.getKSTDate,
          startOfDay: dateUtils.startOfDay,
          endOfDay: dateUtils.endOfDay,
          parseDate: dateUtils.parseDate,
          startOfDayKST: dateUtils.startOfDayKST,
          endOfDayKST: dateUtils.endOfDayKST
        },
      };
    },
    {
      name: 'reservation-storage'
    }
  )
);

// 공통 에러 처리 함수
const handleApiError = (error) => {
  const errorMessage = error.response?.data?.error || 
                      error.response?.data?.details || 
                      error.message || 
                      '알 수 없는 오류가 발생했습니다.';
  return errorMessage;
};

export default useReservationStore;

