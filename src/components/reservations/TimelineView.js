'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useRoomStore from '../../store/roomStore';
import useReservationListStore from '../../store/reservationListStore';
import { reservationUtils } from '../../utils/reservationUtils';

const RESERVATION_COLORS = {
  '대실': '#748ffc',  // 부드러운 파란색
  '숙박': '#ff922b',  // 부드러운 주황색
  '장기': '#FF763B' 
};

// reservationUtils의 dateUtils 사용
const formatDate = (date) => {
  if (!date) return '';
  return reservationUtils.dateUtils.formatDate(date);
};

// 툴팁 포맷팅 함수 수정
const formatTooltip = (reservation) => {
  if (!reservation) return '';
  return `예약번호: ${reservation.reservation_number}
예약자: ${reservation.guest_name}
연락처: ${reservation.phone}`;
};

// 날짜와 요일 포맷팅 함수 추가
const formatDateWithDay = (date) => {
  if (!date) return '';
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[date.getDay()];
  return (
    <DateContainer>
      <span>{formatDate(date)}</span>
      <DayLabel>{dayName}</DayLabel>
    </DateContainer>
  );
};

const TimelineView = () => {
  // reservationListStore 사용
  const {
    filteredReservations: reservations,
    fetchReservations,
    isLoading: reservationsLoading,
    error: reservationsError,
    startDate,
    endDate,
    setStartDate,
    setEndDate
  } = useReservationListStore();

  const rooms = useRoomStore(state => state.rooms);
  const fetchRooms = useRoomStore(state => state.fetchRooms);
  const roomsLoading = useRoomStore(state => state.isLoading);
  const roomsError = useRoomStore(state => state.error);

  // 현재 주의 시작일 상태
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    return reservationUtils.dateUtils.startOfDay(start);
  });

  // 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 시작일과 종료일 설정
        setStartDate(currentWeekStart);
        setEndDate(currentWeekEnd);
        
        await Promise.all([
          fetchReservations(),
          fetchRooms()
        ]);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, [currentWeekStart]); // currentWeekStart가 변경될 때마다 데이터 다시 로드

  // 주간 이동 핸들러
  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return reservationUtils.dateUtils.startOfDay(newDate);
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return reservationUtils.dateUtils.startOfDay(newDate);
    });
  }, []);

  // 현재 주의 종료일 계산
  const currentWeekEnd = useMemo(() => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    return reservationUtils.dateUtils.endOfDay(endDate);
  }, [currentWeekStart]);

  // 날짜 배열 생성
  const weekDates = useMemo(() => {
    const dates = [];
    const start = new Date(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dates.push(currentDate);
    }
    return dates;
  }, [currentWeekStart]);

  // 예약 데이터 필터링
  const timelineReservations = useMemo(() => {
    if (!reservations || !Array.isArray(reservations)) return [];

    return reservations.filter(reservation => {
      if (!reservation?.check_in_date || !reservation?.check_out_date) return false;

      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      return checkIn <= currentWeekEnd && checkOut >= currentWeekStart;
    });
  }, [reservations, currentWeekStart, currentWeekEnd]);

  // 객실 정렬
  const sortedRooms = useMemo(() => {
    if (!rooms || !Array.isArray(rooms)) return [];
    
    return [...rooms].sort((a, b) => {
      const aNum = parseInt(a.room_number);
      const bNum = parseInt(b.room_number);
      return aNum - bNum;
    });
  }, [rooms]);

  // ReservationCell 컴포넌트
  const ReservationCell = useCallback(({ room, date }) => {
    if (!timelineReservations) return <Cell />;

    const dayReservations = timelineReservations.filter(res => {
      if (!res?.room_id || !res?.check_in_date || !res?.check_out_date) return false;

      const checkIn = new Date(res.check_in_date);
      const checkOut = new Date(res.check_out_date);
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      return res.room_id === room.room_id && 
             checkIn <= currentDate && 
             checkOut >= currentDate;
    });

    return (
      <Cell>
        {dayReservations.map((res) => {
          const checkIn = new Date(res.check_in_date);
          const checkOut = new Date(res.check_out_date);
          const currentDate = new Date(date);
          
          const isCheckInDay = checkIn.toDateString() === currentDate.toDateString();
          const isCheckOutDay = checkOut.toDateString() === currentDate.toDateString();
          const isMiddleDay = !isCheckInDay && !isCheckOutDay;
          const isShortStay = res.stay_type === '대실';

          let position = '0%';
          let width = '100%';
          let label = '';

          if (isShortStay) {
            position = '0%';
            width = '50%';
            label = `대실`;
          } else {
            if (isCheckInDay) {
              position = '50%';
              width = '50%';
              label = `IN ${res.stay_type}`;
            } else if (isCheckOutDay) {
              position = '0%';
              width = '50%';
              label = `${res.stay_type} OUT`;
            } else if (isMiddleDay) {
              position = '0%';
              width = '100%';
              label = '';
            }
          }

          return (
            <ReservationTag
              key={res.reservation_id}
              stayType={res.stay_type}
              style={{
                left: position,
                width: width,
                zIndex: isShortStay ? 2 : 1
              }}
              title={formatTooltip(res)}
            >
              {label}
            </ReservationTag>
          );
        })}
      </Cell>
    );
  }, [timelineReservations]);

  if (reservationsLoading || roomsLoading) {
    return <LoadingSpinner>데이터를 불러오는 중...</LoadingSpinner>;
  }

  if (reservationsError || roomsError) {
    return (
      <ErrorMessage>
        {reservationsError || roomsError}
        <button onClick={() => window.location.reload()}>새로고침</button>
      </ErrorMessage>
    );
  }

  return (
    <TimelineContainer>
      <WeekNavigator>
        <NavigateButton onClick={handlePrevWeek}>이전 주</NavigateButton>
        <WeekDisplay>
          {`${formatDate(currentWeekStart)} - ${formatDate(currentWeekEnd)}`}
        </WeekDisplay>
        <NavigateButton onClick={handleNextWeek}>다음 주</NavigateButton>
      </WeekNavigator>
      
      <>
        <TimelineHeader>
          <HeaderCell>객실</HeaderCell>
          {weekDates.map(date => (
            <HeaderCell key={date.toISOString()}>
              {formatDateWithDay(date)}
            </HeaderCell>
          ))}
        </TimelineHeader>
        <TimelineBody>
          {sortedRooms.map(room => (
            <TimelineRow key={room.room_id}>
              <RoomCell>{room.room_number}호</RoomCell>
              {weekDates.map(date => (
                <ReservationCell 
                  key={`${room.room_id}-${date.toISOString()}`}
                  room={room}
                  date={date}
                />
              ))}
            </TimelineRow>
          ))}
        </TimelineBody>
      </>
    </TimelineContainer>
  );
};

// Styled Components
const TimelineContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  margin: 20px 0;
`;

const TimelineHeader = styled.div`
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  height: 50px;
`;

const HeaderCell = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 600;
  color: #495057;
  border-right: 1px solid #e9ecef;
  background: #f1f3f5;
  font-size: 0.95rem;
  padding: 8px;
  
  &:first-child {
    background: #e9ecef;
  }
  
  &:last-child {
    border-right: none;
  }
`;

const TimelineBody = styled.div`
  display: grid;
  grid-template-rows: repeat(auto-fill, minmax(50px, 1fr));
  border: 1px solid #e9ecef;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
`;

const TimelineRow = styled.div`
  display: grid;
  grid-template-columns: 100px repeat(7, 1fr);
  height: 50px;
  border-bottom: 1px solid #e9ecef;
  
  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9fa;
  }
`;

const RoomCell = styled.div`
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-right: 1px solid #e9ecef;
  font-weight: 500;
  color: #495057;
  font-size: 0.95rem;
`;

const WeekNavigator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
  padding: 12px 0;
`;

const WeekDisplay = styled.div`
  min-width: 300px;
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: #343a40;
  padding: 8px 16px;
  border-radius: 8px;
  background: #f8f9fa;
`;

const NavigateButton = styled.button`
  padding: 10px 20px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  background-color: white;
  color: #495057;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
    border-color: #dee2e6;
    transform: translateY(-1px);
  }

  &:active {
    background-color: #e9ecef;
    transform: translateY(0);
  }
`;

const Cell = styled.div`
  padding: 8px;
  height: 60px;
  position: relative;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
  border-right: 1px solid #e9ecef;

  &:last-child {
    border-right: none;
  }
`;

const ReservationTag = styled.div`
  background-color: ${props => RESERVATION_COLORS[props.stayType] || '#808080'};
  padding: 4px 8px;
  font-size: 0.85rem;
  color: white;
  cursor: pointer;
  position: absolute;
  transition: all 0.2s ease;
  height: calc(100% - 16px);
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  
  &:hover {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #4263eb;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: #e03131;
  background-color: #fff5f5;
  padding: 20px;
  border-radius: 8px;
  margin: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;

  button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background-color: #e03131;
    color: white;
    cursor: pointer;
    
    &:hover {
      background-color: #c92a2a;
    }
  }
`;

const DateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
`;

const DayLabel = styled.span`
  font-size: 0.8rem;
  color: #868e96;
  font-weight: 500;
`;

export default TimelineView;
