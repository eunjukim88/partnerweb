"use client";
import React, { useState, useEffect } from 'react';
import { FaThLarge, FaList, FaFilter, FaChevronDown } from 'react-icons/fa';
import styled from 'styled-components';
import RoomCard from '../../src/components/rooms/RoomCard';
import RoomList from '../../src/components/rooms/RoomList';
import theme from '../../src/styles/theme';
import RootLayout from '../../src/core/App';
import { useRouter } from 'next/router';

const RoomsPage = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [viewMode, setViewMode] = useState('card');
    const [filter, setFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [displaySettings, setDisplaySettings] = useState({
        showBuilding: false,
        showFloor: false,
        showName: false,
        showType: false
    });
    const router = useRouter();
  
    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);
  
    useEffect(() => {
      const fetchRooms = async () => {
        try {
          const response = await fetch('/api/rooms');
          const data = await response.json();
          setRooms(data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching rooms:', error);
          setLoading(false);
        }
      };

      fetchRooms();
    }, []);
  
    const filteredRooms = rooms.filter(room => {
      // 전체 선택시
      if (statusFilter === 'all' && filter === 'all') return true;
      
      // 공실 필터링
      if (statusFilter === 'vacant') {
        return !room.status || room.status === 'vacant';
      }
      
      // 탭 필터 적용 (상단 탭)
      if (filter !== 'all') {
        const filterStatusMap = {
          hourly: 'hourlyStay',
          overnight: 'overnightStay',
          long: 'longStay'
        };
        return room.status === filterStatusMap[filter];
      }
      
      // 상태 필터 적용 (select box)
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

    // 탭 카운트 계산 함수 추가
    const getTabCount = (tabFilter) => {
      if (tabFilter === 'all') return rooms.length;
      
      const statusMap = {
        hourly: 'hourlyStay',
        overnight: 'overnightStay',
        long: 'longStay'
      };
      
      return rooms.filter(room => room.status === statusMap[tabFilter]).length;
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
          <LoadingMessage>객실 정보를 불러오는 중...</LoadingMessage>
        ) : viewMode === 'card' ? (
          <RoomGrid>
            {filteredRooms.map(room => (
              <RoomCard 
                key={room.id} 
                room={room} 
                displaySettings={displaySettings}
              />
            ))}
          </RoomGrid>
        ) : (
          <RoomList rooms={filteredRooms} onEditRoom={handleEditRoom} />
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
