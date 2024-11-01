import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';
import { BOOKING_SOURCES, STAY_TYPES, formatTimeToAmPm } from '../../constants/reservation';
import useReservationStore from '../../store/reservationStore';

const ReservationModal = ({ reservation, onClose, onSave }) => {
  const { 
    addReservation, 
    updateReservation, 
    isLoading: storeLoading,
    error: storeError 
  } = useReservationStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [reservationSettings, setReservationSettings] = useState(null);

  const initialFormData = {
    id: null,
    reservationNumber: '',
    roomNumber: '',
    guestName: '',
    phone: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date().toISOString().split('T')[0],
    checkInTime: '',
    checkOutTime: '',
    bookingSource: '',
    stayType: '',
    status: 'confirmed',
    memo: '',
    price: ''
  };

  const [formData, setFormData] = useState(initialFormData);
  const [roomSettings, setRoomSettings] = useState(null);
  const [settings, setSettings] = useState({
    selectedDays: [],
    check_in_time: '',
    check_out_time: '',
    weekdayPrice: '',
    fridayPrice: '',
    weekendPrice: ''
  });

  // 초기 데이터 로드 함수 정의
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 객실 정보와 예약 설정 동시 조회
      const [roomsResponse, settingsResponse] = await Promise.all([
        fetch('/api/rooms'),
        fetch('/api/mypage/reservation-settings')
      ]);

      if (!roomsResponse.ok || !settingsResponse.ok) {
        throw new Error('데이터 로드 실패');
      }

      const [roomsData, settingsData] = await Promise.all([
        roomsResponse.json(),
        settingsResponse.json()
      ]);

      setAvailableRooms(roomsData);
      setReservationSettings(settingsData);
    } catch (error) {
      setError(error.message);
      console.error('초기 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if (reservation) {
      console.log('원본 체크인 날짜:', reservation.check_in);
      const formattedCheckIn = formatDate(reservation.check_in);
      const formattedCheckOut = formatDate(reservation.check_out);
      console.log('변환된 체크인 날짜:', formattedCheckIn);

      setFormData({
        id: reservation.id,
        reservationNumber: reservation.reservation_number,
        roomNumber: reservation.room_number,
        guestName: reservation.guest_name,
        phone: reservation.phone,
        checkIn: formattedCheckIn,
        checkOut: formattedCheckOut,
        checkInTime: formatTimeToAmPm(reservation.check_in_time),
        checkOutTime: formatTimeToAmPm(reservation.check_out_time),
        bookingSource: reservation.booking_source,
        stayType: reservation.stay_type,
        status: reservation.status,
        memo: reservation.memo || ''
      });
    }
  }, [reservation]);

  useEffect(() => {
    if (formData.stayType && reservationSettings) {
      const stayTypeMap = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };
      
      const mappedType = stayTypeMap[formData.stayType];
      const currentSettings = reservationSettings[mappedType];
      
      if (currentSettings) {
        setFormData(prev => ({
          ...prev,
          checkInTime: currentSettings.check_in_time,
          checkOutTime: currentSettings.check_out_time
        }));
      }
    }
  }, [formData.stayType, reservationSettings]);

  useEffect(() => {
    if (formData.checkIn && formData.stayType && reservationSettings) {
      const stayTypeMap = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };
      
      const mappedType = stayTypeMap[formData.stayType];
      const currentSettings = reservationSettings[mappedType];
      
      if (currentSettings) {
        updatePrice(formData.checkIn, currentSettings);
      }
    }
  }, [formData.checkIn, formData.stayType, reservationSettings]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/mypage/reservation-settings');
        if (!response.ok) throw new Error('설정을 불러오는데 실패했습니다.');
        const data = await response.json();
        
        const stayTypeMap = {
          '대실': 'hourly',
          '숙박': 'nightly',
          '장기': 'longTerm'
        };

        const settings = data.find(setting => 
          setting.stay_type === stayTypeMap[formData.stayType]
        );

        if (settings) {
          if (formData.stayType === '대실') {
            const today = new Date().toISOString().split('T')[0];
            setFormData(prev => ({
              ...prev,
              checkIn: today,
              checkOut: today,
              checkInTime: settings.check_in_time,
              checkOutTime: settings.check_out_time
            }));
          } else {
            setFormData(prev => ({
              ...prev,
              checkInTime: settings.check_in_time,
              checkOutTime: settings.check_out_time
            }));
          }
        }
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    };

    if (formData.stayType) {
      fetchSettings();
    }
  }, [formData.stayType]);

  const fetchAvailableRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setAvailableRooms(data);
    } catch (error) {
      console.error('객실 정보 조회 실패:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/mypage/reservation-settings');
      if (!response.ok) throw new Error('설정 조회 실패');
      
      const data = await response.json();
      console.log('Fetched settings data:', data);

      const formattedSettings = {
        hourly: {
          selectedDays: [],
          checkInTime: '',
          checkOutTime: '',
          weekdayPrice: '',
          fridayPrice: '',
          weekendPrice: ''
        },
        nightly: {
          selectedDays: [],
          checkInTime: '',
          checkOutTime: '',
          weekdayPrice: '',
          fridayPrice: '',
          weekendPrice: ''
        },
        longTerm: {
          selectedDays: [],
          checkInTime: '',
          checkOutTime: '',
          weekdayPrice: '',
          fridayPrice: '',
          weekendPrice: ''
        }
      };
      
      data.forEach(item => {
        const stayTypeMap = {
          'hourly': 'hourly',
          'nightly': 'nightly',
          'longTerm': 'longTerm'
        };
        
        const mappedType = stayTypeMap[item.stay_type];
        if (mappedType) {
          formattedSettings[mappedType] = {
            selectedDays: item.available_days || [],
            checkInTime: formatTimeToAmPm(item.check_in_time),
            checkOutTime: formatTimeToAmPm(item.check_out_time),
            weekdayPrice: item.base_rate?.weekday || '',
            fridayPrice: item.base_rate?.friday || '',
            weekendPrice: item.base_rate?.weekend || ''
          };
        }
      });
      
      console.log('Formatted settings:', formattedSettings);
      setReservationSettings(formattedSettings);
    } catch (error) {
      console.error('설정 조회 실패:', error);
    }
  };

  const validateReservation = () => {
    const errors = [];

    // 필수 필드 검증
    if (!formData.roomNumber) {
      errors.push('객실을 선택해주세요.');
    }

    if (!formData.guestName?.trim()) {
      errors.push('예약자명을 입력해주세요.');
    }

    if (!formData.checkIn) {
      errors.push('체크인 날짜를 선택해주세요.');
    }

    if (!formData.checkOut) {
      errors.push('체크웃 날짜를 선택해주세요.');
    }

    if (!formData.stayType) {
      errors.push('숙박 유형을 선택해주세요.');
    }

    if (!formData.bookingSource) {
      errors.push('예약 경로를 선택해주세요.');
    }

    // 전화번호 형식 검증 (선택적)
    if (formData.phone && !/^\d{2,3}-?\d{3,4}-?\d{4}$/.test(formData.phone)) {
      errors.push('올바른 전화번호 형식이 아닙니다.');
    }

    // 날짜 유효성 검증
    if (formData.checkIn && formData.checkOut) {
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      
      if (checkOut < checkIn) {
        errors.push('체크아웃 날짜는 체크인 날짜 이후여야 합니다.');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      validateReservation();
      
      const formattedData = {
        ...formData,
        check_in_time: convertTimeFormat(formData.checkInTime),
        check_out_time: convertTimeFormat(formData.checkOutTime),
        price: Number(formData.price)
      };

      if (reservation?.id) {
        // 수정
        await updateReservation(reservation.id, formattedData);
      } else {
        // 신규 예약
        await addReservation(formattedData);
      }

      onClose();
      if (onSave) {
        onSave(formattedData);
      }
    } catch (error) {
      setError(error.message);
      console.error('예약 저장 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 숙박 유형이나 체크인 날짜가 변경될 때 가격 업데이트
    if (name === 'stayType' || name === 'checkIn') {
      const newStayType = name === 'stayType' ? value : formData.stayType;
      const newCheckIn = name === 'checkIn' ? value : formData.checkIn;
      if (newStayType && newCheckIn) {
        updatePrice(newStayType, newCheckIn);
      }
    }
  };

  // BOOKING_SOURCES와 STAY_TYPES 상수 추가
  const BOOKING_SOURCES = [
    '직접예약',
    '에어비앤비',
    '야놀자',
    '여기어때',
    '부킹닷컴',
    '아고다',
    '기타'
  ];

  const STAY_TYPES = [
    '대실',
    '숙박',
    '장기'
  ];

  const getAvailableRooms = () => {
    if (!formData.checkIn || !formData.checkOut || !formData.stayType) {
      return [];
    }
    
    return availableRooms.filter(room => {
      return true;
    });
  };

  // 요일 선택 여부에 따른 가격 입력 활성화 상태 계산
  const isWeekdayEnabled = settings?.selectedDays ? 
    ['월', '화', '수', '목'].some(day => settings.selectedDays.includes(day)) : 
    false;
  const isFridayEnabled = settings?.selectedDays?.includes('금') || false;
  const isWeekendEnabled = settings?.selectedDays ? 
    (settings.selectedDays.includes('토') || settings.selectedDays.includes('일')) : 
    false;

  // 숙박 유형 변경 시 가격 업데이트
  const updatePrice = useCallback(async (stayType, checkInDate) => {
    if (!stayType || !checkInDate) return;

    try {
      const stayTypeMap = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };

      const response = await fetch('/api/mypage/reservation-settings');
      if (!response.ok) throw new Error('설정을 불러오는데 실패했습니다.');
      const settings = await response.json();
      
      const targetSetting = settings.find(s => s.stay_type === stayTypeMap[stayType]);
      if (!targetSetting) return;

      const baseRate = typeof targetSetting.base_rate === 'string' 
        ? JSON.parse(targetSetting.base_rate) 
        : targetSetting.base_rate;

      const checkIn = new Date(checkInDate);
      const dayOfWeek = checkIn.getDay();
      
      let price = 0;
      if (dayOfWeek === 5) { // 금요일
        price = baseRate.friday;
      } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 일요일(0) 또는 토요일(6)
        price = baseRate.weekend;
      } else { // 평일
        price = baseRate.weekday;
      }

      setFormData(prev => ({
        ...prev,
        price: price
      }));
    } catch (error) {
      console.error('가격 업데이트 실패:', error);
      setError('가격 정보를 불러오는데 실패했습니다.');
    }
  }, []);

  // 숙박 유형이나 체크인 날짜가 변경될 때 가격 업데이트
  useEffect(() => {
    if (formData.stayType && formData.checkIn) {
      updatePrice(formData.stayType, formData.checkIn);
    }
  }, [formData.stayType, formData.checkIn, updatePrice]);

  // 시간 형식 변환 함수 수정
  const convertTimeFormat = (timeStr) => {
    if (!timeStr) return null;
    
    try {
      const [period, time] = timeStr.split(':');
      let [hours, minutes] = time.split(':');
      hours = parseInt(hours);
      
      if (period === '오후' && hours !== 12) {
        hours += 12;
      } else if (period === '오전' && hours === 12) {
        hours = 0;
      }
      
      return `${hours.toString().padStart(2, '0')}:00:00`;
    } catch (error) {
      console.error('시간 형식 변환 오류:', error);
      return null;
    }
  };

  // 날짜 형식 변환 함수 수정
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    
    // 날짜 객체 생성 시 시간대 고려
    const date = new Date(dateStr);
    const offset = date.getTimezoneOffset() * 60000; // 분을 밀리초로 변환
    const localDate = new Date(date.getTime() - offset);
    
    return localDate.toISOString().split('T')[0];
  };

  // 가격 계산 함수 수정
  const calculatePrice = useCallback((stayType, checkInDate) => {
    if (!stayType || !checkInDate || !reservationSettings) return 0;

    const setting = reservationSettings.find(s => 
      s.stay_type === stayTypeMap[stayType]
    );

    if (!setting?.base_rate) return 0;

    const checkIn = new Date(checkInDate);
    const dayOfWeek = checkIn.getDay();
    
    if (dayOfWeek === 5) { // 금요일
      return setting.base_rate.friday || 0;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 일요일(0) 또는 토요일(6)
      return setting.base_rate.weekend || 0;
    } else { // 평일
      return setting.base_rate.weekday || 0;
    }
  }, [reservationSettings]);

  // 폼 데이터 변경 시 가격 자동 계산
  useEffect(() => {
    if (formData.stayType && formData.checkIn) {
      const price = calculatePrice(formData.stayType, formData.checkIn);
      setFormData(prev => ({
        ...prev,
        price
      }));
    }
  }, [formData.stayType, formData.checkIn, calculatePrice]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch('/api/mypage/reservation-settings');
        if (!response.ok) throw new Error('설정을 불러오는데 실패했습니다.');
        const data = await response.json();
        setReservationSettings(data);
      } catch (error) {
        console.error('설정 로드 실패:', error);
        setError('설정을 불러오는데 실패했습니다.');
      }
    };

    loadInitialData();
  }, []);

  // 숙박 유형 매핑
  const stayTypeMap = {
    '대실': 'hourly',
    '숙박': 'nightly',
    '장기': 'longTerm'
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{reservation ? '예약 수정' : '신규 예약'}</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          {storeError && <ErrorMessage>{storeError}</ErrorMessage>}
          {(isLoading || storeLoading) && <LoadingSpinner>저장 중...</LoadingSpinner>}
          
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>예약번호 *</Label>
                <Input
                  type="text"
                  name="reservationNumber"
                  value={formData.reservationNumber}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약 경로</Label>
                <Select name="bookingSource" value={formData.bookingSource} onChange={handleChange}>
                  <option value="">선택하세요</option>
                  {BOOKING_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>숙박 유형</Label>
                <Select name="stayType" value={formData.stayType} onChange={handleChange}>
                  <option value="">선택하세요</option>
                  {STAY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>체크인 시간</Label>
                <Input value={formData.checkInTime} disabled />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃 시간</Label>
                <Input value={formData.checkOutTime} disabled />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>체크인 날짜</Label>
                <Input 
                  type="date" 
                  name="checkIn" 
                  value={formData.checkIn} 
                  onChange={handleChange} 
                />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃 날짜</Label>
                <Input 
                  type="date" 
                  name="checkOut" 
                  value={formData.checkOut} 
                  onChange={handleChange} 
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>객실</Label>
                <Select 
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  disabled={!formData.checkIn || !formData.checkOut || !formData.stayType}
                >
                  <option value="">선택하세요</option>
                  {getAvailableRooms().map(room => (
                    <option key={room.number} value={room.number}>
                      {room.number}호
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약자명 *</Label>
                <Input
                  type="text"
                  name="guestName"
                  value={formData.guestName}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>전화번호</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약 가격</Label>
                <Input 
                  type="text"
                  value={formData.price ? `${formData.price.toLocaleString()}원` : ''}
                  disabled 
                />
              </FormGroup>
            </FormRow>
            <SubmitButton type="submit">저장</SubmitButton>
          </form>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
`;

const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1101;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 20px;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const SubmitButton = styled.button`
  padding: 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  width: 100%;
  margin-top: 15px;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: #fff3f3;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
`;

export default ReservationModal;
