'use client'; // 클라이언트 사이드에서 실행되는 컴포넌트임을 명시

import React, { useState, useEffect, useCallback } from 'react'; // React 및 필요한 훅을 임포트
import styled, { keyframes } from 'styled-components'; // styled-components와 keyframes 임포트
import { MdCreditCard, MdCreditCardOff } from "react-icons/md"; // Material Design 아이콘 임포트
import { IoIosWarning } from "react-icons/io"; // iOS 경고 아이콘 임포트
import WifiIcon from '../WifiIcon'; // WifiIcon 컴포넌트 임포트
import theme from '../../styles/theme'; // 테마 설정 임포트
import useReservationSettingsStore from '@/src/store/reservationSettingsStore';
import useReservationStore from '@/src/store/reservationStore';
import RoomStatusModal from './RoomStatusModal';
import ReservationModal from '../reservations/ReservationModal';
import useReservationDisplayStore from '../../store/reservationDisplayStore';
import axios from 'axios';
import useRoomStore from '@/src/store/roomStore';

// RoomCard.js 상단에 추가
const generateRandomCardStatus = () => {
  return Math.random() > 0.5;
};


const RoomNumberDisplay = ({ building, floor, number, name, type, display }) => {
  let displayText = number ? `${number}호` : '';
  
  if (display?.show_building && building) {
    displayText = `${building} ${displayText}`;
  }
  if (display?.show_floor && floor) {
    displayText = `${floor}층 ${displayText}`;
  }
  
  return (
    <RoomInfo>
      <StyledRoomNumber>{displayText}</StyledRoomNumber>
      {display?.show_name && name && (
        <RoomName>{name}</RoomName>
      )}
      {display?.show_type && type && (
        <RoomName>{type}</RoomName>
      )}
    </RoomInfo>
  );
};

const RoomCard = ({ room }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mainCard, setMainCard] = useState(generateRandomCardStatus());
  const [subCard, setSubCard] = useState(generateRandomCardStatus());
  const [roomStatus, setRoomStatus] = useState(room?.room_status || null);
  const { settings } = useReservationSettingsStore();
  const { reservations, isLoading: reservationsLoading } = useReservationStore();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const { setSelectedReservation } = useReservationDisplayStore();
  const { getRoomReservationStatus } = useReservationDisplayStore();
  const { rooms, updateRoom } = useRoomStore();

  // 현재 객실의 예약 상태를 확인하는 함수
  const checkRoomReservation = useCallback(() => {
    if (!room || !reservations) return null;

    const now = new Date();
    const currentReservation = reservations.find(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      return reservation.room_id === room.room_id &&
             checkIn <= now &&
             checkOut >= now;
    });

    return currentReservation;
  }, [room, reservations]);

  // 객실 상태 초기화 및 업데이트
  useEffect(() => {
    if (reservationsLoading) return;

    const initializeRoomStatus = async () => {
      setIsLoading(true);
      try {
        // 1. room_status가 있는 경우
        if (room.room_status) {
          setRoomStatus(room.room_status);
          return;
        }

        // 2. 현재 예약 확인
        const currentReservation = checkRoomReservation();
        if (currentReservation) {
          const newStatus = 
            currentReservation.stay_type === '대실' ? 'hourlyStay' :
            currentReservation.stay_type === '숙박' ? 'overnightStay' :
            currentReservation.stay_type === '장기' ? 'longStay' : 'reservationComplete';
          
          setRoomStatus(newStatus);
        } else {
          // 3. 예약이 없는 경우 공실로 설정
          setRoomStatus('vacant');
        }
      } catch (error) {
        console.error('객실 상태 초기화 실패:', error);
        setRoomStatus('vacant');
      } finally {
        setIsLoading(false);
      }
    };

    initializeRoomStatus();
  }, [room, reservations, reservationsLoading, checkRoomReservation]);

  // 카드 상태 업데이트 인터벌 - 항상 실행되도록 수정
  useEffect(() => {
    let intervalId;
    
    if (roomStatus === 'vacant') {
      intervalId = setInterval(() => {
        setMainCard(generateRandomCardStatus());
        setSubCard(generateRandomCardStatus());
      }, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [roomStatus]);

  if (isLoading || reservationsLoading) {
    return (
      <CardContainer status="loading">
        <LoadingSpinner />
      </CardContainer>
    );
  }

  if (!room) return null;

  const needsCardAlert = !mainCard && !subCard;

  // 시간 포맷 함수 추가
  const formatTime = (time) => {
    if (!time) return '';
    // 시간 문자열에서 HH:mm 부분만 추출
    return time.slice(0, 5);
  };

  // 지연 상태를 체크하는 함수 수정
  const checkDelayStatus = (checkInTime, checkOutTime, stayType) => {
    if (!checkInTime || !checkOutTime) return { isDelayed: false, type: null };
    
    const now = new Date();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const [inHours, inMinutes] = checkInTime.slice(0, 5).split(':');
    const [outHours, outMinutes] = checkOutTime.slice(0, 5).split(':');
    
    let checkInDate = new Date();
    let checkOutDate = new Date();
    
    // 체크인 시간 설정
    checkInDate.setHours(parseInt(inHours), parseInt(inMinutes), 0);
    
    // 체크아웃 시간 설정 (숙박/장기의 경우 다음날)
    if (stayType === 'hourlyStay') {
      checkOutDate.setHours(parseInt(outHours), parseInt(outMinutes), 0);
    } else {
      // 숙박, 장기의 경우 다음날
      checkOutDate = new Date(tomorrow);
      checkOutDate.setHours(parseInt(outHours), parseInt(outMinutes), 0);
    }
    
    // 현재 시간과 비교
    if (stayType === 'hourlyStay') {
      // 대실의 경우 당일 기준으로 비교
      if (now > checkOutDate) {
        return { isDelayed: true, type: 'checkout' };
      } else if (now > checkInDate) {
        return { isDelayed: true, type: 'checkin' };
      }
    } else {
      // 숙박/장기의 경우
      const isToday = now.getDate() === today.getDate();
      const isTomorrow = now.getDate() === tomorrow.getDate();
      
      if (isToday && now > checkInDate) {
        return { isDelayed: true, type: 'checkin' };
      } else if (isTomorrow && now > checkOutDate) {
        return { isDelayed: true, type: 'checkout' };
      }
    }
    
    return { isDelayed: false, type: null };
  };

  const getReservationTimes = () => {
    if (roomStatus === 'vacant') return null;

    let timeText = '';
    let delayStatus = { isDelayed: false, type: null };

    switch(roomStatus) {
      case 'hourlyStay':
        if (settings?.['대실']?.check_in_time && settings?.['대실']?.check_out_time) {
          timeText = `${formatTime(settings['대실'].check_in_time)} ~ ${formatTime(settings['대실'].check_out_time)}`;
          delayStatus = checkDelayStatus(settings['대실'].check_in_time, settings['대실'].check_out_time, 'hourlyStay');
        } else {
          timeText = '대실 시간 미설정';
        }
        break;
      
      case 'overnightStay':
        if (settings?.['숙박']?.check_in_time && settings?.['숙박']?.check_out_time) {
          timeText = `${formatTime(settings['숙박'].check_in_time)} ~ ${formatTime(settings['숙박'].check_out_time)}`;
          delayStatus = checkDelayStatus(settings['숙박'].check_in_time, settings['숙박'].check_out_time, 'overnightStay');
        } else {
          timeText = '숙박 시간 미설정';
        }
        break;
      
      case 'longStay':
        if (settings?.['장기']?.check_in_time && settings?.['장기']?.check_out_time) {
          timeText = `${formatTime(settings['장기'].check_in_time)} ~ ${formatTime(settings['장기'].check_out_time)}`;
          delayStatus = checkDelayStatus(settings['장기'].check_in_time, settings['장기'].check_out_time, 'longStay');
        } else {
          timeText = '장기 시간 미설정';
        }
        break;
      
      default:
        return null;
    }

    return (
      <RoomTimes>
        <TimeText isDelayed={delayStatus.isDelayed}>
          {timeText}
          {delayStatus.isDelayed && (
            <DelayedBadge>
              {delayStatus.type === 'checkin' ? '체크인 지연' : '체크아웃 지연'}
            </DelayedBadge>
          )}
        </TimeText>
      </RoomTimes>
    );
  };

  // 카드 클릭 핸들러
  const handleCardClick = () => {
    setIsStatusModalOpen(true);
  };

  // 상태 변경 핸들러
  const handleStatusChange = async (newStatus) => {
    try {
      const response = await axios.put(`/api/rooms/status`, {
        room_id: room.room_id,
        room_status: newStatus
      });

      if (response.status === 200) {
        setRoomStatus(newStatus);
        
        // 공실로 변경 시 예약 정보 초기화
        if (newStatus === 'vacant') {
          setSelectedReservation(null);
        }
        return true;
      }
    } catch (error) {
      console.error('상태 변경 실패:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '상태 변경에 실패했습니다.');
    }
  };

  // 메모 변경 핸들러
  const handleMemoChange = async (newMemo) => {
    try {
      const response = await axios.put(`/api/rooms/memo`, {
        room_id: room.room_id,
        memo: newMemo
      });

      if (response.status === 200) {
        return true;
      }
    } catch (error) {
      console.error('메모 저장 실패:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || '메모 저장에 실패했습니다.');
    }
  };

  const handleReservationClick = () => {
    setIsStatusModalOpen(false);
    setIsReservationModalOpen(true);
  };

  // 현재 객실의 예약 상태 확인
  const currentReservation = getRoomReservationStatus(room.room_id);

  return (
    <>
      <CardContainer 
        status={room.room_status || roomStatus} 
        onClick={handleCardClick}
      >
        <RoomHeader>
          <RoomNumberDisplay 
            building={room.room_building}
            floor={room.room_floor}
            number={room.room_number}
            name={room.room_name}
            type={room.room_type}
            display={{
              show_building: room.show_building,
              show_floor: room.show_floor,
              show_name: room.show_name,
              show_type: room.show_type
            }}
          />
          <IconContainer>
            <WifiIcon />
          </IconContainer>
        </RoomHeader>
        <StatusSection>
          <RoomStatus>
            {getStatusText(roomStatus)}
          </RoomStatus>
        </StatusSection>
        {getReservationTimes()}
        <BottomSection>
          <MemoSection>
            <MemoText>{room.memo || ''}</MemoText>
          </MemoSection>
          <CardIconsContainer>
            {needsCardAlert ? (
              <AlertAnimation>
                <IoIosWarning size={30} color="#FF0000" />
              </AlertAnimation>
            ) : (
              <>
                <CardIconWrapper>
                  <CardLabel>M</CardLabel>
                  <CardIcon active={mainCard}>
                    {mainCard ? <MdCreditCard /> : <MdCreditCardOff />}
                  </CardIcon>
                </CardIconWrapper>
                <CardIconWrapper>
                  <CardLabel>S</CardLabel>
                  <CardIcon active={subCard}>
                    {subCard ? <MdCreditCard /> : <MdCreditCardOff />}
                  </CardIcon>
                </CardIconWrapper>
              </>
            )}
          </CardIconsContainer>
        </BottomSection>
      </CardContainer>

      {isStatusModalOpen && (
        <RoomStatusModal
          room={room}
          onClose={() => setIsStatusModalOpen(false)}
          onStatusChange={handleStatusChange}
          onReservationClick={handleReservationClick}
          onMemoChange={handleMemoChange}
        />
      )}

      {isReservationModalOpen && (
        <ReservationModal
          isEdit={!!currentReservation}
          initialData={currentReservation}
          onClose={() => setIsReservationModalOpen(false)}
          onSave={() => {
            setIsReservationModalOpen(false);
            // 필요한 경우 데이터 리프레시
          }}
        />
      )}
    </>
  );
};

// 깜박임 애니메이션 정의
const blink = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

// 흔들림 애니메이션 정의
const shake = keyframes`
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  50% { transform: translateX(5px); }
  75% { transform: translateX(-5px); }
  100% { transform: translateX(0); }
`;

// 체크인 상태 스타일링
const CheckInStatus = styled.div`
  font-size: 14px;
  font-weight: bold;
  color: inherit;
  text-align: center; // 텍스트 가운데 정렬
`;

// 상태 섹션 스타일링
const StatusSection = styled.div`
  height: 20px; // 고정 높이 설정
  margin: 5px 0;
  display: flex;
  justify-content: center; // 가운데 정렬
  align-items: center; // 세로 중앙 정렬
`;

// 지연 시간 텍스트 스타일링
const DelayText = styled.span`
  color: black;
  font-weight: bold;
  animation: ${blink} 1s infinite, ${shake} 0.82s cubic-bezier(.36,.07,.19,.97) both infinite; // 깜박임 및 흔들림 애니메이션 적용
`;

// 카드 컨테이너 스타일링
const CardContainer = styled.div`
  background-color: ${props => 
    props.status === 'loading' 
      ? '#f5f5f5' 
      : theme.colors[props.status] || theme.colors.vacant};
  color: ${props => 
    props.status === 'underInspection' || props.status === 'inspectionRequested' 
      ? '#000000' 
      : props.status === 'inspectionComplete'
        ? '#FFFFFF'
        : '#FFFFFF'
  }; // 상태에 따라 텍스트 색상 변경
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 180px;
  position: relative;
`;

// 방 헤더 스타일링
const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

// 방 정보 스타일링
const RoomInfo = styled.div`
  display: flex;
  align-items: center;
`;

// 방 번호 스타일링 (이름 변경)
const StyledRoomNumber = styled.div`
  font-size: 20px;
  font-weight: bold;
  margin-right: 10px;
`;

// 방 이름 스타일링
const RoomName = styled.div`
  font-size: 20px;
  text-align: center;
`;

// 방 상태 텍스트 스타일링
const RoomStatus = styled.div`
  font-size: 25px;
  font-weight: bold;
  color: inherit;
  text-align: center; // 텍스트 가운데 정
`;

// 방 시간 표시 스타일링
const RoomTimes = styled.div`
  text-align: center;
  margin: 10px 0;
  min-height: 20px; // 시간이 없을 때도 공간 유지
  color: inherit;
`;

// 하단 섹션 스타일링
const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: auto;
`;

// 메모 섹션 스링
const MemoSection = styled.div`
  width: calc(100% - 90px);
  max-height: 2.8em;
  overflow: hidden;
  margin-bottom: 5px;
`;

// 메모 텍스트 스타일링
const MemoText = styled.div`
  font-size: 14px;
  color: inherit;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// 카드 아이콘 컨테이너 스타일링
const CardIconsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 5px;
  padding: 3px;
  width: 60px;
  height: 40px;
`;

// 카드 아이콘 래퍼 스타일링
const CardIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// 카드 라벨 스타일링
const CardLabel = styled.span`
  color: #333333;
  font-size: 14px;
  font-weight: bold;
`;

// 카드 아이콘 스타일링
const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.active ? '#333333' : '#FFFFFF'}; // 활성 상태에 따라 색상 변경
  font-size: 25px;
  transform: rotate(90deg); // 아이콘 회전
`;

// 깜박임 애니메이션 정의
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
`;

// 경고 애니메이션 스타일링
const AlertAnimation = styled.div`
  animation: ${pulse} 1s infinite; // 깜박임 애니메이션 적용
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
`;

// 상태 텍스트를 반환하는 함수
const getStatusText = (status) => {
  const statusMap = {
    vacant: '공실',
    hourlyStay: '대실',
    overnightStay: '숙박',
    longStay: '장기',
    cleaningRequested: '청소요청',
    cleaningInProgress: '청소중',
    cleaningComplete: '청소완료',
    salesStopped: '판매중지',
    inspectionRequested: '점검요청',
    inspectionComplete: '점검완료',
    underInspection: '점검중',
    reservationComplete: '예약완료'
  };
  return statusMap[status] || '공실';
};

const IconContainer = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

// 스타일 컴포넌트 추가
const TimeText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: ${props => props.isDelayed ? 'bold' : 'normal'};
`;

// 배경색만 깜빡이는 애니메이션 정의
const backgroundBlink = keyframes`
  0% { background-color: #00838F; }
  50% { background-color: #006064; }
  100% { background-color: #00838F; }
`;

const DelayedBadge = styled.span`
  display: inline-block;
  background-color: #00838F; // 청록색 계열
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  animation: ${backgroundBlink} 1.5s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(0, 131, 143, 0.5);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

// 로딩 상태를 위한 스타일 컴포넌트 추가
const LoadingSpinner = styled.div`
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: auto;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export default RoomCard; // RoomCard 컴포넌트를 기 내보내기

