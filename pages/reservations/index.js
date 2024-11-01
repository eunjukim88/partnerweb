'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReservationList from '../../src/components/reservations/ReservationList';
import TimelineView from '../../src/components/reservations/TimelineView';
import { TabMenu, TabButton } from '../../src/components/common/TabComponents';
import useReservationStore from '../../src/store/reservationStore';
import useRoomStore from '../../src/store/roomStore';

const ReservationsPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const { fetchReservations, reservations } = useReservationStore();
  const { fetchRooms, rooms } = useRoomStore();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchReservations(), fetchRooms()]);
    };
    loadData();
  }, [fetchReservations, fetchRooms]);

  return (
    <PageContent>
      <PageTitle>예약 관리</PageTitle>
      <TabMenu>
        <TabButton 
          active={activeTab === 'list'} 
          onClick={() => setActiveTab('list')}
        >
          리스트 뷰
        </TabButton>
        <TabButton 
          active={activeTab === 'timeline'} 
          onClick={() => setActiveTab('timeline')}
        >
          타임라인 뷰
        </TabButton>
      </TabMenu>
      
      {activeTab === 'list' ? (
        <ReservationList />
      ) : (
        <TimelineView />
      )}
    </PageContent>
  );
};

const PageContent = styled.div`
  padding: 20px;
  background-color: white;
  min-height: calc(100vh - 60px); // 헤더 높이를 뺀 전체 높이
`;

const PageTitle = styled.h1`
  font-size: 24px;
  margin-bottom: 20px;
  color: #212529;
`;

export default ReservationsPage;
