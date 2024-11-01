'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import useReservationStore from '../../store/reservationStore';
import useRoomStore from '../../store/roomStore';

const TimelineView = () => {
  const { reservations, isLoading: reservationsLoading, error: reservationsError, fetchReservations } = useReservationStore();
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

  // 초기 데이터 로딩 부분 수정
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('데이터 로딩 시작...');
        await Promise.all([
          fetchReservations(),
          fetchRooms()
        ]);
      } catch (error) {
        console.error('데이터 로딩 에러:', error);
      }
    };
    
    loadData();
  }, [fetchReservations, fetchRooms]); // 의존성 배열 수정

  // 데이터 상태 모니터링을 위한 useEffect 추가
  useEffect(() => {
    if (reservations) {
      console.log('현재 예약 데이터:', reservations);
    }
  }, [reservations]);

  useEffect(() => {
    if (rooms) {
      console.log('현재 객실 데이터:', rooms);
    }
  }, [rooms]);

  // 주간 이동 핸들러
  const handlePrevWeek = () => {
    setCurrentWeekStart(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

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

  // 날짜 포맷팅 헬퍼 함수
  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  // 예약 데이터 필터링 부분 수정
  const timelineReservations = useMemo(() => {
    console.log('타임라인 예약 데이터 계산:', reservations); // 디버깅용
    if (!Array.isArray(reservations)) return [];

    return reservations.filter(reservation => {
      try {
        const checkIn = new Date(reservation.check_in);
        const checkOut = new Date(reservation.check_out);
        
        // 날짜 유효성 검사 추가
        if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
          console.error('잘못된 날짜 형식:', reservation);
          return false;
        }
        
        const isInRange = checkIn <= currentWeekEnd && checkOut >= currentWeekStart;
        console.log('예약 범위 체크:', { checkIn, checkOut, isInRange }); // 디버깅용
        return isInRange;
      } catch (error) {
        console.error('날짜 처리 오류:', error, reservation);
        return false;
      }
    });
  }, [reservations, currentWeekStart, currentWeekEnd]);

  // 날짜 배열 생성 함수 수정
  const dateArray = useMemo(() => {
    const dates = [];
    const start = new Date(currentWeekStart);
    
    // 시작 날짜를 해당 주의 월요일로 조정
    const day = start.getDay();
    const diff = day === 0 ? -6 : 1 - day; // 일요일이면 -6, 아니면 1 - 현재요일
    start.setDate(start.getDate() + diff);
    
    // 7일치 날짜 생성
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      dates.push(currentDate);
    }
    return dates;
  }, [currentWeekStart]);

  // 위치와 너비 계산 함수 수정
  const calculatePosition = useCallback((reservation, date) => {
    const currentDate = new Date(date);
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    if (reservation.stay_type === '대실') {
      return '0%';
    }
    
    if (currentDate.toDateString() === checkIn.toDateString()) {
      return '50%';
    }
    
    if (currentDate.toDateString() === checkOut.toDateString()) {
      return '0%';
    }
    
    return '0%';
  }, []);

  const calculateWidth = useCallback((reservation, date) => {
    if (reservation.stay_type === '대실') {
      return '50%';
    }
    
    const currentDate = new Date(date);
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    if (currentDate.toDateString() === checkIn.toDateString() ||
        currentDate.toDateString() === checkOut.toDateString()) {
      return '50%';
    }
    
    return '100%';
  }, []);

  // 고유한 객실 번호 추출
  const roomNumbers = useMemo(() => {
    if (!Array.isArray(reservations)) return [];
    
    // 모든 예약에서 고유한 객실 번호를 추출하고 정렬
    const uniqueRooms = [...new Set(reservations.map(res => res.room_number))];
    return uniqueRooms.sort((a, b) => a.localeCompare(b));
  }, [reservations]);

  // 모든 객실 번호 정의 (고정)
  const ALL_ROOMS = ['101', '102', '103', '104', '105', '201', '202', '203', '204', '205'];

  // 예약 유형별 색상 정의
  const RESERVATION_COLORS = {
    '대실': '#748ffc',  // 부드러운 파란색
    '숙박': '#ff922b',  // 부드러운 주황색
    '장기': '#51cf66'   // 부드러운 초록색
  };

  // 예약 표시를 위한 컴포넌트 수정
  const ReservationDisplay = ({ reservation, currentDate }) => {
    try {
      const checkIn = parseDate(reservation.check_in);
      const checkOut = parseDate(reservation.check_out);
      const current = currentDate instanceof Date ? currentDate : parseDate(currentDate);
      
      if (!checkIn || !checkOut || !current) return '';

      const isSameDay = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      };

      // 대실인 경우
      if (reservation.stay_type === '대실' && isSameDay(checkIn, checkOut)) {
        return `(IN)${reservation.guest_name}(OUT)`;
      }

      // 숙박/장기인 경우
      if (isSameDay(current, checkIn)) {
        return `(IN)${reservation.guest_name}`;
      } else if (isSameDay(current, checkOut)) {
        return `(OUT)${reservation.guest_name}`;
      } else if (current > checkIn && current < checkOut) {
        return '●';
      }
      
      return '';
    } catch (error) {
      console.error('날짜 표시 오류:', error, { reservation, currentDate });
      return '';
    }
  };

  // 전역 상태로 현재 열린 툴팁의 예약 ID 관리
  const [activeTooltipId, setActiveTooltipId] = useState(null);

  // 문서 클릭 이벤트 핸들러 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.reservation-bar')) {
        setActiveTooltipId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 날짜별 예약 표시를 위한 컴포넌트
  const ReservationBar = ({ reservation, date }) => {
    const isTooltipVisible = activeTooltipId === reservation.id;
    
    const handleClick = (e) => {
      e.stopPropagation(); // 이벤트 버블링 방지
      setActiveTooltipId(isTooltipVisible ? null : reservation.id);
    };

    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    const currentDate = new Date(date);

    const isSameDay = (date1, date2) => {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    };

    // 대실은 항상 왼쪽 50%, 숙박/장기는 체크인은 오른쪽 50%, 체크아웃은 왼쪽 50%
    const getPosition = () => {
      if (reservation.stay_type === '대실') {
        return '0%';
      }
      return isSameDay(currentDate, checkIn) ? '50%' : '0%';
    };

    const style = {
      left: getPosition(),
      width: '50%',
      backgroundColor: RESERVATION_COLORS[reservation.stay_type]
    };

    const getDisplayText = () => {
      if (reservation.stay_type === '대실') {
        return `(IN)${reservation.guest_name} 대실(OUT)`;
      }
      
      if (isSameDay(currentDate, checkIn)) {
        return `(IN)${reservation.guest_name}`;
      }
      
      if (isSameDay(currentDate, checkOut)) {
        return `${reservation.stay_type}(OUT)`;
      }
      
      return '';
    };

    return (
      <StyledReservationBar
        className="reservation-bar"
        style={style}
        onClick={handleClick}
      >
        {getDisplayText()}
        {isTooltipVisible && (
          <Tooltip>
            예약자: {reservation.guest_name}<br />
            객실: {reservation.room_number}호<br />
            예약타입: {reservation.stay_type}<br />
            체크인: {new Date(reservation.check_in).toLocaleString('ko-KR')}<br />
            체크아웃: {new Date(reservation.check_out).toLocaleString('ko-KR')}<br />
            {reservation.memo && `메모: ${reservation.memo}`}
          </Tooltip>
        )}
      </StyledReservationBar>
    );
  };

  // formatTooltip 함수 추가
  const formatTooltip = (reservation) => {
    const checkIn = new Date(reservation.check_in);
    const checkOut = new Date(reservation.check_out);
    
    const formatDateTime = (date) => {
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(date);
    };

    return `
예약자: ${reservation.guest_name}
객실: ${reservation.room_number}호
예약타입: ${reservation.stay_type}
체크인: ${formatDateTime(checkIn)}
체크아웃: ${formatDateTime(checkOut)}
${reservation.memo ? `메모: ${reservation.memo}` : ''}
${reservation.phone ? `연락처: ${reservation.phone}` : ''}
${reservation.adult_count ? `성인: ${reservation.adult_count}명` : ''}
${reservation.child_count ? `아동: ${reservation.child_count}명` : ''}
${reservation.payment_status ? `결제상태: ${reservation.payment_status}` : ''}
`;
  };

  // ALL_ROOMS 대신 rooms 데이터 사용
  const sortedRoomNumbers = useMemo(() => {
    console.log('정렬된 객실 번호 계산:', rooms); // 디버깅용
    if (!Array.isArray(rooms)) return [];
    
    return rooms
      .filter(room => room.status === 'active' || !room.status)
      .sort((a, b) => {
        const aNum = parseInt(a.number);
        const bNum = parseInt(b.number);
        return aNum - bNum;
      })
      .map(room => room.number);
  }, [rooms]);

  // 로딩 상태 처리
  if (reservationsLoading || roomsLoading) {
    console.log('데이터 로딩 중...'); // 디버깅용
    return <LoadingSpinner>데이터를 불러오는 중...</LoadingSpinner>;
  }

  // 에러 처리
  if (reservationsError || roomsError) {
    console.error('에러 발생:', { reservationsError, roomsError }); // 디버깅용
    return <ErrorMessage>{reservationsError || roomsError}</ErrorMessage>;
  }

  // 데이터 존재 여부 체크 추가
  if (!sortedRoomNumbers.length || !timelineReservations.length) {
    console.log('데이터 없음:', { 
      rooms: sortedRoomNumbers.length, 
      reservations: timelineReservations.length 
    }); // 디버깅용
  }

  return (
    <TimelineContainer>
      <WeekNavigator>
        <NavigateButton onClick={handlePrevWeek}>&lt; 이전 주</NavigateButton>
        <WeekDisplay>
          {formatDate(currentWeekStart)} - {formatDate(currentWeekEnd)}
        </WeekDisplay>
        <NavigateButton onClick={handleNextWeek}>다음 주 &gt;</NavigateButton>
      </WeekNavigator>

      <WeekHeader>
        <DayHeader>객실</DayHeader>
        {weekDates.map((date, index) => (
          <DayHeader 
            key={index} 
            className={[6, 0].includes(date.getDay()) ? 'weekend' : ''} // 토(6), 일(0) 체크
          >
            {['월', '화', '수', '목', '금', '토', '일'][date.getDay() === 0 ? 6 : date.getDay() - 1]}
            <div>{date.getDate()}일</div>
          </DayHeader>
        ))}
      </WeekHeader>

      <TimelineBody>
        {sortedRoomNumbers.map((roomNumber) => (
          <RoomRow key={roomNumber}>
            <RoomLabel>{roomNumber}</RoomLabel>
            {weekDates.map((date, index) => (
              <DaySlot key={index}>
                {timelineReservations
                  .filter(res => 
                    res.room_number === roomNumber && 
                    isDateInRange(date, new Date(res.check_in), new Date(res.check_out))
                  )
                  .map(reservation => (
                    <ReservationBar
                      key={reservation.id}
                      reservation={reservation}
                      date={date}
                    />
                  ))}
              </DaySlot>
            ))}
          </RoomRow>
        ))}
      </TimelineBody>
    </TimelineContainer>
  );
};

// Styled Components
const TimelineContainer = styled.div`
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
`;

const ControlHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
`;

const Button = styled.button`
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  
  &:first-child {
    left: 0;
  }
  
  &:last-child {
    right: 0;
  }
  
  &:hover {
    background: #f8f9fa;
  }

  &:active {
    background: #e9ecef;
  }
`;

const WeekHeader = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  gap: 1px;
  margin-bottom: 16px;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
`;

const DayHeader = styled.div`
  text-align: center;
  padding: 12px 8px;
  background-color: #f8f9fa;
  font-weight: 600;
  font-size: 0.9rem;
  color: #495057;
  
  &.weekend {
    color: #fa5252;
    background-color: #fff5f5;
  }
`;

const TimelineBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  background-color: #f1f3f5;
  border-radius: 8px;
  overflow: hidden;
`;

const RoomRow = styled.div`
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 50px; // 높이 줄임
  background-color: white;

  &:not(:last-child) {
    border-bottom: 1px solid #f1f3f5;
  }
`;

const RoomLabel = styled.div`
  padding: 8px;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-right: 1px solid #f1f3f5;
`;

const ReservationSlots = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
`;

const ReservationTrack = styled.div`
  position: relative;
  height: 50%;

  &:first-child {
    border-bottom: 1px dashed #e9ecef;
  }
`;

const Tooltip = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  background-color: white;
  color: #495057;
  padding: 12px;
  border-radius: 8px;
  font-size: 0.8rem;
  white-space: pre-line;
  z-index: 1000;
  min-width: 200px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e9ecef;
  line-height: 1.5;
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

// 시간 기반 위치 계산 함수 추가
const calculateTimePosition = (checkInTime, currentWeekStart) => {
  const start = new Date(currentWeekStart);
  const diff = checkInTime.getTime() - start.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return `${Math.max(0, days * (100 / 16))}%`;
};

// 시간 기반 너비 계산 함수 추가
const calculateTimeWidth = (checkInTime, checkOutTime, currentWeekStart, endDate) => {
  const start = new Date(Math.max(checkInTime, currentWeekStart));
  const end = new Date(Math.min(checkOutTime, endDate));
  const diff = end.getTime() - start.getTime();
  const days = diff / (1000 * 60 * 60 * 24);
  return `${Math.min(100, days * (100 / 16))}%`;
};

// 스타일 컴포넌트 수정
const StyledReservationBar = styled.div`
  position: absolute;
  height: calc(100% - 6px);
  margin: 3px 4px;
  border-radius: 6px;
  color: white;
  font-size: 0.75rem;
  padding: 4px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    z-index: 100;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(-1px);
  }
`;

// 추가 스타일 컴포넌트
const DaySlot = styled.div`
  position: relative;
  height: 100%;
  background-color: white;
  
  &:not(:last-child) {
    border-right: 1px solid #f1f3f5;
  }
`;

// 날짜 범위 체크 헬퍼 함수
const isDateInRange = (date, checkIn, checkOut) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  
  const startDate = new Date(checkIn);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(checkOut);
  endDate.setHours(0, 0, 0, 0);
  
  return targetDate >= startDate && targetDate <= endDate;
};

// 스타일 컴포넌트 추가/수정
const WeekNavigator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 24px;
  padding: 12px 0;
`;

const WeekDisplay = styled.div`
  min-width: 300px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: #495057;
`;

const NavigateButton = styled.button`
  padding: 8px 16px;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: white;
  color: #495057;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background-color: #f8f9fa;
    border-color: #ced4da;
  }

  &:active {
    background-color: #e9ecef;
  }
`;

export default TimelineView;
