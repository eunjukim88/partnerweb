'use client'; // 클라이언트 사이드에서 실행되는 컴포넌트임을 명시

import React, { useState, useEffect } from 'react'; // React 및 필요한 훅을 임포트
import styled, { keyframes } from 'styled-components'; // styled-components와 keyframes 임포트
import { MdCreditCard, MdCreditCardOff } from "react-icons/md"; // Material Design 아이콘 임포트
import { IoIosWarning } from "react-icons/io"; // iOS 경고 아이콘 임포트
import WifiIcon from '../WifiIcon'; // WifiIcon 컴포넌트 임포트
import { fetchWifiStrength } from '../../../pages/api/rooms'; // Wi-Fi 강도 조회 API 함수 임포트
import theme from '../../styles/theme'; // 테마 설정 임포트

// RoomCard.js 상단에 추가
const generateRandomCardStatus = () => {
  return Math.random() > 0.5;
};

const generateRandomStatus = () => {
  const statuses = [
    '장기', '숙박', '판매중지', '청소완료',
    '점검중', '점검완료', '청소요청',
    '대실', '청소중', '공실', '예약완료',
    '점검요청'
  ];
  return statuses[Math.floor(Math.random() * statuses.length)];
};

const RoomCard = ({ room }) => { // RoomCard 컴포넌트 정의, room prop을 받음
  const [mainCard, setMainCard] = useState(generateRandomCardStatus());
  const [subCard, setSubCard] = useState(generateRandomCardStatus());

  // 30초마다 랜덤하게 카드 상태만 변경
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setMainCard(generateRandomCardStatus());
      setSubCard(generateRandomCardStatus());
    }, 30000);

    return () => clearInterval(statusInterval);
  }, []);

  const needsCardAlert = !mainCard && !subCard; // 메인 카드와 서브 카드가 모두 없을 경우 경고 필요

  const formatDelayTime = (minutes) => { // 지연 시간을 "HH:MM" 형식으로 변환하는 함수
    const hours = Math.floor(minutes / 60); // 시간 계산
    const mins = minutes % 60; // 분 계산
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`; // 포맷팅된 문자열 반환
  };

  const getCheckInStatus = (room) => { // 체크인 상태를 반환하는 함수
    const activeStatuses = ['longStay', 'overnightStay', 'hourlyStay', 'reservationComplete', 'cleaningRequested']; // 활성 상태 목록
    if (activeStatuses.includes(room.status)) { // room.status가 활성 상태 목록에 포함되는지 확인
      if (room.checkInStatus) { // 체크인 상태가 존재할 경우
        if (room.delay > 0) { // 지연 시간이 있을 경우
          return (
            <>
              체크인 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText> {/* 지연 시간 표시 */}
            </>
          );
        }
        return `체크인 | ${room.checkInStatus}`; // 체크인 상태 표시
      } else if (room.checkOutStatus) { // 체크아웃 상태가 존재할 경우
        if (room.delay > 0) { // 지연 시간이 있을 경우
          return (
            <>
              체크아웃 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText> {/* 지연 시간 표시 */}
            </>
          );
        }
        return '체크아웃'; // 체크아웃 상태 표시
      }
    }
    return null; // 해당 조건에 맞지 않으면 null 반환
  };

  const checkInStatus = getCheckInStatus(room); // 체크인 상태 변수 설정

  return (
    <CardContainer status={room.status}> {/* 상태에 따라 스타일이 변경되는 카드 컨테이너 */}
      <RoomHeader> {/* 방 헤더 섹션 */}
        <RoomInfo> {/* 방 정보 섹션 */}
          <RoomNumber>{room.building}{room.floor}{room.number}호</RoomNumber> {/* 방 번호 표시 */}
          <RoomName>{room.name}</RoomName> {/* 방 이름 표시 */}
        </RoomInfo>
        <WifiIcon /> {/* Wi-Fi가 있는 경우 Wi-Fi 아이콘 표시 */}
      </RoomHeader>
      <StatusSection> {/* 상태 섹션 */}
        <CheckInStatus>
          {checkInStatus} {/* 체크인 상태 표시 */}
        </CheckInStatus>
      </StatusSection>
      <RoomStatus>{getStatusText(room.status)}</RoomStatus> {/* 방 상태 텍스트 표시 */}
      <RoomTimes>
        {room.checkIn} | {room.checkOut} {/* 체크인 및 체크아웃 시간 표시 */}
      </RoomTimes>
      <BottomSection> {/* 하단 섹션 */}
        <MemoSection> {/* 메모 섹션 */}
          <MemoText>{room.memo}</MemoText> {/* 메모 텍스트 표시 */}
        </MemoSection>
        <CardIconsContainer> {/* 카드 아이콘 컨테이너 */}
          {needsCardAlert ? ( // 카드 경고가 필요한 경우
            <AlertAnimation>
              <IoIosWarning size={30} color="#FF0000" /> {/* 경고 아이콘 표시 */}
            </AlertAnimation>
          ) : ( // 카드 경고가 필요하지 않은 경우
            <>
              <CardIconWrapper> {/* 메인 카드 아이콘 래퍼 */}
                <CardLabel>M</CardLabel> {/* 메인 카드 라벨 */}
                <CardIcon active={mainCard}> {/* 메인 카드 활성 상태에 따른 아이콘 */}
                  {mainCard ? <MdCreditCard /> : <MdCreditCardOff />} {/* 메인 카드 상태에 따라 아이콘 변경 */}
                </CardIcon>
              </CardIconWrapper>
              <CardIconWrapper> {/* 서브 카드 아이콘 래퍼 */}
                <CardLabel>S</CardLabel> {/* 서브 카드 라벨 */}
                <CardIcon active={subCard}> {/* 서브 카드 활성 상태에 따른 아이콘 */}
                  {subCard ? <MdCreditCard /> : <MdCreditCardOff />} {/* 서브 카드 상태에 따라 아이콘 변경 */}
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

// 방 번호 스타일링
const RoomNumber = styled.div`
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
    longStay: '장기',
    overnightStay: '숙박',
    salesStopped: '판매중지',
    cleaningComplete: '청소완료',
    underInspection: '점검중',
    inspectionComplete: '점검완료',
    cleaningRequested: '청소요청',
    hourlyStay: '대실',
    cleaningInProgress: '청소중',
    vacant: '공실',
    reservationComplete: '예약완료',
    inspectionRequested: '점검요청'
  };
  return statusMap[status] || status; // 상태에 따른 텍스트 반환, 매핑되지 않으면 상태 자체 반환
};

export default RoomCard; // RoomCard 컴포넌트를 기본 내보내기
