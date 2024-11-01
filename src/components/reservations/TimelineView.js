'use client';

import React, { useMemo } from 'react';
import styled from 'styled-components';
import useReservationStore from '../../store/reservationStore';

const TimelineView = ({ timelineStartDate }) => {
  const { reservations, isLoading, error } = useReservationStore();

  // 시작 날짜와 종료 날짜 설정
  const startDate = useMemo(() => {
    const start = new Date(timelineStartDate);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [timelineStartDate]);

  const endDate = useMemo(() => {
    const end = new Date(timelineStartDate);
    end.setDate(end.getDate() + 6); // 7일간 표시
    end.setHours(23, 59, 59, 999);
    return end;
  }, [timelineStartDate]);

  // 타임라인에 필요한 예약 데이터 필터링
  const timelineReservations = useMemo(() => {
    if (!Array.isArray(reservations)) return [];
    
    return reservations.filter(reservation => {
      const checkIn = new Date(reservation.check_in);
      const checkOut = new Date(reservation.check_out);
      return checkIn <= endDate && checkOut >= startDate;
    });
  }, [reservations, startDate, endDate]);

  if (isLoading) {
    return <LoadingSpinner>데이터를 불러오는 중...</LoadingSpinner>;
  }

  if (error) {
    return <ErrorMessage>{error}</ErrorMessage>;
  }

  return (
    <TimelineContainer>
      {/* 타임라인 헤더 */}
      <TimelineHeader>
        {[...Array(7)].map((_, index) => {
          const date = new Date(startDate);
          date.setDate(date.getDate() + index);
          return (
            <DayColumn key={index}>
              {date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
              })}
            </DayColumn>
          );
        })}
      </TimelineHeader>

      {/* 예약 표시 영역 */}
      <TimelineBody>
        {timelineReservations.map(reservation => (
          <ReservationBar
            key={reservation.id}
            reservation={reservation}
            startDate={startDate}
            endDate={endDate}
          />
        ))}
      </TimelineBody>
    </TimelineContainer>
  );
};

const TimelineContainer = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const TimelineHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
`;

const DayColumn = styled.div`
  text-align: center;
  padding: 8px;
  font-weight: 500;
  color: #495057;
`;

const TimelineBody = styled.div`
  position: relative;
  min-height: 200px;
  padding: 20px 0;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: ${props => props.theme.colors.primary};
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.colors.danger};
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  border-radius: 4px;
  margin: 20px 0;
`;

const ReservationBar = styled.div`
  position: absolute;
  height: 30px;
  background-color: ${props => props.theme.colors.primary};
  border-radius: 4px;
  padding: 4px 8px;
  color: white;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.theme.colors.primary}dd;
    transform: translateY(-1px);
  }
`;

export default TimelineView;
