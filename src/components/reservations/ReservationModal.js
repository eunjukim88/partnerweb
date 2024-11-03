import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';
import { BOOKING_SOURCES } from '../../constants/reservation';
import useReservationStore from '../../store/reservationStore';
import axios from 'axios';
import { stayTypeMap } from '../../store/reservationSettingsStore';
import useReservationSettingsStore from '../../store/reservationSettingsStore';

const ReservationModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    guestName: '',
    phoneNumber: '',
    bookingSource: '',
    stayType: '',
    checkIn: null,
    checkOut: null,
    roomId: null
  });
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const { settings, fetchSettings } = useReservationSettingsStore();
  const { validateReservationDate, getAvailableRooms } = useReservationStore();
  const [availableDays, setAvailableDays] = useState([]);
  const [duration, setDuration] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const dayMapping = {
    1: '월', 2: '화', 3: '수', 4: '목', 5: '금', 6: '토', 7: '일'
  };

  const getSelectedDays = (duration) => {
    const selectedDays = [];
    for (let i = 1; i <= 7; i++) {
      if (duration & (1 << (i - 1))) {
        selectedDays.push(dayMapping[i]);
      }
    }
    return selectedDays;
  };

  const handleDateChange = (name, value) => {
    try {
      const newDate = value ? new Date(value) : null;
      
      if (newDate && duration) {
        try {
          useReservationStore.getState().validateDate(newDate, duration);
          
          setFormData(prev => ({
            ...prev,
            [name]: value
          }));
          setError(null);
        } catch (error) {
          if (error.message === 'INVALID_DATE') {
            const dayOfWeek = newDate.getDay();
            const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
            const availableDays = getSelectedDays(duration);
            
            setError(
              `${dayMapping[adjustedDay]}요일은 예약이 불가능합니다.\n` +
              `예약 가능 요일: ${availableDays.join(', ')}`
            );
          } else {
            setError(error.message);
          }
        }
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const formattedNumber = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedNumber
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      // 필수 입력값 검증
      const requiredFields = ['guestName', 'phoneNumber', 'bookingSource', 'stayType', 'checkIn', 'checkOut', 'roomId'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        throw new Error('모든 필수 항목을 입력해주세요.');
      }

      // 예약 생성 요청
      await useReservationStore.getState().createReservation(formData);
      
      // 성공 시 모달 닫기 및 콜백 실행
      onSave && onSave();
      onClose();
      
    } catch (err) {
      setError(err.message || '예약 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStayTypeChange = async (e) => {
    const { value } = e.target;
    try {
      const { availableDays, duration } = await useReservationStore.getState().getAvailableDays(value);
      setAvailableDays(availableDays);
      setDuration(duration);
      setFormData(prev => ({
        ...prev,
        stayType: value,
        checkIn: null,
        checkOut: null
      }));
      setError(null);
    } catch (error) {
      setError(error.message);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <FormGroup>
              <Label>예약번호</Label>
              <Input
                name="reservation_number"
                value={formData.reservation_number || ''}
                onChange={handleInputChange}
                placeholder="예약번호를 입력하세요"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>예약자명</Label>
              <Input
                name="guestName"
                value={formData.guestName}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>연락처</Label>
              <Input
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                placeholder="010-0000-0000"
                maxLength={13}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>예약 경로</Label>
              <Select
                name="bookingSource"
                value={formData.bookingSource}
                onChange={handleInputChange}
                required
              >
                <option value="">선택해주세요</option>
                {BOOKING_SOURCES.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>숙박 유형</Label>
              <Select
                name="stayType"
                value={formData.stayType}
                onChange={handleInputChange}
                required
              >
                <option value="">선택해주세요</option>
                <option value="대실">대실</option>
                <option value="숙박">숙박</option>
                <option value="장기">장기</option>
              </Select>
            </FormGroup>
          </>
        );

      case 2:
        const staySettings = settings[stayTypeMap[formData.stayType]] || {};
        return (
          <>
            <FormGroup>
              <Label>체크인 시간: {staySettings.checkInTime}</Label>
              <Input
                type="date"
                name="checkIn"
                value={formData.checkIn}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>체크아웃 시간: {staySettings.checkOutTime}</Label>
              <Input
                type="date"
                name="checkOut"
                value={formData.checkOut}
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
                required
                min={formData.stayType === 'DAILY' ? formData.checkIn : undefined}
              />
            </FormGroup>
          </>
        );

      case 3:
        return (
          <FormGroup>
            <Label>객실 선택</Label>
            <Select
              name="roomId"
              value={formData.roomId || ''}
              onChange={handleInputChange}
              required
            >
              <option value="">선택해주세요</option>
              {availableRooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.number}호 {room.name ? `- ${room.name}` : ''}
                </option>
              ))}
            </Select>
          </FormGroup>
        );
    }
  };

  const handleNext = async () => {
    try {
      if (step === 1) {
        console.log('1단계 - 현재 formData:', formData);
        console.log('1단계 - settings 상태:', settings);
        
        if (!formData.stayType) {
          throw new Error('숙박 유형을 선택해주세요.');
        }

        const { duration } = await useReservationStore.getState().getAvailableDays(formData.stayType);
        console.log('받아온 duration 값:', duration);
        setDuration(duration);
        setStep(prev => prev + 1);
      } else if (step === 2) {
        // 객실 조회 로직
        const rooms = await getAvailableRooms({
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          stayType: formData.stayType
        });
        setAvailableRooms(rooms);
        setStep(prev => prev + 1);
      } else {
        setStep(prev => prev + 1);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  // duration 값에 따른 가능 요일 테스트
  useEffect(() => {
    if (duration) {
      console.log('현재 duration:', duration);
      console.log('예약 가능 요일:', getSelectedDays(duration));
    }
  }, [duration]);

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{`예약 ${step}/3단계`}</h2>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <form onSubmit={handleSubmit}>
            {renderStepContent()}
            <FormRow>
              {step > 1 && (
                <Button type="button" onClick={handleBack}>
                  이전
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={handleNext}>
                  다음
                </Button>
              ) : (
                <SubmitButton type="submit" disabled={isLoading}>
                  {isLoading ? '저장 중...' : '예약 완료'}
                </SubmitButton>
              )}
            </FormRow>
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

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: #fff3f3;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
`;

export default ReservationModal;
