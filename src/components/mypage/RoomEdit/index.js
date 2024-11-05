import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import useRoomStore from '@/src/store/roomStore'; // roomStore 임포트 추가
import styled from 'styled-components';
import { FaArrowLeft, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';


const RoomEdit = () => {
  const router = useRouter();
  const { roomNumber, roomId } = router.query;
  console.log('Router query:', router.query); // 디버깅

  useEffect(() => {
    if (roomNumber) {
      console.log('Room number from URL:', roomNumber); // 디버깅
      document.title = `${roomNumber}호 수정`; // 페이지 타이틀 설정
    }
  }, [roomNumber]);

  const { rooms, fetchRooms, updateRoom, isLoading, error } = useRoomStore(); // store에서 상태와 메서드 가져오기
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [room, setRoom] = useState({
    room_id: '',
    room_number: '',
    room_floor: '',
    room_building: '',
    room_name: '',
    room_type: '',
    display: {
      floor: false,
      building: false,
      name: false,
      type: false,
    },
    salesLimit: {
      hourly: false,
      nightly: false,
      long_term: false,
    },
    rates: {
      rate_hourly_weekday: 0,
      rate_hourly_friday: 0,
      rate_hourly_weekend: 0,
      rate_nightly_weekday: 0,
      rate_nightly_friday: 0,
      rate_nightly_weekend: 0,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      await fetchRooms();
      setIsDataLoaded(true);
    };
    loadData();
  }, [fetchRooms]);

  useEffect(() => {
    if (isDataLoaded && rooms.length > 0 && roomNumber) {
      console.log('Current rooms:', rooms);
      console.log('Looking for roomNumber:', roomNumber);

      const roomData = rooms.find(r => {
        console.log('Comparing:', {
          current: r.room_number?.toString(),
          target: roomNumber?.toString()
        });
        return r.room_number?.toString() === roomNumber?.toString();
      });

      console.log('Found room data:', roomData);

      if (roomData && typeof roomData.room_id === 'number' && !isNaN(roomData.room_id)) {
        setRoom({
          room_id: roomData.room_id,
          room_number: roomData.room_number,
          room_floor: roomData.room_floor || '',
          room_building: roomData.room_building || '',
          room_name: roomData.room_name || '',
          room_type: roomData.room_type || '',
          display: {
            floor: Boolean(roomData.show_floor),
            building: Boolean(roomData.show_building),
            name: Boolean(roomData.show_name),
            type: Boolean(roomData.show_type)
          },
          salesLimit: {
            hourly: Boolean(roomData.hourly),
            nightly: Boolean(roomData.nightly),
            long_term: Boolean(roomData.long_term)
          },
          rates: {
            rate_hourly_weekday: parseInt(roomData.rate_hourly_weekday) || 0,
            rate_hourly_friday: parseInt(roomData.rate_hourly_friday) || 0,
            rate_hourly_weekend: parseInt(roomData.rate_hourly_weekend) || 0,
            rate_nightly_weekday: parseInt(roomData.rate_nightly_weekday) || 0,
            rate_nightly_friday: parseInt(roomData.rate_nightly_friday) || 0,
            rate_nightly_weekend: parseInt(roomData.rate_nightly_weekend) || 0
          }
        });
      } else {
        console.error('Invalid room data found:', roomData);
      }
    }
  }, [rooms, roomNumber, isDataLoaded]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', name, value); // 디버깅

    // 필드명 매핑
    const fieldMapping = {
      floor: 'room_floor',
      building: 'room_building',
      name: 'room_name',
      type: 'room_type'
    };

    const mappedName = fieldMapping[name] || name;

    setRoom(prev => ({
      ...prev,
      [mappedName]: value
    }));
  };

  const handleCheckboxChange = (type) => {
    setRoom((prev) => ({
      ...prev,
      salesLimit: {
        ...prev.salesLimit,
        [type]: !prev.salesLimit[type],
      },
    }));
  };

  const handleRateChange = (field, value) => {
    const unformattedValue = unformatNumber(value);
    const numValue = parseInt(unformattedValue, 10);
    
    if (isNaN(numValue) || numValue < 0) {
      return;
    }

    setRoom((prev) => ({
      ...prev,
      rates: {
        ...prev.rates,
        [field]: numValue,
      },
    }));
  };

  const handleSave = async () => {
    try {
      console.log('Saving room data:', room); // 디버깅

      if (!roomId) {
        throw new Error('객실 ID가 누락되었습니다.');
      }

      const roomData = {
        room_id: parseInt(roomId),
        room_floor: room.room_floor,
        room_building: room.room_building,
        room_name: room.room_name,
        room_type: room.room_type,
        show_floor: room.display.floor,
        show_building: room.display.building,
        show_name: room.display.name,
        show_type: room.display.type,
        hourly: room.salesLimit.hourly,
        nightly: room.salesLimit.nightly,
        long_term: room.salesLimit.long_term
      };

      await updateRoom(parseInt(roomId), {
        roomData,
        ratesData: room.rates
      });

      alert('저장이 완료되었습니다.');
      router.push('/mypage?section=rooms');
    } catch (error) {
      console.error('저장 실패:', error);
      alert(error.message || '저장에 실패했습니다.');
    }
  };

  const handleDisplayChange = (field) => {
    setRoom((prev) => ({
      ...prev,
      display: {
        ...prev.display,
        [field]: !prev.display[field],
      },
    }));
  };

  useEffect(() => {
    const handleRoomUpdate = (event) => {
      const updatedRoom = event.detail;
      setRoom((prevRoom) =>
        prevRoom.room_id === updatedRoom.room_id ? updatedRoom : prevRoom
      );
    };

    window.addEventListener('roomUpdated', handleRoomUpdate);

    return () => {
      window.removeEventListener('roomUpdated', handleRoomUpdate);
    };
  }, []);

  if (!isDataLoaded || isLoading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const unformatNumber = (value) => {
    if (!value) return '';
    return value.replace(/[^\d]/g, '');
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={() => router.push('/mypage?section=rooms')}>
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
              type="text"
              name="floor"
              value={room.room_floor || ''}
              onChange={handleInputChange}
              placeholder="층수 입력"
            />
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.display?.floor || false}
                onChange={() => handleDisplayChange('floor')}
              />
              <span></span>
            </StyledSwitch>
          </FormGroup>
          <FormGroup>
            <Label>동수</Label>
            <Input
              type="text"
              name="building"
              value={room.room_building || ''}
              onChange={handleInputChange}
              placeholder="동수 입력"
            />
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.display?.building || false}
                onChange={() => handleDisplayChange('building')}
              />
              <span></span>
            </StyledSwitch>
          </FormGroup>
        </FormRow>

        <FormRow>
          <FormGroup>
            <Label>객실 이름</Label>
            <Input
              type="text"
              name="name"
              value={room.room_name || ''}
              onChange={handleInputChange}
              placeholder="객실 이름 입력"
            />
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.display?.name || false}
                onChange={() => handleDisplayChange('name')}
              />
              <span></span>
            </StyledSwitch>
          </FormGroup>
          <FormGroup>
            <Label>객실 타입</Label>
            <Input
              type="text"
              name="type"
              value={room.room_type || ''}
              onChange={handleInputChange}
              placeholder="객실 타입 입력"
            />
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.display?.type || false}
                onChange={() => handleDisplayChange('type')}
              />
              <span></span>
            </StyledSwitch>
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
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.salesLimit.hourly}
                onChange={() => handleCheckboxChange('hourly')}
              />
              <span></span>
            </StyledSwitch>
            <CheckboxText>대실</CheckboxText>
          </CheckboxLabel>
          <CheckboxLabel>
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.salesLimit.nightly}
                onChange={() => handleCheckboxChange('nightly')}
              />
              <span></span>
            </StyledSwitch>
            <CheckboxText>숙박</CheckboxText>
          </CheckboxLabel>
          <CheckboxLabel>
            <StyledSwitch>
              <input
                type="checkbox"
                checked={room.salesLimit.long_term}
                onChange={() => handleCheckboxChange('long_term')}
              />
              <span></span>
            </StyledSwitch>
            <CheckboxText>장기</CheckboxText>
          </CheckboxLabel>
        </CheckboxGroup>
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>개별 단가 설정</SectionTitle>
          <InfoText>
            <FaExclamationCircle />
            <span>개별 단가 설정 시 일괄 요금 적용이 불능합니다. 필요한 경우에만 입력하세요.</span>
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
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_hourly_weekday) : ''}
                      onChange={(e) => handleRateChange('rate_hourly_weekday', e.target.value)}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_hourly_friday) : ''}
                      onChange={(e) => handleRateChange('rate_hourly_friday', e.target.value)}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_hourly_weekend) : ''}
                      onChange={(e) => handleRateChange('rate_hourly_weekend', e.target.value)}
                    />
                  </td>
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
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_nightly_weekday) : ''}
                      onChange={(e) => handleRateChange('rate_nightly_weekday', e.target.value)}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_nightly_friday) : ''}
                      onChange={(e) => handleRateChange('rate_nightly_friday', e.target.value)}
                    />
                  </td>
                  <td>
                    <RateInput
                      value={room.rates ? formatNumber(room.rates.rate_nightly_weekend) : ''}
                      onChange={(e) => handleRateChange('rate_nightly_weekend', e.target.value)}
                    />
                  </td>
                </tr>
              </tbody>
            </RateTable>
          </RateTableWrapper>
        </RateTableContainer>
      </Section>

      <Button onClick={handleSave}>저장</Button>
    </Container>
  );
};

export default RoomEdit;



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

const Input = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.3125rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  font-size: 0.875rem;
`;

const Label = styled.label`
  width: 6rem;
  margin-right: 0.625rem;
  font-weight: bold;
  font-size: 0.875rem;
  flex-shrink: 0;
`;

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

// 2. 그 다음 StyledSwitch 정의
const StyledSwitch = styled.label`
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

// 3. 마지막으로 FormRow와 FormGroup 정의
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

  ${Input} {
    flex: 1;
    margin-right: 0.5rem;
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
  margin-right: 2rem;
`;

const CheckboxText = styled.span`
  font-size: 0.875rem;
  margin-left: 0.5rem;
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