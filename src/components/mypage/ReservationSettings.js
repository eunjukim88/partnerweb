import { useState, useRef, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { FaClock } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Input } from '../common/FormComponents';
import useReservationSettingsStore from '../../store/reservationSettingsStore';
import TimePicker from 'react-time-picker';
import 'react-time-picker/dist/TimePicker.css';
import 'react-clock/dist/Clock.css';

/**
 * 설정 폼 컴포넌트
 * @param {string} type - 숙박 유형 (대실/숙박/장기)
 * @param {object} settings - 현재 설정 데이터
 * @param {function} onSettingsChange - 설정 변경 핸들러
 * @param {function} onSave - 저장 핸들러
 * @param {boolean} isEditing - 수정 모드 여부
 * @param {function} onEdit - 수정 모드 전환 핸들러
 * @param {boolean} isLoading - 로딩 상태
 */
const SettingForm = ({ type, settings, onSettingsChange, onSave, isEditing, onEdit, isLoading }) => {
  const [localDays, setLocalDays] = useState('');

  useEffect(() => {
    if (settings?.available_days) {
      setLocalDays(settings.available_days);
    }
  }, [settings]);

  if (!settings) return null;

  const handleTimeChange = (field, time) => {
    if (!isEditing) return;
    
    onSettingsChange({
      ...settings,
      [field]: time
    });
  };

  /**
   * 요금 변경 핸들러
   * @param {string} field - 변경할 필드 (weekdayPrice/fridayPrice/weekendPrice)
   */
  const handlePriceChange = (field) => (e) => {
    let value = e.target.value.replace(/[^\d]/g, '');
    value = value ? parseInt(value) : 0;
    
    onSettingsChange({
      ...settings,
      [field === 'weekdayPrice' ? 'weekday_rate' : 
       field === 'fridayPrice' ? 'friday_rate' : 'weekend_rate']: value
    });
  };

  // 요일 선택 처리
  const handleDaySelect = (dayIndex) => {
    if (!isEditing) return;
    
    const dayArray = localDays.split('');
    dayArray[dayIndex] = dayArray[dayIndex] === '1' ? '0' : '1';
    const newDays = dayArray.join('');
    setLocalDays(newDays);
    
    onSettingsChange({
      ...settings,
      available_days: newDays,
      stay_type: type
    });
  };

  // 요일별 요금 입력 활성화 여부 확인
  const getPriceInputStatus = () => {
    if (!settings?.available_days) return { weekday: false, friday: false, weekend: false };
    
    const days = settings.available_days.split('');
    return {
      weekday: days.slice(1, 5).includes('1'),  // 월~목 중 하나라도 선택
      friday: days[5] === '1',                  // 금요일 선택
      weekend: days[6] === '1' || days[0] === '1'   // 토,일 중 하나라도 선택
    };
  };

  const priceStatus = getPriceInputStatus();

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>예약 가능 요일</SectionTitle>
        <DayContainer>
          {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
            <DayButton
              key={day}
              type="button"
              onClick={() => handleDaySelect(index)}
              selected={localDays[index] === '1'}
              disabled={!isEditing}
              isEditing={isEditing}
            >
              {day}
            </DayButton>
          ))}
        </DayContainer>
      </Section>
      <Section>
        <SectionTitle>{type} 예약 시간 설정</SectionTitle>
        <TimeContainer>
          <InputGroup>
            <Label>체크인</Label>
            <TimeInput 
              value={settings.check_in_time}
              onChange={(time) => handleTimeChange('check_in_time', time)}
              disabled={!isEditing}
            />
          </InputGroup>
          <InputGroup>
            <Label>체크아웃</Label>
            <TimeInput 
              value={settings.check_out_time}
              onChange={(time) => handleTimeChange('check_out_time', time)}
              disabled={!isEditing}
            />
          </InputGroup>
        </TimeContainer>
      </Section>

      <Section>
        <SectionTitle>{type} 요금 설정</SectionTitle>
        <PriceContainer>
          <InputGroup>
            <Label>평일 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.weekday_rate.toLocaleString()}
                onChange={handlePriceChange('weekdayPrice')}
                disabled={!isEditing || !priceStatus.weekday}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>

          <InputGroup>
            <Label>금요일 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.friday_rate.toLocaleString()}
                onChange={handlePriceChange('fridayPrice')}
                disabled={!isEditing || !priceStatus.friday}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>

          <InputGroup>
            <Label>주말 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.weekend_rate.toLocaleString()}
                onChange={handlePriceChange('weekendPrice')}
                disabled={!isEditing || !priceStatus.weekend}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>
        </PriceContainer>
      </Section>

      <ButtonContainer>
        {isEditing ? (
          <SaveButton onClick={onSave} disabled={isLoading}>
            저장
          </SaveButton>
        ) : (
          <EditButton onClick={onEdit} disabled={isLoading}>
            수정
          </EditButton>
        )}
      </ButtonContainer>
    </SettingsContainer>
  );
};

/**
 * 예약 설정 메인 컴포넌트
 * - 숙박 유형별 설정 관리 (대실/숙박/장기)
 * - 설정 조회/수정/저장 기능
 */
const ReservationSettings = () => {
  const [activeTab, setActiveTab] = useState('대실');
  const [editingType, setEditingType] = useState(null);
  const [localSettings, setLocalSettings] = useState({});
  const [initialized, setInitialized] = useState(false);
  
  const { settings, isLoading, error, fetchSettings, updateSettings, clearError } = useReservationSettingsStore();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        await fetchSettings();
        setInitialized(true);
      } catch (error) {
        console.error('설정 로드 실패:', error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingsChange = (newSettings) => {
    setLocalSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...newSettings
      }
    }));
  };

  const handleSave = async () => {
    try {
      const currentSettings = localSettings[activeTab];
      await updateSettings(activeTab, currentSettings);
      setEditingType(null);
      await fetchSettings(true); // 강제로 새로고침
    } catch (error) {
      console.error('설정 저장 실패:', error);
    }
  };

  // 로딩 상태 처리
  if (!initialized || isLoading) {
    return (
      <Container>
        <LoadingWrapper>데이터를 불러오는 중...</LoadingWrapper>
      </Container>
    );
  }

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>{error}</ErrorMessage>
        <RetryButton onClick={() => {
          clearError();
          fetchSettings(true);
        }}>
          다시 시도
        </RetryButton>
      </ErrorContainer>
    );
  }

  return (
    <Container>
      <TabContainer>
        {['대실', '숙박', '장기'].map(tab => (
          <TabButton
            key={tab}
            active={activeTab === tab}
            onClick={() => {
              setActiveTab(tab);
              setEditingType(null);
            }}
          >
            {tab}
          </TabButton>
        ))}
      </TabContainer>

      <SettingForm
        type={activeTab}
        settings={localSettings[activeTab]}
        onSettingsChange={handleSettingsChange}
        onSave={handleSave}
        isEditing={editingType === activeTab}
        onEdit={() => setEditingType(activeTab)}
        isLoading={isLoading}
      />
    </Container>
  );
};

export default ReservationSettings;

const Container = styled.div`
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 30px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  margin-right: 10px;
  border: none;
  background-color: ${props => props.active ? '#ffffff' : '#f5f5f5'};
  color: ${props => props.active ? '#3395FF' : '#808080'};
  font-weight: ${props => props.active ? '700' : '400'};
  border-radius: 8px 8px 0 0;
  border-bottom: ${props => props.active ? '2px solid #3395FF' : 'none'};
  cursor: pointer;
  width: 120px;
  height: 40px;
  font-size: 16px;
  transition: all 0.2s ease;

  &:last-child {
    margin-right: 0;
  }
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h3`
  font-size: 20px;
  color: ${theme.colors.text};
  margin-bottom: 20px;
`;
const DayContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 15px;
  padding: 20px;
  margin: 10px 0;
`;

const DayButton = styled.button`
  width: 45px;
  height: 45px;
  border: 1px solid ${props => props.selected ? theme.colors.primary : '#e0e0e0'};
  border-radius: 8px;
  background-color: ${props => {
    if (!props.isEditing) return '#f5f5f5';
    return props.selected ? theme.colors.primary : '#ffffff';
  }};
  color: ${props => {
    if (!props.isEditing) return '#999';
    return props.selected ? '#ffffff' : '#666';
  }};
  font-size: 15px;
  font-weight: ${props => props.selected ? '600' : '400'};
  cursor: ${props => !props.isEditing ? 'not-allowed' : 'pointer'};
  opacity: ${props => !props.isEditing ? 0.7 : 1};
  transition: all 0.2s ease;
  box-shadow: ${props => props.selected ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;

  &:hover {
    background-color: ${props => {
      if (!props.isEditing) return props.selected ? theme.colors.primary : '#f5f5f5';
      return props.selected ? theme.colors.primaryDark : '#f8f8f8';
    }};
    transform: ${props => props.isEditing && 'translateY(-1px)'};
    box-shadow: ${props => props.isEditing && '0 4px 6px rgba(0, 0, 0, 0.1)'};
  }

  &:active {
    transform: ${props => props.isEditing && 'translateY(1px)'};
    box-shadow: ${props => props.isEditing && '0 1px 2px rgba(0, 0, 0, 0.1)'};
  }
`;

const TimeContainer = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`;

const PriceContainer = styled.div`
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
`;

const Label = styled.label`
  margin-bottom: 10px;
  color: ${theme.colors.text};
`;

const PriceInputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  background-color: ${props => props.disabled ? '#f5f5f5' : '#fff'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'text'};

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const PriceUnit = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.text};
`;

const SettingsContainer = styled.div`
  padding: 20px;
  background-color: #ffffff;
  border-radius: 0 8px 8px 8px;
  border: 1px solid #e0e0e0;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
`;

const SaveButton = styled(Button)`
  padding: 10px 30px;
  background-color: #3395FF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 160px;

  &:hover {
    background-color: ${theme.colors.primaryDark};
  }
`;

const EditButton = styled(Button)`
  padding: 10px 30px;
  background-color: ${theme.colors.secondary};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  width: 160px;

  &:hover {
    background-color: ${theme.colors.secondaryDark};
  }
`;

const StyledTimePicker = styled(TimePicker)`
  &.react-time-picker {
    width: 100%;
    position: relative;
  }

  .react-time-picker__wrapper {
    border: none;
    background: transparent;
  }

  .react-time-picker__clock {
    display: none;
  }

  .react-time-picker__inputGroup {
    pointer-events: none;
  }

  /* 드롭다운 메뉴 스타일링 */
  .react-time-picker__dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    width: 200px;
    background: white;
    border: 1px solid #DDE2E5;
    border-radius: 5px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    padding: 8px;
    margin-top: 4px;

    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  /* 시간/분 옵션 스타일링 */
  .react-time-picker__option {
    padding: 4px 8px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;

    &:hover {
      background-color: ${theme.colors.background};
    }

    &--selected {
      background-color: ${theme.colors.primary};
      color: white;
    }
  }
`;

const TimeInput = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // 시간과 분을 분리
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['00', '00'];

  // 시간 션 (00~23)
  const hourOptions = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => 
      i.toString().padStart(2, '0')
    );
  }, []);

  // 분 옵션 (00, 10, 20, ..., 50)
  const minuteOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => 
      (i * 10).toString().padStart(2, '0')
    );
  }, []);

  // 시간 선택 처리
  const handleTimeSelect = (newHour, newMinute) => {
    // HH:mm 형식으로 변환하여 전달
    const formattedTime = `${newHour.padStart(2, '0')}:${(newMinute || selectedMinute).padStart(2, '0')}`;
    onChange(formattedTime);
    setIsOpen(false);
  };

  return (
    <TimeInputContainer ref={ref}>
      <TimeDisplay 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        {value || '00:00'}
        <TimeIcon disabled={disabled} />
      </TimeDisplay>
      
      {isOpen && !disabled && (
        <DropdownContainer>
          <DropdownColumn>
            <ColumnHeader>시</ColumnHeader>
            {hourOptions.map((hour) => (
              <DropdownItem
                key={hour}
                selected={hour === selectedHour}
                onClick={() => handleTimeSelect(hour, selectedMinute)}
              >
                {hour}
              </DropdownItem>
            ))}
          </DropdownColumn>
          <ColumnDivider />
          <DropdownColumn>
            <ColumnHeader>분</ColumnHeader>
            {minuteOptions.map((minute) => (
              <DropdownItem
                key={minute}
                selected={minute === selectedMinute}
                onClick={() => handleTimeSelect(selectedHour, minute)}
              >
                {minute}
              </DropdownItem>
            ))}
          </DropdownColumn>
        </DropdownContainer>
      )}
    </TimeInputContainer>
  );
};

// 스타일 컴포넌트들
const TimeInputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  height: 40px;
  border: 1px solid ${props => props.disabled ? '#E0E1E1' : '#DDE2E5'};
  border-radius: 4px;
  background: ${props => props.disabled ? '#F5F5F5' : '#FFFFFF'};
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  display: flex;
  background: white;
  border: 1px solid #DDE2E5;
  border-radius: 4px;
  margin-top: 4px;
  z-index: 1000;
`;

const ColumnHeader = styled.div`
  padding: 8px;
  font-weight: bold;
  border-bottom: 1px solid #DDE2E5;
  text-align: center;
`;

const DropdownColumn = styled.div`
  flex: 1;
  max-height: 200px;
  overflow-y: auto;
`;

const ColumnDivider = styled.div`
  width: 1px;
  background: #DDE2E5;
`;

const DropdownItem = styled.div`
  padding: 8px;
  text-align: center;
  cursor: pointer;
  background: ${props => props.selected ? '#E6F0FF' : 'transparent'};

  &:hover {
    background: #F5F5F5;
  }
`;

const TimeIcon = styled(FaClock)`
  color: ${props => props.disabled ? '#6E7881' : theme.colors.primary};
  font-size: 16px;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  margin-bottom: 15px;
`;

const RetryButton = styled(Button)`
  background-color: #3395FF;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  
  &:hover {
    background-color: #2678d9;
  }
`;

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
`;

