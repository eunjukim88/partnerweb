import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaClock } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Input } from '../common/FormComponents';

// 커스텀 시간 선택 컴포넌트
const TimeSelector = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef();

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
    const [period, hour, minute] = value.split(':');
    let updatedHour = parseInt(hour);
    let updatedPeriod = period;

    if (type === 'period') {
      updatedPeriod = newValue;
      if (newValue === '오후' && updatedHour !== 12) {
        updatedHour += 12;
      } else if (newValue === '오전' && updatedHour === 12) {
        updatedHour = 0;
      }
    } else if (type === 'hour') {
      updatedHour = parseInt(newValue);
      if (period === '오후' && updatedHour !== 12) {
        updatedHour += 12;
      }
    }

    const newTime = `${updatedPeriod}:${updatedHour.toString().padStart(2, '0')}:${type === 'minute' ? newValue : minute}`;
    onChange(newTime);
    // 여기서 setIsOpen(false)를 제거합니다.
  };

  return (
    <TimeSelectorContainer ref={ref}>
      <TimeDisplay onClick={() => setIsOpen(!isOpen)}>
        <FaClock />
        <span>{value}</span>
      </TimeDisplay>
      {isOpen && (
        <DropdownContainer>
          <DropdownColumn>
            {['오전', '오후'].map((p) => (
              <DropdownItem key={p} onClick={() => handleSelect('period', p)} selected={p === value.split(':')[0]}>
                {p}
              </DropdownItem>
            ))}
          </DropdownColumn>
          <DropdownColumn>
            {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map((h) => (
              <DropdownItem key={h} onClick={() => handleSelect('hour', h)} selected={h === value.split(':')[1]}>
                {h}
              </DropdownItem>
            ))}
          </DropdownColumn>
          <DropdownColumn>
            {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((m) => (
              <DropdownItem key={m} onClick={() => handleSelect('minute', m)} selected={m === value.split(':')[2]}>
                {m}
              </DropdownItem>
            ))}
          </DropdownColumn>
        </DropdownContainer>
      )}
    </TimeSelectorContainer>
  );
};

const SettingForm = ({ type, settings, onSettingsChange }) => {
  const toggleDaySelection = (day) => {
    const updatedDays = settings.selectedDays.includes(day)
      ? settings.selectedDays.filter(d => d !== day)
      : [...settings.selectedDays, day];
    onSettingsChange({ ...settings, selectedDays: updatedDays });
  };

  const handlePriceChange = (priceType) => (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '');
    const formattedPrice = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    onSettingsChange({ ...settings, [priceType]: formattedPrice });
  };

  return (
    <>
      <Section>
        <SectionTitle>{type} 예약 가능 요일</SectionTitle>
        <DayContainer>
          {['월', '화', '수', '목', '금', '토', '일'].map(day => (
            <DayButton
              key={day}
              selected={settings.selectedDays.includes(day)}
              onClick={() => toggleDaySelection(day)}
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
              onChange={(time) => onSettingsChange({ ...settings, checkInTime: time
               })} 
            />
          </InputGroup>
          <InputGroup>
            <Label>체크아웃</Label>
            <TimeSelector 
              value={settings.checkOutTime} 
              onChange={(time) => onSettingsChange({ ...settings, checkOutTime: time })} 
            />
          </InputGroup>
        </TimeContainer>
      </Section>

      <Section>
        <SectionTitle>{type} 기본 요금 설정</SectionTitle>
        <PriceContainer>
          <InputGroup>
            <Label>평일 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.weekdayPrice}
                onChange={handlePriceChange('weekdayPrice')}
                placeholder="0"
              />
              {settings.weekdayPrice && <PriceUnit>원</PriceUnit>}
            </PriceInputWrapper>
          </InputGroup>
          <InputGroup>
            <Label>금요일 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.fridayPrice}
                onChange={handlePriceChange('fridayPrice')}
                placeholder="0"
              />
              {settings.fridayPrice && <PriceUnit>원</PriceUnit>}
            </PriceInputWrapper>
          </InputGroup>
          <InputGroup>
            <Label>주말 요금</Label>
            <PriceInputWrapper>
              <StyledInput
                type="text"
                value={settings.weekendPrice}
                onChange={handlePriceChange('weekendPrice')}
                placeholder="0"
              />
              {settings.weekendPrice && <PriceUnit>원</PriceUnit>}
            </PriceInputWrapper>
          </InputGroup>
        </PriceContainer>
      </Section>
    </>
  );
};

const ReservationSettings = () => {
  const [activeTab, setActiveTab] = useState('대실설정');
  const [daesilSettings, setDaesilSettings] = useState({
    selectedDays: [],
    checkInTime: '오전:09:00',
    checkOutTime: '오후:06:00',
    weekdayPrice: '',
    fridayPrice: '',
    weekendPrice: ''
  });
  const [sukbakSettings, setSukbakSettings] = useState({
    selectedDays: [],
    checkInTime: '오후:03:00',
    checkOutTime: '오전:11:00',
    weekdayPrice: '',
    fridayPrice: '',
    weekendPrice: ''
  });
  const [janggiSettings, setJanggiSettings] = useState({
    selectedDays: [],
    checkInTime: '오후:03:00',
    checkOutTime: '오전:11:00',
    weekdayPrice: '',
    fridayPrice: '',
    weekendPrice: ''
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case '대실설정':
        return <SettingForm type="대실" settings={daesilSettings} onSettingsChange={setDaesilSettings} />;
      case '숙박설정':
        return <SettingForm type="숙박" settings={sukbakSettings} onSettingsChange={setSukbakSettings} />;
      case '장기설정':
        return <SettingForm type="장기" settings={janggiSettings} onSettingsChange={setJanggiSettings} />;
      default:
        return null;
    }
  };

  return (
    <Container>
      <TabContainer>
        {['대실설정', '숙박설정', '장기설정'].map(tab => (
          <Tab key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
            {tab}
          </Tab>
        ))}
      </TabContainer>
      {renderTabContent()}
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
  width: 100%;
  gap: 15px;
`;

const DayButton = styled(Button)`
  width: 80px;
  height: 40px;
  background-color: ${props => props.selected ? '#3395FF' : '#f4f4f4'};
  color: ${props => props.selected ? '#FFFFFF' : '#171f26'};
  border-radius: 4px;
  font-weight: ${props => props.selected ? '700' : '400'};
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.selected ? '#3395FF' : '#E6F0FF'};
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

const StyledInput = styled(Input)`
  width: 100%;
  padding: 10px;
  padding-right: 30px; // '원' 표시를 위한 공간
  border: 1px solid ${theme.colors.border};
  border-radius: 4px;
  background-color: #FFFFFF;
  text-align: right;

  &:hover {
    background-color: #E6F0FF;
  }
`;

const PriceUnit = styled.span`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.text};
`;
