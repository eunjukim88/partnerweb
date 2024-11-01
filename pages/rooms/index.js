"use client";
import React, { useState, useEffect } from 'react';
import { FaThLarge, FaList, FaFilter, FaChevronDown } from 'react-icons/fa';
import styled from 'styled-components';
import RoomCard from '../../src/components/rooms/RoomCard';
import RoomList from '../../src/components/rooms/RoomList';
import theme from '../../src/styles/theme';
import RootLayout from '../../src/core/App';
import { useRouter } from 'next/router';
import useReservationStore from '../../src/store/reservationStore';
import useRoomStore from '../../src/store/roomStore';

const RoomsPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState('card');
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const { rooms, fetchRooms } = useRoomStore();
    const { reservations, fetchReservations } = useReservationStore();
  
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
        new Date(res.check_out) >= now
      );
    };
  
    const filteredRooms = rooms.map(room => {
      const currentReservation = getCurrentReservation(room.number);
      return {
        ...room,
        status: currentReservation ? 
          currentReservation.stay_type === '대실' ? 'hourlyStay' :
          currentReservation.stay_type === '숙박' ? 'overnightStay' :
          currentReservation.stay_type === '장기' ? 'longStay' : 
          room.status : 
          'vacant',
        checkIn: currentReservation?.check_in,
        checkOut: currentReservation?.check_out
      };
    }).filter(room => {
      if (statusFilter === 'all' && filter === 'all') return true;
      
      if (statusFilter === 'vacant') {
        return !getCurrentReservation(room.number);
      }
      
      if (filter !== 'all') {
        const currentReservation = getCurrentReservation(room.number);
        if (!currentReservation) return false;

        const filterMap = {
          hourly: '대실',
          overnight: '숙박',
          long: '장기'
        };
        return currentReservation.stay_type === filterMap[filter];
      }
      
      return room.status === statusFilter;
    });

    const handleEditRoom = (room) => {
      router.push({
        pathname: '/mypage',
        query: { 
          section: 'room-edit',
          roomNumber: room.number 
        }
      });
    };

    const getTabCount = (tabFilter) => {
      if (tabFilter === 'all') return filteredRooms.length;
      
      return filteredRooms.filter(room => {
        const currentReservation = getCurrentReservation(room.number);
        if (!currentReservation) return false;

        switch(tabFilter) {
          case 'hourly':
            return currentReservation.stay_type === '대실';
          case 'overnight':
            return currentReservation.stay_type === '숙박';
          case 'long':
            return currentReservation.stay_type === '장기';
          default:
            return false;
        }
      }).length;
    };

    return (
        <RootLayout>
        <PageContent>
        <HeaderWrapper>
          <Title>객실 관리 현황</Title>
          <CurrentTime>{currentTime.toLocaleString('ko-KR', { hour12: false })}</CurrentTime>
        </HeaderWrapper>
        <ControlContainer>
          <TabContainer>
            {['all', 'hourly', 'overnight', 'long'].map(tabFilter => (
              <Tab 
                key={tabFilter}
                $active={filter === tabFilter} 
                onClick={() => setFilter(tabFilter)} 
                color={theme.colors[tabFilter === 'all' ? 'vacant' : `${tabFilter}Stay`]}
              >
                {tabFilter === 'all' ? '전체' : 
                 tabFilter === 'hourly' ? '대실' : 
                 tabFilter === 'overnight' ? '숙박' : '장기'}
                <Count>{getTabCount(tabFilter)}</Count>
              </Tab>
            ))}
          </TabContainer>
          <ControlPanel>
            <FilterSelectWrapper>
              <FilterIcon />
              <FilterSelect 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">전체 객실 상태</option>
                <option value="vacant">공실</option>
                <option value="longStay">장기</option>
                <option value="overnightStay">숙박</option>
                <option value="hourlyStay">대실</option>
                <option value="cleaningRequested">청소요청</option>
                <option value="cleaningInProgress">청소중</option>
                <option value="cleaningComplete">청소완료</option>
                <option value="salesStopped">판매중지</option>
                <option value="inspectionRequested">점검요청</option>
                <option value="inspectionComplete">점검완료</option>
                <option value="underInspection">점검중</option>
                <option value="reservationComplete">예약완료</option>
              </FilterSelect>
              <DropdownIcon />
            </FilterSelectWrapper>
            <ViewModeButtons>
              {['card', 'list'].map(mode => (
                <ViewModeButton key={mode} active={viewMode === mode} onClick={() => setViewMode(mode)}>
                  {mode === 'card' ? <FaThLarge /> : <FaList />}
                </ViewModeButton>
              ))}
            </ViewModeButtons>
          </ControlPanel>
        </ControlContainer>
        {loading ? (
          <LoadingMessage>로딩 중...</LoadingMessage>
        ) : viewMode === 'card' ? (
          <RoomGrid>
            {filteredRooms.map(room => (
              <RoomCard 
                key={room.number} 
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
  font-size: 18px;
`;

const ControlContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const TabContainer = styled.div`
  display: flex;
`;

const Tab = styled.button`
  background-color: ${props => props.$active ? theme.colors.buttonPrimary.background : 'transparent'};
  color: ${props => props.$active ? theme.colors.buttonPrimary.text : theme.colors.text};
  border: 1px solid ${props => props.color};
  padding: 8px 15px;
  margin-right: 10px;
  border-radius: 5px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${props => props.color};
    color: #ffffff;
  }
`;

const Count = styled.span`
  margin-left: 5px;
  font-weight: bold;
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
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #535353;
`;

const FilterSelect = styled.select`
  appearance: none;
  background-color: #f0f0f0;
  border: none;
  padding: 10px 30px 10px 35px;
  margin-right: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  width: 200px;
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

export default RoomsPage;
