import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ReservationList from '../../src/components/reservations/ReservationList';
import TimelineView from '../../src/components/reservations/TimelineView';
import { TabMenu, TabButton } from '../../src/components/common/TabComponents';
import { getReservations, bookingSources, stayTypes, roomNumbers } from '../../src/data/tempData';

const ReservationsPage = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [reservations, setReservations] = useState([]);
  const [rooms, setRooms] = useState(roomNumbers);
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());

  useEffect(() => {
    setReservations(getReservations());
  }, []);

  const handleTimelineChange = (direction) => {
    const newDate = new Date(timelineStartDate);
    if (direction === 'next') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setTimelineStartDate(newDate);
  };

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
          bookingSources={bookingSources}
          stayTypes={stayTypes}
        />
      ) : (
        <TimelineView 
          reservations={reservations} 
          roomNumbers={rooms}
          timelineStartDate={timelineStartDate}
          stayTypes={stayTypes}
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