import { useState } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Input } from '../common/FormComponents';

const ReservationSettings = () => {
  const [activeTab, setActiveTab] = useState('대실');
  const [operatingDays, setOperatingDays] = useState([]);
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [price, setPrice] = useState('');

  const handleDayToggle = (day) => {
    setOperatingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const renderTabContent = () => (
    <>
      <Section>
        <SectionTitle>{activeTab} 예약 운영 요일</SectionTitle>
        <DayContainer>
          {['월', '화', '수', '목', '금', '토', '일'].map(day => (
            <DayButton
              key={day}
              selected={operatingDays.includes(day)}
              onClick={() => handleDayToggle(day)}
            >
              {day}
            </DayButton>
          ))}
        </DayContainer>
      </Section>

      <Section>
        <SectionTitle>예약 가능시간 및 요금</SectionTitle>
        <TimeContainer>
          <InputGroup>
            <Label>체크인 시간</Label>
            <Input
              type="time"
              value={checkInTime}
              onChange={(e) => setCheckInTime(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <Label>체크아웃 시간</Label>
            <Input
              type="time"
              value={checkOutTime}
              onChange={(e) => setCheckOutTime(e.target.value)}
            />
          </InputGroup>
          <InputGroup>
            <Label>요금</Label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="요금"
            />
          </InputGroup>
        </TimeContainer>
      </Section>
    </>
  );

  return (
    <Container>
      <TabContainer>
        {['대실', '숙박', '장기'].map(tab => (
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
  border: none;
  background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'transparent'};
  color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.text};
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.active ? theme.colors.buttonPrimary.hover : theme.colors.buttonSecondary.hover};
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
  gap: 10px;
  flex-wrap: wrap;
`;

const DayButton = styled(Button)`
  background-color: ${props => props.selected ? theme.colors.buttonPrimary.background : theme.colors.buttonSecondary.background};
  color: ${props => props.selected ? theme.colors.buttonPrimary.text : theme.colors.buttonSecondary.text};

  &:hover {
    background-color: ${props => props.selected ? theme.colors.buttonPrimary.hover : theme.colors.buttonSecondary.hover};
  }
`;

const TimeContainer = styled.div`
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
  margin-bottom: 5px;
  color: ${theme.colors.text};
`;
