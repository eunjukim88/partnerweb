import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { FaArrowLeft, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

const RoomEdit = ({ roomNumber }) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [room, setRoom] = useState({
    floor: '',
    building: '',
    number: roomNumber || '',
    name: '',
    type: '',
    showInStatus: {
      floor: true,
      building: true,
      name: true,
      type: true
    },
    salesLimit: {
      hourly: false,
      nightly: false,
      longTerm: false
    },
    hourlyRate: {
      weekday: '',
      friday: '',
      weekend: ''
    },
    nightlyRate: {
      weekday: '',
      friday: '',
      weekend: ''
    }
  });

  useEffect(() => {
    if (roomNumber) {
      setRoom(prev => ({ ...prev, number: roomNumber }));
    }
  }, [roomNumber]);

  useEffect(() => {
    const checkLoginStatus = () => {
      const storedToken = localStorage.getItem('token');
      const loggedIn = !!storedToken;
      setIsLoggedIn(loggedIn);

      if (!loggedIn) {
        router.push('/login');
      }
    };

    checkLoginStatus();
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRoom(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (field) => {
    setRoom(prev => ({
      ...prev,
      showInStatus: {
        ...prev.showInStatus,
        [field]: !prev.showInStatus[field]
      }
    }));
  };

  const handleCheckboxChange = (field) => {
    setRoom(prev => ({
      ...prev,
      salesLimit: {
        ...prev.salesLimit,
        [field]: !prev.salesLimit[field]
      }
    }));
  };

  const handleRateChange = (type, field, value) => {
    setRoom(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.push('/mypage?section=room-settings')}>
          <FaArrowLeft size={20} />
        </BackButton>
        <Title>{roomNumber}호 수정</Title>
      </Header>

      <Section>
        <SectionHeader>
          <SectionTitle>객실정보 설정</SectionTitle>
          <InfoText>
            <FaInfoCircle />
            <span>ON 상태일 때 해당 정보가 객실현황 카드에 표시됩니다.</span>
          </InfoText>
        </SectionHeader>

        <FormRow>
          <FormGroup>
            <Label>층수</Label>
            <Input
              name="floor"
              value={room.floor}
              onChange={handleInputChange}
            />
            <Switch>
              <input
                type="checkbox"
                checked={room.showInStatus.floor}
                onChange={() => handleSwitchChange('floor')}
              />
              <span></span>
            </Switch>
          </FormGroup>
          <FormGroup>
            <Label>동수</Label>
            <Input
              name="building"
              value={room.building}
              onChange={handleInputChange}
            />
            <Switch>
              <input
                type="checkbox"
                checked={room.showInStatus.building}
                onChange={() => handleSwitchChange('building')}
              />
              <span></span>
            </Switch>
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>객실 이름</Label>
            <Input
              name="name"
              value={room.name}
              onChange={handleInputChange}
            />
            <Switch>
              <input
                type="checkbox"
                checked={room.showInStatus.name}
                onChange={() => handleSwitchChange('name')}
              />
              <span></span>
            </Switch>
          </FormGroup>
          <FormGroup>
            <Label>객실 타입</Label>
            <Input
              name="type"
              value={room.type}
              onChange={handleInputChange}
            />
            <Switch>
              <input
                type="checkbox"
                checked={room.showInStatus.type}
                onChange={() => handleSwitchChange('type')}
              />
              <span></span>
            </Switch>
          </FormGroup>
        </FormRow>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>판매 제한</SectionTitle>
          <InfoText>
            <FaInfoCircle />
            <span>선택한 객실은 해당 유형의 예약을 받을 수 없습니다.</span>
          </InfoText>
        </SectionHeader>
        <CheckboxGroup>
          <CheckboxLabel>
            <CheckboxInput
              type="checkbox"
              checked={room.salesLimit.hourly}
              onChange={() => handleCheckboxChange('hourly')}
            />
            <CheckboxText>대실</CheckboxText>
          </CheckboxLabel>
          <CheckboxLabel>
            <CheckboxInput
              type="checkbox"
              checked={room.salesLimit.nightly}
              onChange={() => handleCheckboxChange('nightly')}
            />
            <CheckboxText>숙박</CheckboxText>
          </CheckboxLabel>
          <CheckboxLabel>
            <CheckboxInput
              type="checkbox"
              checked={room.salesLimit.longTerm}
              onChange={() => handleCheckboxChange('longTerm')}
            />
            <CheckboxText>장기</CheckboxText>
          </CheckboxLabel>
        </CheckboxGroup>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>개별 단가 설정</SectionTitle>
          <InfoText>
            <FaExclamationCircle />
            <span>개별 단가 설정 시 일괄 요금 적용이 불가능합니다. 필요한 경우에만 입력하세요.</span>
          </InfoText>
        </SectionHeader>
        <RateTableContainer>
          <RateTableWrapper>
            <RateTable>
              <thead>
                <tr>
                  <th>대실</th>
                  <th>평일</th>
                  <th>금요일</th>
                  <th>주말</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>단가</td>
                  <td><RateInput value={room.hourlyRate.weekday} onChange={(e) => handleRateChange('hourlyRate', 'weekday', e.target.value)} /></td>
                  <td><RateInput value={room.hourlyRate.friday} onChange={(e) => handleRateChange('hourlyRate', 'friday', e.target.value)} /></td>
                  <td><RateInput value={room.hourlyRate.weekend} onChange={(e) => handleRateChange('hourlyRate', 'weekend', e.target.value)} /></td>
                </tr>
              </tbody>
            </RateTable>
          </RateTableWrapper>
          <RateTableWrapper>
            <RateTable>
              <thead>
                <tr>
                  <th>숙박</th>
                  <th>평일</th>
                  <th>금요일</th>
                  <th>주말</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>단가</td>
                  <td><RateInput value={room.nightlyRate.weekday} onChange={(e) => handleRateChange('nightlyRate', 'weekday', e.target.value)} /></td>
                  <td><RateInput value={room.nightlyRate.friday} onChange={(e) => handleRateChange('nightlyRate', 'friday', e.target.value)} /></td>
                  <td><RateInput value={room.nightlyRate.weekend} onChange={(e) => handleRateChange('nightlyRate', 'weekend', e.target.value)} /></td>
                </tr>
              </tbody>
            </RateTable>
          </RateTableWrapper>
        </RateTableContainer>
      </Section>

      <Button onClick={() => console.log('저장')}>저장</Button>
    </Container>
  );
};

export default RoomEdit;

const Container = styled.div`
  padding: 1rem;
  max-width: 64rem;
  min-width: 20rem;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  margin-bottom: 1rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  margin-top: 1rem;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  width: 15%;
  font-weight: bold;
  margin: 0;
  margin-right: 1rem;
`;

const InfoText = styled.p`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: #666;
  width: 85%;
  margin: 0;
  padding: 0.5rem;
  background-color: #f8f8f8;
  border-radius: 0.25rem;

  svg {
    margin-right: 0.5rem;
    color: #f39c12; // 주황색으로 변경
  }

  span {
    flex: 1;
  }
`;

const FormRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;

  @media (max-width: 48rem) {
    flex-direction: column;
  }
`;

const FormGroup = styled.div`
  display: flex;
  align-items: center;
  width: calc(50% - 0.5rem);

  @media (max-width: 48rem) {
    width: 100%;
    margin-bottom: 1rem;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
`;

const CheckboxInput = styled.input`
  margin-right: 0.5rem;
`;

const CheckboxText = styled.span`
  font-size: 0.875rem;
`;

const RateTableContainer = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
`;

const RateTableWrapper = styled.div`
  flex: 1;
  min-width: 300px;
`;

const RateTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    border: 1px solid #ddd;
    padding: 0.5rem;
    text-align: center;
    font-size: 0.875rem;
  }

  th {
    background-color: #f2f2f2;
  }

  th:first-child {
    width: 20%;
  }
`;

const RateInput = styled.input`
  width: 100%;
  max-width: 5rem;
  padding: 0.25rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  text-align: right;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 0.625rem;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.2rem;
  margin-left: 1.25rem;
`;

const Label = styled.label`
  width: 6rem;
  margin-right: 0.625rem;
  font-weight: bold;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.3125rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 3.75rem;
  height: 1.5rem;
  margin-left: 0.625rem;
  flex-shrink: 0;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 1.5rem;

    &:before {
      position: absolute;
      content: "";
      height: 1.25rem;
      width: 1.25rem;
      left: 0.125rem;
      bottom: 0.125rem;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
    }

    &:after {
      content: "OFF";
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      color: #fff;
      font-size: 0.75rem;
      font-weight: bold;
    }
  }

  input:checked + span {
    background-color: #2196F3;

    &:before {
      transform: translateX(2.2rem);
    }

    &:after {
      content: "ON";
      left: 0.5rem;
      right: auto;
    }
  }
`;

const Button = styled.button`
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1rem;

  &:hover {
    background-color: #0d8bf2;
  }
`;
