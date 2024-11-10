"use client";

// 1. 임포트 영역
import React, { useState, useEffect, useMemo } from 'react';
import { FaThLarge, FaList, FaFilter, FaChevronDown } from 'react-icons/fa';
import styled from 'styled-components';
import { useRouter } from 'next/router';
import RoomCard from '../../src/components/rooms/RoomCard';
import RoomList from '../../src/components/rooms/RoomList';
import RootLayout from '../../src/core/App';
import theme from '../../src/styles/theme';
import useRoomStore from '../../src/store/roomStore';
import useReservationStore from '../../src/store/reservationStore';

// 2. 메인 컴포넌트
const RoomsPage = () => {
  // 상태 관리
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('card');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Store에서 필요한 데이터와 함수들
  const { rooms, fetchRooms } = useRoomStore();
  const { 
    filteredReservations,
    fetchReservations, 
    isLoading,
    error,
    getRoomReservationStatus,
    getRoomReservationTimes,
    bookingSource,
    stayType,
    getCurrentReservation,
    getStayTypeCount,
    getRoomsByStayType
  } = useReservationStore();

  // 실시간 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchRooms(), fetchReservations()]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    loadData();
  }, [fetchRooms, fetchReservations]);

  // 객실 필터링 로직
  const filteredRooms = useMemo(() => {
    return rooms.map(room => {
      const status = getRoomReservationStatus(room.room_id);
      const currentReservation = getCurrentReservation(room.room_id);
      
      return {
        ...room,
        status,
        currentReservation
      };
    }).filter(room => {
      if (bookingSource === 'all' && stayType === 'all') return true;
      if (bookingSource === 'vacant') return room.status === 'vacant';
      if (stayType !== 'all') return room.status === stayType;
      return room.status === bookingSource;
    });
  }, [rooms, getRoomReservationStatus, getRoomReservationTimes, 
      filteredReservations, currentTime, bookingSource, stayType]);

  // 이벤트 핸들러
  const handleEditRoom = (room) => {
    router.push({
      pathname: '/mypage',
      query: { section: 'room-edit', roomId: room.room_id }
    });
  };

  // 로딩 및 에러 상태 처리
  if (isLoading) return <LoadingMessage>로딩 중...</LoadingMessage>;
  if (error) return <LoadingMessage>에러: {error}</LoadingMessage>;

  // 렌더링
  return (
    <RootLayout>
      <PageContent>
        <HeaderWrapper>
          <Title>객실 관리 현황</Title>
          <CurrentTime>{currentTime.toLocaleString('ko-KR', { hour12: false })}</CurrentTime>
        </HeaderWrapper>

        <ControlContainer>
          <TabContainer />
          <ControlPanel>
            <FilterSelect />
            <ViewModeButtons>
              {['card', 'list'].map(mode => (
                <ViewModeButton 
                  key={mode} 
                  active={viewMode === mode} 
                  onClick={() => setViewMode(mode)}
                >
                  {mode === 'card' ? <FaThLarge /> : <FaList />}
                </ViewModeButton>
              ))}
            </ViewModeButtons>
          </ControlPanel>
        </ControlContainer>

        {viewMode === 'card' ? (
          <RoomGrid>
            {filteredRooms.map(room => (
              <RoomCard 
                key={room.room_id}
                room={room}
                onEdit={() => handleEditRoom(room)}
              />
            ))}
          </RoomGrid>
        ) : (
          <RoomList 
            rooms={filteredRooms}
            onEditRoom={handleEditRoom}
          />
        )}
      </PageContent>
    </RootLayout>
  );
};

// 3. 서브 컴포넌트들
const TabContainer = () => {
  const { 
    setStayType, 
    stayType,
    getStayTypeCount,
    getRoomsByStayType
  } = useReservationStore();

  const { rooms } = useRoomStore();

  const tabFilters = [
    { id: 'all', label: '전체', value: 'all' },
    { id: 'hourly', label: '대실', value: 'hourlyStay' },
    { id: 'overnight', label: '숙박', value: 'overnightStay' },
    { id: 'long', label: '장기', value: 'longStay' }
  ];

  return (
    <TabWrapper>
      {tabFilters.map(({ id, label, value }) => (
        <Tab 
          key={id}
          $active={stayType === value} 
          onClick={() => setStayType(value)}
          color={theme.colors[id === 'all' ? 'primary' : value]}
        >
          {label}
          <Count $active={stayType === value}>
            {value === 'all' ? rooms?.length || 0 : getStayTypeCount(value)}
          </Count>
        </Tab>
      ))}
    </TabWrapper>
  );
};

const FilterSelect = () => {
  const { 
    bookingSource, 
    setBookingSource,
    setStayType 
  } = useReservationStore();

  const statusOptions = [
    { value: 'all', label: '전체 객실 상태' },
    { value: 'vacant', label: '공실' },
    { value: 'longStay', label: '장기' },
    { value: 'overnightStay', label: '숙박' },
    { value: 'hourlyStay', label: '대실' },
    { value: 'cleaningRequested', label: '청소요청' },
    { value: 'cleaningInProgress', label: '청소중' },
    { value: 'cleaningComplete', label: '청소완료' },
    { value: 'salesStopped', label: '판매중지' },
    { value: 'inspectionRequested', label: '점검요청' },
    { value: 'inspectionComplete', label: '점검완료' },
    { value: 'underInspection', label: '점검중' },
    { value: 'reservationComplete', label: '예약완료' }
  ];

  return (
    <FilterSelectWrapper>
      <FilterIcon />
      <StyledSelect 
        value={bookingSource} 
        onChange={(e) => {
          const value = e.target.value;
          setBookingSource(value);
          if (value !== bookingSource) {
            setStayType('all');
          }
        }}
      >
        {statusOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      <DropdownIcon />
    </FilterSelectWrapper>
  );
};

// 4. 스타일 컴포넌트들
const PageContent = styled.div`
  padding: 15px;
`;

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  margin-right: 20px;
`;

const CurrentTime = styled.div`
  font-size: 22px;
`;

const ControlContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const TabWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Tab = styled.button`
  padding: 8px 16px;
  border: 1px solid ${props => props.$active ? props.color : '#ddd'};
  background-color: ${props => props.$active ? props.color : 'white'};
  color: ${props => props.$active ? 'white' : props.color};
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.color};
    color: white;
  }
`;

const Count = styled.span`
  margin-left: 8px;
  font-size: 12px;
  background-color: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'};
  padding: 2px 6px;
  border-radius: 10px;
`;

const ControlPanel = styled.div`
  display: flex;
  align-items: center;
`;

const FilterSelectWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const FilterIcon = styled(FaFilter)`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #535353;
`;

const DropdownIcon = styled(FaChevronDown)`
  position: absolute;
  right: 35px;
  top: 50%;
  transform: translateY(-50%);
  color: #535353;
`;

const StyledSelect = styled.select`
  padding: 8px 25px 8px 35px;
  margin-right: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  appearance: none;
  background-color: white;
  cursor: pointer;
  min-width: 200px;

  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
  }
`;

const ViewModeButtons = styled.div`
  display: flex;
  gap: 10px;
`;

const ViewModeButton = styled.button`
  background-color: ${props => props.active ? '#535353' : '#f0f0f0'};
  color: ${props => props.active ? '#ffffff' : '#535353'};
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
`;

const RoomGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 0.5fr));
  gap: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  font-size: 18px;
  margin-top: 20px;
`;

// 5. 익스포트
export default RoomsPage;
