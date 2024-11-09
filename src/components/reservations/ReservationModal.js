import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Select, Input } from '../common/FormComponents';
import { FaTimes } from 'react-icons/fa';
import { BOOKING_SOURCES, STAY_TYPES, DAYS_OF_WEEK } from '../../constants/reservation';
import useReservationStore from '../../store/reservationStore';
import useReservationSettingsStore from '../../store/reservationSettingsStore';
import useRoomStore from '../../store/roomStore';
import PropTypes from 'prop-types';

const ReservationModal = ({ isEdit = false, initialData = null, onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [formData, setFormData] = useState({
    reservation_number: initialData?.reservation_number || '',
    guest_name: initialData?.guest_name || '',
    phone: initialData?.phone || '',
    booking_source: initialData?.booking_source || '',
    stay_type: initialData?.stay_type || '',
    check_in_date: initialData?.check_in_date ? new Date(initialData.check_in_date) : null,
    check_out_date: initialData?.check_out_date ? new Date(initialData.check_out_date) : null,
    check_in_time: initialData?.check_in_time || '',
    check_out_time: initialData?.check_out_time || '',
    room_id: initialData?.room_id || null,
    rate_amount: initialData?.rate_amount || '',
    memo: initialData?.memo || ''
  });

  const reservationStore = useReservationStore();
  const { settings } = useReservationSettingsStore();
  const { rooms } = useRoomStore();

  // 전화번호 포맷팅 함수
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 숙박 유형 변경 핸들러
  const handleStayTypeChange = (value) => {
    const settings = useReservationSettingsStore.getState().settings;
    const stayTypeSettings = settings[value];
    
    setFormData(prev => ({
      ...prev,
      stay_type: value,
      room_id: null,
      rate_amount: null,
      check_in_date: null,
      check_out_date: null,
      check_in_time: stayTypeSettings.check_in_time,  // 기본 시간 설정
      check_out_time: stayTypeSettings.check_out_time  // 기본 시간 설정
    }));
  };

  // 입력값 변경 처리
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'stay_type') {
      handleStayTypeChange(value);
    } else if (name === 'room_id') {
      handleRoomSelect(e);
    } else if (name === 'phone') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null);
  };

  // fetchAvailableRooms 함수 추가
  const fetchAvailableRooms = async () => {
    if (formData.stay_type && formData.check_in_date && formData.check_out_date) {
      try {
        const rooms = await reservationStore.getAvailableRooms(
          formData.check_in_date,
          formData.check_out_date,
          formData.stay_type
        );
        setAvailableRooms(rooms);
      } catch (error) {
        setError(error.message);
      }
    }
  };

  // 날짜 변경 핸들러 수정
  const handleDateChange = (field, date) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: date
      };

      // 숙박 유형과 체크인/아웃 날짜가 모두 있을 때만 객실 조회
      if (newData.stay_type && newData.check_in_date && newData.check_out_date) {
        fetchAvailableRooms();
      }

      return newData;
    });
  };

  // 객실 선택 핸들러
  const handleRoomSelect = (e) => {
    const selectedRoomId = parseInt(e.target.value);
    
    if (!selectedRoomId || !formData.check_in_date || !formData.check_out_date || !formData.stay_type) {
      console.log('필수 데이터 누락:', { 
        selectedRoomId, 
        checkIn: formData.check_in_date,
        checkOut: formData.check_out_date,
        stayType: formData.stay_type 
      });
      return;
    }

    try {
      // 숙박 일수 계산
      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      const days = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      // 1일 기준 요금 계산
      const dailyRate = reservationStore.calculateRate(
        formData.check_in_date,
        formData.stay_type,
        selectedRoomId
      );

      // 총 숙박 요금 계산
      const totalRate = dailyRate * days;

      setFormData(prev => ({
        ...prev,
        room_id: selectedRoomId,
        rate_amount: totalRate
      }));
    } catch (error) {
      console.error('요금 계산 실패:', error);
      setError(error.message);
    }
  };

  // 커스텀 요금 체크박스 핸들러
  const handleCustomRateChange = (e) => {
    const isCustom = e.target.checked;
    setFormData(prev => ({
      ...prev,
      custom_rate: isCustom,
      rate_amount: isCustom ? null : 
        reservationStore.calculateRate(
          prev.check_in_date, 
          prev.stay_type, 
          prev.room_id
        )
    }));
  };

  // 커스텀 요금 입력 핸들러
  const handleCustomRateInput = (e) => {
    const value = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      rate_amount: value
    }));
  };

  // 상태 확인용 콘솔
  useEffect(() => {
    console.log("전체 객실:", rooms);
    console.log("현재 폼 데이터:", formData);
  }, [rooms, formData]);

  // 객실 정보 표시 형식 함수 추가
  const formatRoomLabel = (room) => {
    const parts = [];
    parts.push(`${room.room_number}호`);
    
    if (room.room_floor) parts.push(`${room.room_floor}층`);
    if (room.room_building) parts.push(room.room_building);
    if (room.room_name) parts.push(room.room_name);
    if (room.room_type) parts.push(room.room_type);
    
    return parts.join(' ');
  };

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
                {STAY_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
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
                {availableRooms
                  .sort((a, b) => a.room_id - b.room_id) // room_id 기준으로 정렬
                  .map(room => (
                    <option key={room.room_id} value={room.room_id}>
                      {formatRoomLabel(room)}
                    </option>
                ))}
              </Select>
            </FormGroup>
            {formData.room_id && (
              <FormGroup>
                <Label>요금</Label>
                {formData.custom_rate ? (
                  <Input
                    type="number"
                    value={formData.rate_amount || ''}
                    onChange={handleCustomRateInput}
                    placeholder="요금을 입력하세요"
                  />
                ) : (
                  <Input
                    type="text"
                    value={formData.rate_amount || '자동 계산된 요금이 표시됩니다'}
                    disabled
                  />
                )}
                <CustomRateCheckbox>
                  <input
                    type="checkbox"
                    checked={formData.custom_rate}
                    onChange={handleCustomRateChange}
                  />
                  <span>커스텀 요금 사용</span>
                </CustomRateCheckbox>
              </FormGroup>
            )}
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
  const handleSave = async () => {
    try {
      // 날짜 데이터 변환
      const formattedData = {
        ...formData,
        check_in_date: formData.check_in_date instanceof Date 
          ? formData.check_in_date.toISOString().split('T')[0]
          : formData.check_in_date,
        check_out_date: formData.check_out_date instanceof Date 
          ? formData.check_out_date.toISOString().split('T')[0]
          : formData.check_out_date,
        check_in_time: formData.check_in_time || null,
        check_out_time: formData.check_out_time || null,
        rate_amount: parseInt(formData.rate_amount) || 0
      };

      if (isEdit) {
        if (!initialData.reservation_id) {
          throw new Error('예약 ID가 없습니다.');
        }
        await reservationStore.updateReservation(
          initialData.reservation_id,
          formattedData
        );
      } else {
        await reservationStore.createReservation(formattedData);
      }
      await onSave?.();
      onClose();
    } catch (error) {
      console.error('저장 실패:', error);
      setError(error.message);
    }
  };

  // 다음 단계로 이동
  const handleNext = async () => {
    try {
      if (step === 1) {
        // 기본 정보 검증
        const requiredFields = ['reservation_number', 'guest_name', 'phone', 'booking_source', 'stay_type'];
        const missingFields = requiredFields.filter(field => !formData[field]);
        if (missingFields.length > 0) {
          throw new Error('모든 필수 항목을 입력해주세요.');
        }
      } else if (step === 2) {
        // 날짜 검증 및 가능한 객실 조회
        if (!formData.check_in_date || !formData.check_out_date) {
          throw new Error('체크인/아웃 날짜를 선택해주세요.');
        }

        const rooms = await reservationStore.getAvailableRooms(
          formData.check_in_date,
          formData.check_out_date,
          formData.stay_type
        );
        setAvailableRooms(rooms);
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

  useEffect(() => {
    console.log('Current Settings:', settings);
  }, [settings]);

  // settings가 없을 때의 처리
  if (!settings) {
    return (
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <h2>예약 등록</h2>
            <CloseButton onClick={onClose}><FaTimes /></CloseButton>
          </ModalHeader>
          <ModalBody>
            <div>설정을 불러오는 중입니다...</div>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  }

  // 초기 데이터 유효성 검사
  useEffect(() => {
    if (isEdit && !initialData?.reservation_id) {
      console.error('Edit mode requires reservation_id in initialData');
    }
  }, [isEdit, initialData]);

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
                  onClick={handleSave}
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

// PropTypes 추가 (선택사항)
ReservationModal.propTypes = {
  isEdit: PropTypes.bool,
  initialData: PropTypes.shape({
    reservation_id: PropTypes.number,
    reservation_number: PropTypes.string,
    guest_name: PropTypes.string,
    phone: PropTypes.string,
    booking_source: PropTypes.string,
    stay_type: PropTypes.string,
    check_in_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    check_out_date: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    check_in_time: PropTypes.string,
    check_out_time: PropTypes.string,
    room_id: PropTypes.number,
    rate_amount: PropTypes.number,
    memo: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default ReservationModal;