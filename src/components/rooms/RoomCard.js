'use client'; // 클라이언트 사이드에서 실행되는 컴포넌트임을 명시

import React, { useState, useEffect } from 'react'; // React 및 필요한 훅을 임포트
import styled, { keyframes } from 'styled-components'; // styled-components와 keyframes 임포트
import { MdCreditCard, MdCreditCardOff } from "react-icons/md"; // Material Design 아이콘 임포트
import { IoIosWarning } from "react-icons/io"; // iOS 경고 아이콘 임포트
import useRoomStore from '@/src/store/roomStore';
import WifiIcon from '../WifiIcon'; // WifiIcon 컴포넌트 임포트
import theme from '../../styles/theme'; // 테마 설정 임포트
import useReservationSettingsStore from '@/src/store/reservationSettingsStore';

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
  const [mainCard, setMainCard] = useState(generateRandomCardStatus());
  const [subCard, setSubCard] = useState(generateRandomCardStatus());
  const { settings } = useReservationSettingsStore();

  useEffect(() => {
    const statusInterval = setInterval(() => {
      setMainCard(generateRandomCardStatus());
      setSubCard(generateRandomCardStatus());
    }, 30000);

    return () => clearInterval(statusInterval);
  }, []);

  if (!room) return null;

  const needsCardAlert = !mainCard && !subCard;

  const getReservationTimes = () => {
    if (room.status === 'vacant') return null;

    const stayType = room.status === 'hourlyStay' ? 'hourly' : 
                    room.status === 'overnightStay' ? 'nightly' : 
                    room.status === 'longStay' ? 'long_term' : null;

    if (!stayType || !settings[stayType]) return null;

    const checkInTime = settings[stayType].check_in_time;
    const checkOutTime = settings[stayType].check_out_time;

    return `${checkInTime} ~ ${checkOutTime}`;
  };

  return (
    <CardContainer status={room.status || 'vacant'}>
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
        {room.hasWifi && <WifiIcon />}
      </RoomHeader>
      <StatusSection>
        <RoomStatus>
          {getStatusText(room.status)}
        </RoomStatus>
      </StatusSection>
      <RoomTimes>
        {getReservationTimes()}
      </RoomTimes>
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
  background-color: ${props => theme.colors[props.status] || '#B3B3B3'}; // 상태에 따라 배경색 변경
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
  justify-content: center;
  height: 180px;
`;

// 방 헤더 스타일링
const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  margin: 5px 0;
  text-align: center; // 텍스트 가운데 정렬
`;

// 방 시간 표시 스타일링
const RoomTimes = styled.div`
  text-align: center;
  font-size: 14px;
  margin: 5px 0;
`;

// 하단 섹션 스타일링
const BottomSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

// 메모 섹션 스타일링
const MemoSection = styled.div`
  width: calc(100% - 90px);
  max-height: 2.8em;
  overflow: hidden;
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

export default RoomCard; // RoomCard 컴포넌트를 기본 내보내기

