import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Input } from '../common/FormComponents';
import axios from 'axios';

// formatTimeToAmPm 함수 추가
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

// 커스텀 시간 선택 컴포넌트
const TimeSelector = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

  // 10분 단위 배열 생성
  const minuteOptions = Array.from({ length: 6 }, (_, i) => (i * 10).toString().padStart(2, '0'));

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

const SettingForm = ({ type, settings, onSettingsChange, onSave, isEditing, onEdit }) => {
  console.log('SettingForm render:', { type, settings, isEditing });

  const handleDaySelect = (day) => {
    if (!isEditing) {
      console.log('Day selection blocked: not in edit mode');
      return;
    }

    const currentDays = settings.selectedDays || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => {
          const order = ['월', '화', '수', '목', '금', '토', '일'];
          return order.indexOf(a) - order.indexOf(b);
        });

    console.log('Day selection:', {
      day,
      currentDays,
      newDays,
      isEditing
    });

    onSettingsChange({
      ...settings,
      selectedDays: newDays
    });
  };

  const handlePriceChange = (field) => (e) => {
    let value = e.target.value;
    
    // 숫자만 추출
    const numericValue = value.replace(/[^\d]/g, '');
    
    // 숫자가 있는 경우에만 포맷팅
    if (numericValue) {
      // 천단위 콤마 추가
      value = Number(numericValue).toLocaleString('ko-KR');
    } else {
      value = '';
    }

    onSettingsChange({
      ...settings,
      [field]: value
    });
  };

  // 요일 선택 여부에 따른 가격 입력 활성화 상태 계산
  const isWeekdayEnabled = ['월', '화', '수', '목'].some(day => settings.selectedDays.includes(day));
  const isFridayEnabled = settings.selectedDays.includes('금');
  const isWeekendEnabled = settings.selectedDays.includes('토') || settings.selectedDays.includes('일');

  // 요일 선택 상태에 따라 가격 자동 설정
  useEffect(() => {
    const newSettings = { ...settings };
    if (!isWeekdayEnabled) newSettings.weekdayPrice = '0';
    if (!isFridayEnabled) newSettings.fridayPrice = '0';
    if (!isWeekendEnabled) newSettings.weekendPrice = '0';
    onSettingsChange(newSettings);
  }, [settings.selectedDays]);

  const validateSettings = () => {
    // 선택된 요일에 대한 요금 검증
    if (isWeekdayEnabled && parseInt(settings.weekdayPrice.replace(/,/g, '')) === 0) {
      alert('평일(월~목) 이용금액을 작성해주세요.');
      return false;
    }
    
    if (isFridayEnabled && parseInt(settings.fridayPrice.replace(/,/g, '')) === 0) {
      alert('금요일 이용금액을 작성해주세요.');
      return false;
    }
    
    if (isWeekendEnabled && parseInt(settings.weekendPrice.replace(/,/g, '')) === 0) {
      alert('주말 이용금액을 작성해주세요.');
      return false;
    }

    return true;
  };

  const handleSaveClick = async () => {
    if (!validateSettings()) {
      return;
    }

    try {
      await onSave();
      // 저장 성공 시 알림 제거 (기존 API에서 이미 알림을 보여주므로)
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    }
  };

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
              selected={settings.selectedDays?.includes(day)}
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
              value={settings.checkInTime}
              onChange={(time) => isEditing && onSettingsChange({ ...settings, checkInTime: time })}
              disabled={!isEditing}
            />
          </InputGroup>
          <InputGroup>
            <Label>체크아웃</Label>
            <TimeSelector 
              value={settings.checkOutTime}
              onChange={(time) => isEditing && onSettingsChange({ ...settings, checkOutTime: time })}
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
                value={settings.weekdayPrice}
                onChange={handlePriceChange('weekdayPrice')}
                disabled={!isEditing || !isWeekdayEnabled}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>

          <InputGroup>
            <Label>금요일 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.fridayPrice}
                onChange={handlePriceChange('fridayPrice')}
                disabled={!isEditing || !isFridayEnabled}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>

          <InputGroup>
            <Label>주말 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.weekendPrice}
                onChange={handlePriceChange('weekendPrice')}
                disabled={!isEditing || !isWeekendEnabled}
              />
              <PriceUnit>원</PriceUnit>
            </PriceInputWrapper>
          </InputGroup>
        </PriceContainer>
      </Section>

      <ButtonContainer>
        {isEditing ? (
          <SaveButton onClick={handleSaveClick}>저장하기</SaveButton>
        ) : (
          <EditButton onClick={() => onEdit(type)}>수정하기</EditButton>
        )}
      </ButtonContainer>
    </SettingsContainer>
  );
};

// 상수 정의
const stayTypeMap = {
  '대실': 'hourly',
  '숙박': 'nightly',
  '장기': 'longTerm'
};

const ReservationSettings = () => {
  const [activeTab, setActiveTab] = useState('대실');
  const [editingType, setEditingType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    hourly: {
      selectedDays: [],
      checkInTime: '오전:11:00',
      checkOutTime: '오후:04:00',
      weekdayPrice: '0',
      fridayPrice: '0',
      weekendPrice: '0'
    },
    nightly: {
      selectedDays: [],
      checkInTime: '오후:03:00',
      checkOutTime: '오전:11:00',
      weekdayPrice: '0',
      fridayPrice: '0',
      weekendPrice: '0'
    },
    longTerm: {
      selectedDays: [],
      checkInTime: '오후:03:00',
      checkOutTime: '오전:11:00',
      weekdayPrice: '0',
      fridayPrice: '0',
      weekendPrice: '0'
    }
  });

  // 시간 변환 함수 수정
  const convertTimeFormat = (timeStr) => {
    console.log('Converting time:', timeStr); // 디버깅용

    if (!timeStr || typeof timeStr !== 'string') {
      console.error('Invalid time string:', timeStr);
      return '00:00:00';
    }

    try {
      // "오전:11:00" 형식 처리
      const parts = timeStr.split(':');
      console.log('Time parts:', parts); // 디버깅용

      const period = parts[0]; // '오전' 또는 '오후'
      const hour = parseInt(parts[1]); // 시간
      const minute = parseInt(parts[2]); // 분

      if (isNaN(hour) || isNaN(minute)) {
        throw new Error(`Invalid time format: ${timeStr}`);
      }

      let hours = hour;
      if (period === '오후' && hours !== 12) {
        hours += 12;
      } else if (period === '오전' && hours === 12) {
        hours = 0;
      }

      const formattedTime = `${String(hours).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
      console.log('Formatted time:', formattedTime); // 디버깅용
      return formattedTime;
    } catch (error) {
      console.error('Time conversion error:', error);
      return '00:00:00';
    }
  };

  const handleSave = async (type) => {
    try {
      const mappedType = stayTypeMap[type];
      console.log('Current type:', type, 'Mapped type:', mappedType);

      const currentSettings = settings[mappedType];
      console.log('Current settings:', currentSettings);

      if (!currentSettings) {
        throw new Error('설정을 찾을 수 없습니다.');
      }

      // 시간 데이터 검증 및 변환
      const checkInTime = currentSettings.checkInTime;
      const checkOutTime = currentSettings.checkOutTime;

      console.log('Raw times:', { checkInTime, checkOutTime });

      if (!checkInTime || !checkOutTime) {
        throw new Error('체크인/체크아웃 시간이 설정되지 않았습니다.');
      }

      const formattedCheckInTime = convertTimeFormat(checkInTime);
      const formattedCheckOutTime = convertTimeFormat(checkOutTime);

      console.log('Formatted times:', {
        formattedCheckInTime,
        formattedCheckOutTime
      });

      // 요일 변환
      const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
      const availableDays = currentSettings.selectedDays.map(day => dayMap[day]).sort((a, b) => a - b);

      const requestData = {
        stay_type: mappedType,
        available_days: availableDays,
        check_in_time: formattedCheckInTime,
        check_out_time: formattedCheckOutTime,
        base_rate: {
          weekday: parseInt(currentSettings.weekdayPrice.replace(/[,원]/g, '')) || 0,
          friday: parseInt(currentSettings.fridayPrice.replace(/[,원]/g, '')) || 0,
          weekend: parseInt(currentSettings.weekendPrice.replace(/[,원]/g, '')) || 0
        }
      };

      console.log('Final request data:', requestData);

      const response = await fetch('/api/mypage/reservation-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const responseData = await response.json();
      console.log('Response:', response.status, responseData);

      if (!response.ok) {
        throw new Error(responseData.error || '설정 저장에 실패했습니다.');
      }

      alert('설정이 성공적으로 저장되었습니다.');
      setEditingType(null);
      fetchSettings();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다: ' + error.message);
    }
  };

  // fetchSettings 함수도 수정
  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/mypage/reservation-settings');
      
      if (!response.ok) {
        throw new Error('설정을 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      
      // 설정 데이터 초기화
      const formattedSettings = {
        hourly: {
          id: null,
          selectedDays: [],
          checkInTime: '오전:11:00',
          checkOutTime: '오후:04:00',
          weekdayPrice: '0',
          fridayPrice: '0',
          weekendPrice: '0',
          created_at: null,
          updated_at: null
        },
        nightly: {
          id: null,
          selectedDays: [],
          checkInTime: '오후:03:00',
          checkOutTime: '오전:11:00',
          weekdayPrice: '0',
          fridayPrice: '0',
          weekendPrice: '0',
          created_at: null,
          updated_at: null
        },
        longTerm: {
          id: null,
          selectedDays: [],
          checkInTime: '오후:03:00',
          checkOutTime: '오전:11:00',
          weekdayPrice: '0',
          fridayPrice: '0',
          weekendPrice: '0',
          created_at: null,
          updated_at: null
        }
      };

      // 서버에서 받은 데이터로 설정 업데이트
      if (Array.isArray(data)) {
        data.forEach(item => {
          const dayMap = {1:'월', 2:'화', 3:'수', 4:'목', 5:'금', 6:'토', 7:'일'};
          const type = item.stay_type;

          if (formattedSettings[type]) {
            formattedSettings[type] = {
              id: item.id,
              selectedDays: Array.isArray(item.available_days) 
                ? item.available_days.map(day => dayMap[day])
                : [],
              checkInTime: formatTimeToAmPm(item.check_in_time),
              checkOutTime: formatTimeToAmPm(item.check_out_time),
              weekdayPrice: item.base_rate?.weekday?.toLocaleString() || '0',
              fridayPrice: item.base_rate?.friday?.toLocaleString() || '0',
              weekendPrice: item.base_rate?.weekend?.toLocaleString() || '0',
              created_at: item.created_at,
              updated_at: item.updated_at
            };
          }
        });
      }
      
      setSettings(formattedSettings);
    } catch (error) {
      console.error('설정 로딩 실패:', error);
      alert('설정을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 설정 데이터 로딩
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/mypage/reservation-settings');
        console.log('API Response:', response.data);

        if (response.data) {
          const formattedSettings = { ...settings };
          
          response.data.forEach(item => {
            const dayMap = {1:'월', 2:'화', 3:'수', 4:'목', 5:'금', 6:'토', 7:'일'};
            const mappedType = stayTypeMap[item.stay_type] || item.stay_type;

            if (mappedType && formattedSettings[mappedType]) {
              formattedSettings[mappedType] = {
                selectedDays: Array.isArray(item.available_days) 
                  ? item.available_days.map(day => dayMap[day])
                  : [],
                checkInTime: formatTimeToAmPm(item.check_in_time) || formattedSettings[mappedType].checkInTime,
                checkOutTime: formatTimeToAmPm(item.check_out_time) || formattedSettings[mappedType].checkOutTime,
                weekdayPrice: item.base_rate?.weekday?.toLocaleString() || '0',
                fridayPrice: item.base_rate?.friday?.toLocaleString() || '0',
                weekendPrice: item.base_rate?.weekend?.toLocaleString() || '0'
              };
            }
          });
          
          console.log('Formatted Settings:', formattedSettings);
          setSettings(formattedSettings);
        }
      } catch (error) {
        console.error('설정 로딩 실패:', error);
        alert('설정을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정 변경 처리
  const handleSettingsChange = (type, newSettings) => {
    if (isLoading) return;

    const mappedType = {
      '대실': 'hourly',
      '숙박': 'nightly',
      '장기': 'longTerm'
    }[type];

    if (!mappedType) {
      console.error('Invalid type:', type);
      return;
    }

    setSettings(prev => {
      const updated = {
        ...prev,
        [mappedType]: {
          ...prev[mappedType],
          ...newSettings
        }
      };
      console.log('Updated settings:', updated);
      return updated;
    });
  };

  // 수정 모드 시작 수
  const handleEdit = (type) => {
    setEditingType(type);
  };

  // 로딩 중 표시
  if (isLoading) {
    return <div>설정을 불러오는 중...</div>;
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
        settings={settings[stayTypeMap[activeTab]]}
        onSettingsChange={(newSettings) => handleSettingsChange(activeTab, newSettings)}
        onSave={() => handleSave(activeTab)}
        isEditing={editingType === activeTab}
        onEdit={() => handleEdit(activeTab)}
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

