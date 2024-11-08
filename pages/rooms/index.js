"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { FaThLarge, FaList, FaFilter, FaChevronDown } from 'react-icons/fa';
import styled from 'styled-components';
import RoomCard from '../../src/components/rooms/RoomCard';
import RoomList from '../../src/components/rooms/RoomList';
import theme from '../../src/styles/theme';
import RootLayout from '../../src/core/App';
import { useRouter } from 'next/router';
import useReservationDisplayStore from '../../src/store/reservationDisplayStore';
import useRoomStore from '../../src/store/roomStore';

const RoomsPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState('card');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { rooms, fetchRooms } = useRoomStore();
    const { 
      reservations, 
      filteredReservations,
      fetchReservations, 
      isLoading,
      error,
      getRoomReservationStatus,
      getRoomReservationTimes,
      bookingSource,
      stayType
    } = useReservationDisplayStore();
  
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
  
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
  
    const getCurrentReservation = (roomNumber) => {
      const now = new Date();
      return reservations.find(res => 
        res.room_number === roomNumber &&
        new Date(res.check_in) <= now &&
        new Date(res.check_out) >= now &&
        res.status === 'confirmed'
      );
    };
  
    const filteredRooms = useMemo(() => {
      return rooms.map(room => {
        const status = getRoomReservationStatus(room.room_id);
        const times = getRoomReservationTimes(room.room_id);
        
        return {
          ...room,
          status,
          reservationTimes: times,
          currentReservation: filteredReservations.find(res => 
            res.room_id === room.room_id &&
            new Date(res.check_in_date) <= currentTime &&
            new Date(res.check_out_date) >= currentTime
          )
        };
      }).filter(room => {
        if (bookingSource === 'all' && stayType === 'all') return true;
        
        if (bookingSource === 'vacant') {
          return room.status === 'vacant';
        }
        
        if (stayType !== 'all') {
          return room.status === stayType;
        }
        
        return room.status === bookingSource;
      });
    }, [rooms, getRoomReservationStatus, getRoomReservationTimes, filteredReservations, 
        currentTime, bookingSource, stayType]);

    const handleEditRoom = (room) => {
      router.push({
        pathname: '/mypage',
        query: { 
          section: 'room-edit',
          roomId: room.room_id 
        }
      });
    };

    const getTabCount = (value) => {
      if (value === 'all') return filteredReservations.length;
      
      return filteredReservations.filter(reservation => {
        switch(value) {
          case 'hourlyStay':
            return reservation.stay_type === '대실';
          case 'overnightStay':
            return reservation.stay_type === '숙박';
          case 'longStay':
            return reservation.stay_type === '장기';
          case 'vacant':
            return !reservation.stay_type;
          default:
            return false;
        }
      }).length;
    };

    if (isLoading) return <LoadingMessage>로딩 중...</LoadingMessage>;
    if (error) return <LoadingMessage>에러: {error}</LoadingMessage>;

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
        {isLoading ? (
          <LoadingMessage>로딩 중...</LoadingMessage>
        ) : (
          viewMode === 'card' ? (
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
          )
        )}
      </PageContent>
    </RootLayout>
    );
};

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

const TabContainer = () => {
  const { 
    setStayType, 
    stayType,
    filteredReservations 
  } = useReservationDisplayStore();
  
  const getTabCount = (value) => {
    if (value === 'all') return filteredReservations.length;
    
    return filteredReservations.filter(reservation => {
      switch(value) {
        case 'hourlyStay':
          return reservation.stay_type === '대실';
        case 'overnightStay':
          return reservation.stay_type === '숙박';
        case 'longStay':
          return reservation.stay_type === '장기';
        case 'vacant':
          return !reservation.stay_type;
        default:
          return false;
      }
    }).length;
  };

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
          color={theme.colors[value === 'all' ? 'primary' : value]}
        >
          {label}
          <Count $active={stayType === value}>
            {getTabCount(value)}
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
  } = useReservationDisplayStore();

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

export default RoomsPage;
