import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';
import { BOOKING_SOURCES, STAY_TYPE_MAP, REVERSE_STAY_TYPE_MAP } from '../../constants/reservation';
import useReservationStore from '../../store/reservationStore';
import useReservationSettingsStore from '../../store/reservationSettingsStore';
import useRoomStore from '../../store/roomStore';

const ReservationModal = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [formData, setFormData] = useState({
    reservation_number: '',
    guest_name: '',
    phone: '',
    booking_source: '',
    stay_type: '',
    check_in_date: null,
    check_out_date: null,
    check_in_time: '',
    check_out_time: '',
    room_id: null,
    custom_rate: false,
    stay_type_rate: 0,
    memo: ''
  });

  const { settings } = useReservationSettingsStore();
  const { rooms } = useRoomStore();

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
    } else if (name === 'stay_type') {
      const backendStayType = STAY_TYPE_MAP[value];
      console.log('선택된 숙박유형:', { 
        frontend: value, 
        backend: backendStayType 
      });
      
      setFormData(prev => ({
        ...prev,
        stay_type: value,
        stay_type_backend: backendStayType,
        check_in_date: null,
        check_out_date: null,
        check_in_time: '',
        check_out_time: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null);
  };

  // 날짜 변경 처리
  const handleDateChange = (name, value) => {
    try {
      if (value && formData.stay_type) {
        const stayTypeSettings = settings[STAY_TYPE_MAP[formData.stay_type]];
        const selectedDate = new Date(value);
        const dayIndex = selectedDate.getDay();
        const availableDays = stayTypeSettings?.available_days?.split('') || [];

        if (availableDays[dayIndex] === '0') {
          throw new Error('선택하신 날짜는 예약이 불가능합니다.');
        }

        setFormData(prev => ({
          ...prev,
          [name]: value,
          check_in_time: stayTypeSettings?.check_in_time || '',
          check_out_time: stayTypeSettings?.check_out_time || ''
        }));
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

  // 사용 가능한 객실 조회
  useEffect(() => {
    const fetchAvailableRooms = async () => {
      if (formData.stay_type && formData.check_in_date && formData.check_out_date) {
        try {
          console.log('객실 조회 시작:', {
            stay_type: formData.stay_type,
            stay_type_backend: formData.stay_type_backend,
            check_in_date: formData.check_in_date,
            check_out_date: formData.check_out_date
          });

          const filteredRooms = await useReservationStore.getState().getAvailableRooms(
            formData.check_in_date,
            formData.check_out_date,
            formData.stay_type_backend
          );

          console.log('조회된 객실:', filteredRooms);
          setAvailableRooms(filteredRooms);
        } catch (error) {
          console.error('객실 조회 실패:', error);
          setError(error.message);
        }
      }
    };

    fetchAvailableRooms();
  }, [formData.stay_type, formData.check_in_date, formData.check_out_date]);

  // 상태 확인용 콘솔
  useEffect(() => {
    console.log("전체 객실:", rooms);
    console.log("현재 폼 데이터:", formData);
  }, [rooms, formData]);

  // 단계별 컨텐츠 렌더링
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <FormGroup>
              <Label>예약번호</Label>
              <Input
                name="reservation_number"
                value={formData.reservation_number}
                onChange={handleInputChange}
                placeholder="예약번호를 입력하세요"
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>예약자명</Label>
              <Input
                name="guest_name"
                value={formData.guest_name}
                onChange={handleInputChange}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>연락처</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="010-0000-0000"
                maxLength={13}
                required
              />
            </FormGroup>
            <FormGroup>
              <Label>예약 경로</Label>
              <Select
                name="booking_source"
                value={formData.booking_source}
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
                name="stay_type"
                value={formData.stay_type}
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
        return (
          <>
            <FormGroup>
              <Label>체크인 날짜</Label>
              <Input
                type="date"
                name="check_in_date"
                value={formData.check_in_date || ''}
                onChange={(e) => handleDateChange('check_in_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
              <TimeDisplay>
                체크인 시간: {formData.check_in_time || '시간을 확인하려면 숙박 유형을 선택하세요'}
              </TimeDisplay>
            </FormGroup>
            <FormGroup>
              <Label>체크아웃 날짜</Label>
              <Input
                type="date"
                name="check_out_date"
                value={formData.check_out_date || ''}
                onChange={(e) => handleDateChange('check_out_date', e.target.value)}
                min={formData.check_in_date || new Date().toISOString().split('T')[0]}
                required
              />
              <TimeDisplay>
                체크아웃 시간: {formData.check_out_time || '시간을 확인하려면 숙박 유형을 선택하세요'}
              </TimeDisplay>
            </FormGroup>
          </>
        );
      case 3:
        return (
          <>
            <FormGroup>
              <Label>객실 선택</Label>
              <Select
                name="room_id"
                value={formData.room_id || ''}
                onChange={handleInputChange}
                required
              >
                <option value="">선택해주세요</option>
                {availableRooms.map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_number}호
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup>
              <Label>커스텀 요금</Label>
              <RateContainer>
                <CustomRateCheckbox>
                  <input
                    type="checkbox"
                    name="custom_rate"
                    checked={formData.custom_rate}
                    onChange={handleInputChange}
                  />
                  <span>커스텀 요금 사용</span>
                </CustomRateCheckbox>
                {formData.custom_rate && (
                  <Input
                    type="number"
                    name="stay_type_rate"
                    value={formData.stay_type_rate}
                    onChange={handleInputChange}
                    placeholder="요금을 입력하세요"
                    required
                  />
                )}
              </RateContainer>
            </FormGroup>
            <FormGroup>
              <Label>메모</Label>
              <TextArea
                name="memo"
                value={formData.memo}
                onChange={handleInputChange}
                placeholder="메모를 입력하세요"
              />
            </FormGroup>
          </>
        );
    }
  };

  // 예약 저장
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      // 백엔드 타입으로 변환
      const reservationData = {
        ...formData,
        stay_type: STAY_TYPE_MAP[formData.stay_type]
      };

      console.log('예약 데이터:', reservationData);
      
      await useReservationStore.getState().createReservation(reservationData);
      onSave && onSave();
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 다음 단계로 이동
  const handleNext = async () => {
    try {
      if (step === 1) {
        // 기본 정보 검증
        const requiredFields = ['guest_name', 'phone', 'booking_source', 'stay_type'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
          throw new Error('모든 필수 항목을 입력해주세요.');
        }
      } else if (step === 2) {
        // 날짜 검증 및 가능한 객실 조회
        if (!formData.check_in_date || !formData.check_out_date) {
          throw new Error('체크인/아웃 날짜를 선택해주세요.');
        }

        const availableRooms = await useReservationStore.getState().getAvailableRooms({
          check_in_date: formData.check_in_date,
          check_out_date: formData.check_out_date,
          stay_type: formData.stay_type
        });

        setAvailableRooms(availableRooms);
      }

      setStep(prev => prev + 1);
    } catch (error) {
      setError(error.message);
    }
  };

  // 이전 단계로 이동
  const handleBack = () => {
    setStep(prev => prev - 1);
    setError(null);
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>예약 {step}/3</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <form onSubmit={e => e.preventDefault()}>
            {renderStepContent()}
            <ButtonGroup>
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
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? '저장 중...' : '저장'}
                </Button>
              )}
            </ButtonGroup>
          </form>
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
};

// Styled Components
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

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const TimeDisplay = styled.div`
  margin-top: 5px;
  color: #007bff;
  font-size: 0.9em;
`;

const RateContainer = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const CustomRateCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 20px;
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  resize: vertical;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  background-color: #fff3f3;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  text-align: center;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #495057;
  
  &:hover {
    color: #007bff;
  }
`;

export default ReservationModal;