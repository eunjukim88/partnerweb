import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { getReservations } from '../../data/tempData';

const TimelineView = ({ timelineStartDate, onTimelineChange, roomNumbers, stayTypes }) => {
  const [reservations, setReservations] = useState([]);
  const [currentDate, setCurrentDate] = useState(timelineStartDate || new Date());
  const [isFirstHalf, setIsFirstHalf] = useState(true);
  const defaultStayTypes = ['숙박', '대실', '장기'];
  const actualStayTypes = stayTypes || defaultStayTypes;

  useEffect(() => {
    setReservations(getReservations());
  }, []);
  
  useEffect(() => {
    setCurrentDate(timelineStartDate);
    setIsFirstHalf(true);
  }, [timelineStartDate]);

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

  const handleTimelineChange = (direction) => {
    let newDate = new Date(currentDate);
    if (direction === 'next') {
      if (isFirstHalf) {
        setIsFirstHalf(false);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
        setIsFirstHalf(true);
      }
    } else {
      if (isFirstHalf) {
        newDate.setMonth(newDate.getMonth() - 1);
        setIsFirstHalf(false);
      } else {
        setIsFirstHalf(true);
      }
    }
    setCurrentDate(newDate);
  };

  const isDateInRange = (date, start, end) => {
    return date >= start && date <= end;
  };

  return (
    <TimelineContainer>
      <TimelineHeader>
        <ArrowButton onClick={() => handleTimelineChange('prev')}>&lt;</ArrowButton>
        <DateRange>
          {startDate.getFullYear()}년 {startDate.getMonth() + 1}월 {startDate.getDate()}일 - {endDate.getDate()}일
        </DateRange>
        <ArrowButton onClick={() => handleTimelineChange('next')}>&gt;</ArrowButton>
      </TimelineHeader>
      <TimelineTableWrapper>
        <TimelineTable>
          <thead>
            <tr>
              <HeaderCell>객실 호수</HeaderCell>
              <HeaderCell>숙박 유형</HeaderCell>
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
            {roomNumbers.map(roomNumber => (
              actualStayTypes.map((stayType, typeIndex) => (
                <tr key={`${roomNumber}-${stayType}`}>
                  {typeIndex === 0 && <RoomCell rowSpan={actualStayTypes.length}>{roomNumber}</RoomCell>}
                  <StayTypeCell>{stayType}</StayTypeCell>
                  {[...Array(endDate.getDate() - startDate.getDate() + 1)].map((_, index) => {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(currentDate.getDate() + index);
                    const reservationsForDay = reservations.filter(res => 
                      res.roomNumber === roomNumber &&
                      res.stayType === stayType &&
                      isDateInRange(currentDate, new Date(res.checkIn), new Date(res.checkOut))
                    );
                    
                    return (
                      <TimelineCell key={index}>
                        {reservationsForDay.map(res => (
                          <ReservationBlock
                            key={res.id}
                            stayType={res.stayType}
                            isCheckIn={new Date(res.checkIn).toDateString() === currentDate.toDateString()}
                            isCheckOut={new Date(res.checkOut).toDateString() === currentDate.toDateString()}
                          >
                            {res.guestName}
                          </ReservationBlock>
                        ))}
                      </TimelineCell>
                    );
                  })}
                </tr>
              ))
            ))}
          </tbody>
        </TimelineTable>
      </TimelineTableWrapper>
    </TimelineContainer>
  );
};

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
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
`;

const HeaderCell = styled.th`
  padding: 10px;
  background-color: #f2f2f2;
  border: 1px solid #ddd;
  text-align: center;
  min-width: 40px;
`;

const RoomCell = styled.td`
  padding: 10px;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #ddd;
`;

const StayTypeCell = styled.td`
  padding: 10px;
  text-align: center;
  border: 1px solid #ddd;
`;

const TimelineCell = styled.td`
  padding: 5px;
  border: 1px solid #ddd;
  height: 30px;
  position: relative;
`;

const ReservationBlock = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
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
  ${props => props.isCheckIn && `
    &::before {
      content: 'IN';
      position: absolute;
      left: 2px;
      font-size: 10px;
      font-weight: bold;
    }
  `}
  ${props => props.isCheckOut && `
    &::after {
      content: 'OUT';
      position: absolute;
      right: 2px;
      font-size: 10px;
      font-weight: bold;
    }
  `}
`;

export default TimelineView;