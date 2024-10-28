import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';

// LoadingSpinner 컴포넌트 추가
const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const TimelineView = ({ timelineStartDate, reservations = [] }) => {
  const [currentDate, setCurrentDate] = useState(timelineStartDate || new Date());
  const [isFirstHalf, setIsFirstHalf] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms');
      const data = await response.json();
      setRooms(data);
      setLoading(false);
    } catch (error) {
      console.error('객실 정보 조회 실패:', error);
      setLoading(false);
    }
  };

  // 날짜 관련 함수들은 유지
  const getDateRange = (date, isFirstHalf) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    let startDate, endDate;

    if (isFirstHalf) {
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month, 15);
    } else {
      startDate = new Date(year, month, 16);
      endDate = new Date(year, month + 1, 0);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(currentDate, isFirstHalf);

  return (
    <TimelineContainer>
      <TimelineHeader>
        <ArrowButton onClick={() => handleTimelineChange('prev')}>&lt;</ArrowButton>
        <DateRange>
          {startDate.getFullYear()}년 {startDate.getMonth() + 1}월 {startDate.getDate()}일 - {endDate.getDate()}일
        </DateRange>
        <ArrowButton onClick={() => handleTimelineChange('next')}>&gt;</ArrowButton>
      </TimelineHeader>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <TimelineTableWrapper>
          <TimelineTable>
            <thead>
              <tr>
                <HeaderCell>객실</HeaderCell>
                {[...Array(endDate.getDate() - startDate.getDate() + 1)].map((_, index) => {
                  const currentDate = new Date(startDate);
                  currentDate.setDate(currentDate.getDate() + index);
                  return (
                    <HeaderCell key={index}>
                      {currentDate.getDate()}일
                    </HeaderCell>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room.id}>
                  <RoomCell>
                    {room.number}호
                    <RoomInfo>
                      {room.type} / {room.status}
                    </RoomInfo>
                  </RoomCell>
                  {[...Array(endDate.getDate() - startDate.getDate() + 1)].map((_, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);
                    const dayReservations = Array.isArray(reservations) 
                      ? reservations.filter(r => 
                          r.room_number === room.number &&
                          isDateInRange(currentDate, new Date(r.check_in), new Date(r.check_out))
                        )
                      : [];

                    return (
                      <TimelineCell 
                        key={index}
                        onClick={() => handleCellClick(room, currentDate)}
                      >
                        {dayReservations.map(reservation => (
                          <ReservationBlock
                            key={reservation.id}
                            stayType={reservation.stay_type}
                            isCheckIn={isSameDay(reservation.check_in, currentDate)}
                            isCheckOut={isSameDay(reservation.check_out, currentDate)}
                          >
                            <ReservationInfo>
                              {reservation.guest_name}
                              {isSameDay(reservation.check_in, currentDate) && ' (IN)'}
                              {isSameDay(reservation.check_out, currentDate) && ' (OUT)'}
                            </ReservationInfo>
                            <ReservationTooltip>
                              <p>예약번호: {reservation.reservation_number}</p>
                              <p>객실: {reservation.room_number}호</p>
                              <p>예약자: {reservation.guest_name}</p>
                              <p>연락처: {reservation.phone}</p>
                              <p>체크인: {new Date(reservation.check_in).toLocaleString()}</p>
                              <p>체크아웃: {new Date(reservation.check_out).toLocaleString()}</p>
                              <p>예약경로: {reservation.booking_source}</p>
                              <p>숙박유형: {reservation.stay_type}</p>
                            </ReservationTooltip>
                          </ReservationBlock>
                        ))}
                      </TimelineCell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </TimelineTable>
        </TimelineTableWrapper>
      )}
    </TimelineContainer>
  );
};

// 스타일 컴포넌트 추가
const RoomCell = styled.td`
  padding: 8px;
  border-right: 1px solid #ddd;
  background: #f5f5f5;
  position: sticky;
  left: 0;
  z-index: 1;
`;

const RoomInfo = styled.div`
  font-size: 0.8em;
  color: #666;
`;

const ReservationInfo = styled.div`
  font-size: 0.9em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TimelineContainer = styled.div`
  width: 100%;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const DateRange = styled.span`
  font-size: 18px;
  font-weight: bold;
  margin: 0 20px;
`;

const TimelineTableWrapper = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const TimelineTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const HeaderCell = styled.th`
  padding: 10px;
  background-color: #f2f2f2;
  text-align: center;
  min-width: 40px;
`;

const TimelineCell = styled.td`
  padding: 5px;
  height: 30px;
  position: relative;
  border: 1px solid #ddd;
`;

const ReservationBlock = styled.div`
  position: absolute;
  top: 2px;
  bottom: 2px;
  left: 2px;
  right: 2px;
  background-color: ${props => {
    switch(props.stayType) {
      case '숙박': return theme.colors.overnightStay;
      case '대실': return theme.colors.hourlyStay;
      case '장기': return theme.colors.longStay;
      default: return theme.colors.vacant;
    }
  }};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 4px;
  cursor: pointer;
  
  &:hover {
    opacity: 0.8;
  }
`;

const ReservationTooltip = styled.div`
  display: none;
  position: absolute;
  background-color: white;
  border: 1px solid #ddd;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  z-index: 1000;
  top: 100%;
  left: 0;

  ${ReservationBlock}:hover & {
    display: block;
  }

  p {
    margin: 5px 0;
    color: #333;
  }
`;

export default TimelineView;
