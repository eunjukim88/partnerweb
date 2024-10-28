import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReservationList from '../../src/components/reservations/ReservationList';
import TimelineView from '../../src/components/reservations/TimelineView';
import { TabMenu, TabButton } from '../../src/components/common/TabComponents';

const ReservationsPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());

  useEffect(() => {
    // 나중에 실제 예약 데이터를 가져오는 API 호출로 대체
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/reservations');
        const data = await response.json();
        setReservations(data.reservations || []); // reservations 속성에 접근하고 기본값 설정
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setReservations([]); // 에러 시 빈 배열로 초기화
      }
    };

    fetchReservations();
  }, []);

  return (
    <PageContent>
      <PageTitle>예약 관리</PageTitle>
      <TabMenu>
        <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')}>리스트 뷰</TabButton>
        <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>타임라인 뷰</TabButton>
      </TabMenu>
      {activeTab === 'list' ? (
        <ReservationList 
          reservations={reservations} 
          setReservations={setReservations}
        />
      ) : (
        <TimelineView 
          reservations={reservations}
          timelineStartDate={timelineStartDate}
        />
      )}
    </PageContent>
  );
};

const PageContent = styled.div`
  padding: 20px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
`;

export default ReservationsPage;
