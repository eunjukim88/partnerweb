import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';

const ReservationModal = ({ reservation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    reservation_number: '',
    room_number: '',
    guest_name: '',
    phone: '',
    check_in: '',
    check_out: '',
    booking_source: '',
    stay_type: '',
    status: '',
    memo: ''
  });
  const [availableRooms, setAvailableRooms] = useState([]);
  const [roomSettings, setRoomSettings] = useState(null);
  const [reservationSettings, setReservationSettings] = useState(null);

  useEffect(() => {
    fetchAvailableRooms();
    fetchSettings();
  }, []);

  useEffect(() => {
    if (reservation) {
      // 기존 예약 데이터가 있을 경우 폼 데이터 초기화
      setFormData({
        id: reservation.id,
        reservation_number: reservation.reservation_number,
        room_number: reservation.room_number,
        guest_name: reservation.guest_name,
        phone: reservation.phone,
        check_in: new Date(reservation.check_in).toISOString().split('T')[0],
        check_out: new Date(reservation.check_out).toISOString().split('T')[0],
        booking_source: reservation.booking_source,
        stay_type: reservation.stay_type,
        status: reservation.status,
        memo: reservation.memo || ''
      });
    }
  }, [reservation]);

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
      const [roomSettingsRes, reservationSettingsRes] = await Promise.all([
        fetch('/api/mypage/rooms'),  // RoomEdit 컴포넌트에서 사용하는 경로와 동일하게 수정
        fetch('/api/mypage/reservation-settings')  // ReservationSettings 컴포넌트에서 사용하는 경로와 동일하게 수정
      ]);
      
      if (!roomSettingsRes.ok || !reservationSettingsRes.ok) {
        throw new Error('설정 조회 실패');
      }
        
      const roomSettingsData = await roomSettingsRes.json();
      const reservationSettingsData = await reservationSettingsRes.json();
      
      // 기본값 설정
      setRoomSettings(roomSettingsData || {});
      setReservationSettings(reservationSettingsData || {
        hourly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        nightly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        longTerm: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} }
      });
    } catch (error) {
      console.error('설정 조회 실패:', error);
      // 에러 발생 시 기본값 설정
      setRoomSettings({});
      setReservationSettings({
        hourly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        nightly: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} },
        longTerm: { selectedDays: [], checkInTime: '', checkOutTime: '', base_rate: {} }
      });
    }
  };

  const validateReservation = () => {
    // 객실 예약 가능 여부 확인
    const room = availableRooms.find(r => r.number === formData.room_number);
    if (!room) {
      throw new Error('유효하지 않은 객실입니다.');
    }

    // 예약 설정 제약 확인
    if (reservationSettings && Array.isArray(reservationSettings)) {
      const settings = reservationSettings.find(s => s.stay_type === formData.stay_type);
      if (settings) {
        const checkInDate = new Date(formData.check_in);
        const checkOutDate = new Date(formData.check_out);
        
        // 예약 가능 요일 확인
        const dayOfWeek = checkInDate.getDay();
        if (settings.available_days && !settings.available_days.includes(dayOfWeek)) {
          throw new Error('예약 불가능한 요일입니다.');
        }

        // 체크인/아웃 시간 확인
        if (settings.check_in_time && settings.check_out_time) {
          const checkInTime = new Date(checkInDate);
          checkInTime.setHours(parseInt(settings.check_in_time.split(':')[0]), parseInt(settings.check_in_time.split(':')[1]));
          
          const checkOutTime = new Date(checkOutDate);
          checkOutTime.setHours(parseInt(settings.check_out_time.split(':')[0]), parseInt(settings.check_out_time.split(':')[1]));
          
          if (checkInDate < checkInTime || checkOutDate > checkOutTime) {
            throw new Error('체크인/아웃 시간이 예약 가능 시간을 벗어났습니다.');
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      validateReservation();
      // 데이터 형식 변환
      const reservationData = {
        id: formData.id,
        reservationNumber: formData.reservation_number,
        roomNumber: formData.room_number,
        guestName: formData.guest_name,
        phone: formData.phone,
        checkIn: formData.check_in,
        checkOut: formData.check_out,
        bookingSource: formData.booking_source,
        stayType: formData.stay_type,
        memo: formData.memo
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

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{reservation ? '예약 수정' : '신규 예약'}</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>예약번호</Label>
                <Input
                  type="text"
                  name="reservation_number"
                  value={formData.reservation_number}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>체크인</Label>
                <Input
                  type="datetime-local"
                  name="check_in"
                  value={formData.check_in}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃</Label>
                <Input
                  type="datetime-local"
                  name="check_out"
                  value={formData.check_out}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>객실 번호</Label>
                <Select
                  name="room_number"
                  value={formData.room_number}
                  onChange={handleChange}
                  required
                >
                  <option value="">선택하세요</option>
                  {availableRooms.map(room => (
                    <option key={room.number} value={room.number}>{room.number}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약자명</Label>
                <Input
                  type="text"
                  name="guest_name"
                  value={formData.guest_name}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>전화번호</Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약 경로</Label>
                <Select
                  name="booking_source"
                  value={formData.booking_source}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {BOOKING_SOURCES.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>숙박 유형</Label>
                <Select
                  name="stay_type"
                  value={formData.stay_type}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {STAY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
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
