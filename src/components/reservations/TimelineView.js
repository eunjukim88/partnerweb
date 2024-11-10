'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useRoomStore from '../../store/roomStore';
import useReservationStore from '../../store/reservationStore';

const RESERVATION_COLORS = {
  '대실': '#748ffc',  // 부드러운 파란색
  '숙박': '#ff922b',  // 부드러운 주황색
  '장기': '#FF763B' 
};

// 날짜 포맷팅 함수 수정
const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit', // 두 자리 월
    day: '2-digit'    // 두 자리 일
  }).format(date);
};

// 툴팁 포맷팅 함수 추가
const formatTooltip = (reservation) => {
  if (!reservation) return '';
  const checkIn = new Date(reservation.check_in_date);
  const checkOut = new Date(reservation.check_out_date);
  return `예약자: ${reservation.guest_name}\n체크인: ${formatDate(checkIn)}\n체크아웃: ${formatDate(checkOut)}\n숙박유형: ${reservation.stay_type}`;
};

const TimelineView = () => {
  const { reservations, isLoading: reservationsLoading, error: reservationsError, fetchReservations, handleSearch } = useReservationStore();
  const { rooms, isLoading: roomsLoading, error: roomsError, fetchRooms } = useRoomStore();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(today);
    start.setDate(today.getDate() + diff);
    start.setHours(0, 0, 0, 0);
    return start;
  });

  // 현재 주의 종료일 계산
  const currentWeekEnd = useMemo(() => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return endDate;
  }, [currentWeekStart]);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchReservations(), fetchRooms()]);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      }
    };
    loadData();
  }, [fetchReservations, fetchRooms]);

  // 주간 이동 핸들러
  const handlePrevWeek = useCallback(() => {
    setCurrentWeekStart(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  }, []);

  const handleNextWeek = useCallback(() => {
    setCurrentWeekStart(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  }, []);

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

  // 예약 데이터 필터링 부분 수정
  const timelineReservations = useMemo(() => {
    if (!Array.isArray(reservations)) return [];

    return reservations.filter(reservation => {
      try {
        // 날짜 문자열을 그대로 Date 객체로 변환
        const checkIn = new Date(reservation.check_in_date);
        const checkOut = new Date(reservation.check_out_date);
        
        // 날짜 범위 체크
        return checkIn <= currentWeekEnd && checkOut >= currentWeekStart;
      } catch (error) {
        console.error('날짜 처리 오류:', error, reservation);
        return false;
      }
    });
  }, [reservations, currentWeekStart, currentWeekEnd]);

  // 중복 제거된 객실 목록 생성
  const uniqueRooms = useMemo(() => {
    if (!Array.isArray(rooms)) return [];
    
    // room_number를 기준으로 중복 제거하고 정렬
    return Array.from(
      new Map(
        rooms
          .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }))
          .map(room => [room.room_number, room])
      ).values()
    );
  }, [rooms]);

  // 객실별 예약 데이터 매핑
  const reservationsByRoom = useMemo(() => {
    if (!Array.isArray(rooms) || !Array.isArray(reservations)) return {};
    
    return rooms.reduce((acc, room) => {
      acc[room.room_id] = reservations.filter(res => 
        res.room_id === room.room_id
      );
      return acc;
    }, {});
  }, [rooms, reservations]);

  // 예약 표시 컴포넌트 수정
  const ReservationCell = ({ room, date }) => {
    const dayReservations = useMemo(() => {
      return timelineReservations.filter(res => {
        const checkIn = new Date(res.check_in_date);
        const checkOut = new Date(res.check_out_date);
        const currentDate = new Date(date);
        
        return res.room_id === room.room_id && 
               checkIn <= currentDate && 
               checkOut >= currentDate;
      });
    }, [room.room_id, date, timelineReservations]);

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
            // 대실인 경우
            position = '0%';
            width = '50%';
            label = `대실`;
          } else {
            // 숙박 또는 장기인 경우
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
  };

  return (
    <TimelineContainer>
      <WeekNavigator>
        <NavigateButton onClick={handlePrevWeek}>이전 주</NavigateButton>
        <WeekDisplay>
          {`${formatDate(currentWeekStart)} - ${formatDate(currentWeekEnd)}`}
        </WeekDisplay>
        <NavigateButton onClick={handleNextWeek}>다음 주</NavigateButton>
      </WeekNavigator>
      {reservationsLoading || roomsLoading ? (
        <LoadingSpinner>데이터를 불러오는 중...</LoadingSpinner>
      ) : reservationsError || roomsError ? (
        <ErrorMessage>{reservationsError || roomsError}</ErrorMessage>
      ) : (
        <>
          <TimelineHeader>
            <HeaderCell>객실</HeaderCell>
            {weekDates.map(date => (
              <HeaderCell key={date.toISOString()}>
                {formatDate(date)}
              </HeaderCell>
            ))}
          </TimelineHeader>
          <TimelineBody>
            {uniqueRooms.map(room => (
              <TimelineRow key={room.room_id}>
                <RoomCell>{room.room_number}</RoomCell>
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
      )}
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
  color: ${props => props.theme.colors.primary};
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  background-color: #fff3f3;
  padding: 20px;
  border-radius: 4px;
  margin: 20px 0;
  text-align: center;
`;

export default TimelineView;
