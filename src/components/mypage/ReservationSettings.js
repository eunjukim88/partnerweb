import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Input } from '../common/FormComponents';
import useReservationSettingsStore, { stayTypeMap } from '../../store/reservationSettingsStore';

/**
 * 시간 선택 컴포넌트
 * @param {string} value - 선택된 시간 (형식: "오전/오후:HH:MM")
 * @param {function} onChange - 시간 변경 핸들러
 * @param {boolean} disabled - 비활성화 여부
 */
const TimeSelector = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // 10분 단위 배열 생성
  const minuteOptions = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));ㅡ

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref]);

  const handleSelect = (type, newValue) => {
    if (disabled) return;

    const [period, timeStr] = value.split(':');
    const [hour, minute] = timeStr.split(':');
    
    let updatedPeriod = period;
    let updatedHour = parseInt(hour);
    let updatedMinute = minute;

    switch (type) {
      case 'period':
        updatedPeriod = newValue;
        break;
      case 'hour':
        updatedHour = parseInt(newValue);
        updatedMinute = '00'; // 시간 선택 시 자동으로 00분 설정
        break;
      case 'minute':
        updatedMinute = newValue;
        break;
    }

    const newTime = `${updatedPeriod}:${updatedHour.toString().padStart(2, '0')}:${updatedMinute}`;
    onChange(newTime);
  };

  return (
    <TimeSelectorContainer ref={ref}>
      <TimeDisplay onClick={() => !disabled && setIsOpen(!isOpen)}>
        <FaClock />
        <span>{value}</span>
      </TimeDisplay>
      {isOpen && (
        <DropdownContainer>
          <DropdownColumn>
            {['오전', '오후'].map((p) => (
              <DropdownItem 
                key={p} 
                onClick={() => handleSelect('period', p)} 
                selected={p === value.split(':')[0]}
              >
                {p}
              </DropdownItem>
            ))}
          </DropdownColumn>
          <DropdownColumn>
            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((h) => (
              <DropdownItem 
                key={h} 
                onClick={() => handleSelect('hour', h)} 
                selected={h === value.split(':')[1]}
              >
                {h}
              </DropdownItem>
            ))}
          </DropdownColumn>
          <DropdownColumn>
            {minuteOptions.map((m) => (
              <DropdownItem 
                key={m} 
                onClick={() => handleSelect('minute', m)} 
                selected={m === value.split(':')[2]}
              >
                {m}
              </DropdownItem>
            ))}
          </DropdownColumn>
        </DropdownContainer>
      )}
    </TimeSelectorContainer>
  );
};

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
  /**
   * 24시간 형식을 12시간 형식으로 변환
   * @param {string} timeStr - "HH:MM" 형식의 시간
   * @returns {string} "오전/오후:HH:MM" 형식의 시간
   */
  const formatTimeToAmPm = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const period = hour >= 12 ? '오후' : '오전';
    
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    
    return `${period}:${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  /**
   * 시간 변경 핸들러
   * @param {string} field - 변경할 필드 (check_in_time/check_out_time)
   * @param {string} time - 새로운 시간 값
   */
  const handleTimeChange = (field, time) => {
    if (!isEditing) return;
    
    const [period, hour, minute] = time.split(':');
    let hours = parseInt(hour);
    if (period === '오후' && hours !== 12) hours += 12;
    if (period === '오전' && hours === 12) hours = 0;
    
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minute}`;
    onSettingsChange({
      ...settings,
      [field]: formattedTime
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

  /**
   * 요일 선택 처리
   * @param {string} day - 선택한 요일
   */
  const handleDaySelect = (day) => {
    if (!isEditing) return;

    const dayNumber = Object.entries(dayMapping).find(([_, value]) => value === day)[0];
    const currentDuration = settings.default_duration;
    const newDuration = currentDuration ^ (1 << (dayNumber - 1));

    onSettingsChange({
      ...settings,
      default_duration: newDuration
    });
  };

  if (!settings) return null;

  return (
    <SettingsContainer>
      <Section>
        <SectionTitle>예약 가능 요일</SectionTitle>
        <DayContainer>
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <DayButton
              key={day}
              type="button"
              onClick={() => handleDaySelect(day)}
              selected={getSelectedDays(settings.default_duration).includes(day)}
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
            <TimeSelector 
              value={formatTimeToAmPm(settings.check_in_time)}
              onChange={(time) => handleTimeChange('check_in_time', time)}
              disabled={!isEditing}
            />
          </InputGroup>
          <InputGroup>
            <Label>체크아웃</Label>
            <TimeSelector 
              value={formatTimeToAmPm(settings.check_out_time)}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
                disabled={!isEditing}
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
  // 로컬 상태
  const [activeTab, setActiveTab] = useState('대실');
  const [editingType, setEditingType] = useState(null);
  const [localSettings, setLocalSettings] = useState({});
  
  // store에서 상태와 액션 가져오기
  const { settings, isLoading, error, fetchSettings, updateSettings } = useReservationSettingsStore();

  // 초기 데이터 로드
  useEffect(() => {
    fetchSettings();
  }, []);

  // 전역 상태 변경 시 로컬 상태 업데이트
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  /**
   * 설정 변경 핸들러
   * @param {object} newSettings - 새로운 설정 데이터
   */
  const handleSettingsChange = (newSettings) => {
    const mappedType = stayTypeMap[activeTab];
    setLocalSettings(prev => ({
      ...prev,
      [mappedType]: {
        ...prev[mappedType],
        ...newSettings
      }
    }));
  };

  /**
   * 설정 저장 핸들러
   * @param {string} type - 숙박 유형 (대실/숙박/장기)
   */
  const handleSave = async (type) => {
    try {
      const mappedType = stayTypeMap[type];
      const currentSettings = localSettings[mappedType];
      
      if (!currentSettings) {
        throw new Error('현재 설정을 찾을 수 없습니다.');
      }

      await updateSettings(type, currentSettings);
      setEditingType(null);
      alert('설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다: ' + error.message);
    }
  };

  // 에러 상태 처리
  if (error) {
    return <div>에러 발생: {error}</div>;
  }

  return (
    <Container>
      <TabContainer>
        {['대실', '숙박', '장기'].map(tab => (
          <Tab 
            key={tab} 
            active={activeTab === tab} 
            onClick={() => !isLoading && setActiveTab(tab)}
          >
            {tab}
          </Tab>
        ))}
      </TabContainer>
      <SettingForm
        type={activeTab}
        settings={localSettings[stayTypeMap[activeTab]]}
        onSettingsChange={handleSettingsChange}
        onSave={() => handleSave(activeTab)}
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
  max-width: 1200px;
  margin: 0 auto;
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 30px;
`;

const Tab = styled.button`
  padding: 10px 20px;
  margin-bottom: 20px;
  border: none;
  background-color: ${props => props.active ? '#ffffff' : '#f5f5f5'};
  color: ${props => props.active ? '#3395FF' : '#808080'};
  font-weight: ${props => props.active ? '7800' : '400'};
  border-radius: 30px 30px 0px 0px;
  border-top: ${props => props.active ? '2px solid #3395FF' : 'none'};
  border-left: ${props => props.active ? '2px solid #3395FF' : 'none'};
  border-right: ${props => props.active ? '2px solid #3395FF' : 'none'};
  display: flex
  justify-content: center;
  align-items: center;
  cursor: pointer;
  width: 150px;
  height: 40px;
  font-weight: ${props => props.active ? '700' : '400'};
  font-size: 18px;
  transition: all 0.3s ease;
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
  padding: 0 20px;
  margin: 10px 0;
`;

const DayButton = styled.button`
  padding: 10px 15px;
  border: 2px solid ${props => props.selected ? theme.colors.primary : '#ddd'};
  border-radius: 4px;
  background-color: ${props => props.selected ? theme.colors.primary : 'white'};
  color: ${props => props.selected ? '#3395FF' : 'black'};
  cursor: ${props => !props.isEditing ? 'not-allowed' : 'pointer'};
  opacity: ${props => !props.isEditing ? 0.7 : 1};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => 
      props.isEditing 
        ? (props.selected ? theme.colors.primaryDark : '#f5f5f5')
        : props.selected ? theme.colors.primary : 'white'
    };
  }

  &:active {
    transform: ${props => props.isEditing && 'scale(0.98)'};
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

const TimeSelectorContainer = styled.div`
  position: relative;
  width: 100%;
`;

const TimeDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border: 1px solid #171f26;
  height: 50px;
  font-size: 18px;
  border-radius: 4px;
  cursor: pointer;
  background-color: transparent;

  &:hover {
    background-color: #E6F0FF;
  }
`;

const DropdownContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  background-color: #FFFFFF;
  width: 100%;
  border: 1px solid #171f26;
  border-radius: 4px;
  z-index: 10;
`;

const DropdownColumn = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
  width: 100%;
  text-align: center;

  &:last-child {
    border-right: none;
  }
`;

const DropdownItem = styled.div`
  padding: 5px 10px;
  cursor: pointer;
  background-color: ${props => props.selected ? '#3395FF' : '#FFFFFF'};
  color: ${props => props.selected ? theme.colors.buttonPrimary.text : theme.colors.text};

  &:hover {
    background-color: #E6F0FF;
  }
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
  display: flex;
  flex-direction: column;
  gap: 20px;
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

