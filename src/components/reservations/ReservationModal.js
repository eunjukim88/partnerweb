import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';

const formatTimeToAmPm = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);
  const period = hour >= 12 ? '오후' : '오전';
  
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  
  return `${period}:${hour.toString().padStart(2, '0')}:${minutes}`;
};

const ReservationModal = ({ reservation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    reservationNumber: '',
    roomNumber: '',
    guestName: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    checkInTime: '',
    checkOutTime: '',
    bookingSource: '',
    stayType: '',
    status: 'confirmed',
    memo: ''
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomSettings, setRoomSettings] = useState(null);
  const [reservationSettings, setReservationSettings] = useState(null);
  const [settings, setSettings] = useState({
    selectedDays: [],
    checkInTime: '',
    checkOutTime: '',
    weekdayPrice: '0',
    fridayPrice: '0',
    weekendPrice: '0'
  });

  useEffect(() => {
    fetchAvailableRooms();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (reservation) {
      setFormData({
        id: reservation.id,
        reservationNumber: reservation.reservation_number,
        roomNumber: reservation.room_number,
        guestName: reservation.guest_name,
        phone: reservation.phone,
        checkIn: new Date(reservation.check_in).toISOString().split('T')[0],
        checkOut: new Date(reservation.check_out).toISOString().split('T')[0],
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
    if (formData.stay_type && reservationSettings) {
      const stayTypeMap = {
        '대실': 'hourly',
        '숙박': 'nightly',
        '장기': 'longTerm'
      };
      
      const currentSettings = reservationSettings[stayTypeMap[formData.stay_type]];
      if (currentSettings) {
        setSettings(currentSettings);
        setFormData(prev => ({
          ...prev,
          check_in_time: currentSettings.checkInTime,
          check_out_time: currentSettings.checkOutTime
        }));
      }
    }
  }, [formData.stayType, reservationSettings]);

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
      const formattedSettings = {
        hourly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        nightly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        longTerm: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} }
      };
      
      // 요일 매핑
      const dayMap = {1:'월', 2:'화', 3:'수', 4:'목', 5:'금', 6:'토', 7:'일'};
      
      data.forEach(item => {
        const stayTypeMap = {
          'hourly': 'hourly',
          'nightly': 'nightly',
          'longTerm': 'longTerm'
        };
        
        const mappedType = stayTypeMap[item.stay_type];
        if (mappedType) {
          formattedSettings[mappedType] = {
            selectedDays: item.available_days.map(day => dayMap[day]),
            checkInTime: formatTimeToAmPm(item.check_in_time),
            checkOutTime: formatTimeToAmPm(item.check_out_time),
            base_rate: item.base_rate
          };
        }
      });
      
      setReservationSettings(formattedSettings);
    } catch (error) {
      console.error('설정 조회 실패:', error);
    }
  };

  const validateReservation = () => {
    if (!formData.stayType || !reservationSettings) {
      throw new Error('숙박 유형을 선택해주세요.');
    }

    const stayTypeMap = {
      '대실': 'hourly',
      '숙박': 'nightly',
      '장기': 'longTerm'
    };

    const mappedType = stayTypeMap[formData.stayType];
    const settings = reservationSettings[mappedType];
    
    if (!settings || !settings.selectedDays) {
      throw new Error('해당 숙박 유형의 설정을 찾을 수 없습니다.');
    }

    const checkInDate = new Date(formData.checkIn);
    let dayOfWeek = checkInDate.getDay(); // 0(일) - 6(토)
    dayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // 일요일인 경우 7로 변경

    const dayMap = {
      1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일'
    };

    if (!settings.selectedDays.includes(dayMap[dayOfWeek])) {
      throw new Error('선택하신 날짜는 예약이 불가능한 요일입니다.');
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateReservation();
      
      const formatTime = (timeStr) => {
        const [period, time] = timeStr.split(':');
        let [hours] = time.split(':');
        hours = parseInt(hours);
        
        if (period === '오후' && hours !== 12) {
          hours += 12;
        } else if (period === '오전' && hours === 12) {
          hours = 0;
        }
        
        return `${hours.toString().padStart(2, '0')}:00:00`;
      };

      const reservationData = {
        id: formData.id,
        reservationNumber: formData.reservationNumber,
        roomNumber: formData.roomNumber,
        guestName: formData.guestName,
        phone: formData.phone,
        checkIn: formData.checkIn,
        checkInTime: formatTime(formData.checkInTime),
        checkOut: formData.checkOut,
        checkOutTime: formatTime(formData.checkOutTime),
        bookingSource: formData.bookingSource,
        stayType: formData.stayType,
        status: 'confirmed',
        memo: formData.memo || ''
      };

      await onSave(reservationData);
      onClose();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
    if (!formData.checkIn || !formData.checkOut || !availableRooms) return [];

    return availableRooms.filter(room => {
      // 해당 날짜에 예약된 객실 확인
      const hasConflict = room.reservations?.some(reservation => {
        const reservationStart = new Date(reservation.check_in);
        const reservationEnd = new Date(reservation.check_out);
        const newStart = new Date(formData.checkIn);
        const newEnd = new Date(formData.checkOut);

        // 대실인 경우 당일 체크아웃 이후 숙박 예약 가능
        if (reservation.stay_type === '대실' && formData.stayType !== '대실') {
          return false;
        }

        return (
          (newStart >= reservationStart && newStart < reservationEnd) ||
          (newEnd > reservationStart && newEnd <= reservationEnd)
        );
      });

      return !hasConflict;
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

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{reservation ? '예약 수정' : '신규 예약'}</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>예약번호</Label>
                <Input 
                  name="reservation_number"
                  value={formData.reservation_number}
                  onChange={handleChange}
                  placeholder="예약번호를 입력하세요"
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약 경로</Label>
                <Select name="booking_source" value={formData.booking_source} onChange={handleChange}>
                  <option value="">선택하세요</option>
                  {BOOKING_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>숙박 유형</Label>
                <Select name="stay_type" value={formData.stay_type} onChange={handleChange}>
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
                <Input value={formData.check_in_time} disabled />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃 시간</Label>
                <Input value={formData.check_out_time} disabled />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>체크인 날짜</Label>
                <Input type="date" name="check_in" value={formData.check_in} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃 날짜</Label>
                <Input type="date" name="check_out" value={formData.check_out} onChange={handleChange} />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>객실</Label>
                <Select 
                  name="room_number" 
                  value={formData.room_number} 
                  onChange={handleChange}
                  disabled={!formData.check_in || !formData.check_out || !formData.stay_type}
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
                <Label>예약자명</Label>
                <Input name="guest_name" value={formData.guest_name} onChange={handleChange} />
              </FormGroup>
              <FormGroup>
                <Label>전화번호</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} />
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
  z-index: 1100; // 이 값을 높게 설정
`;

const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1101; // ModalOverlay보다 높게 설정
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

export default ReservationModal;
