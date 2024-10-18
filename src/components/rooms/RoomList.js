import React from 'react';
import styled from 'styled-components';
import { IoIosWarning } from "react-icons/io";
import WifiIcon from '../WifiIcon';
import theme from '../../styles/theme';
import { MdCreditCard, MdCreditCardOff } from "react-icons/md";

const RoomList = ({ rooms, onEditRoom }) => { // RoomList 컴포넌트 정의, rooms와 onEditRoom을 props로 받음
  const getCheckInStatus = (room) => { // 체크인 상태를 반환하는 함수
    const activeStatuses = ['longStay', 'overnightStay', 'hourlyStay', 'reservationComplete', 'cleaningRequested']; // 활성 상태 목록
    if (activeStatuses.includes(room.status)) { // room.status가 활성 상태에 포함되는지 확인
      if (room.checkInStatus) { // 체크인 상태가 있는지 확인
        if (room.delay) { // 지연 시간이 있는지 확인
          return (
            <>
              체크인 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText> {/* 체크인 상태와 지연 시간 표시 */}
            </>
          );
        }
        return `체크인 | ${room.checkInStatus}`; // 체크인 상태만 표시
      } else if (room.checkOutStatus) { // 체크아웃 상태가 있는지 확인
        if (room.delay) { // 지연 시간이 있는지 확인
          return (
            <>
              체크아웃 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText> {/* 체크아웃 상태와 지연 시간 표시 */}
            </>
          );
        }
        return '체크아웃'; // 체크아웃 상태만 표시
      }
    }
    return null; // 조건에 맞지 않으면 null 반환
  };

  const formatDelayTime = (minutes) => { // 지연 시간을 "HH:MM" 형식으로 변환하는 함수
    const hours = Math.floor(minutes / 60); // 시간 계산
    const mins = minutes % 60; // 분 계산
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`; // 포맷된 문자열 반환
  };

  const getStatusText = (status) => { // 상태 텍스트를 반환하는 함수
    const statusMap = { // 상태와 텍스트 매핑
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
    return statusMap[status] || status; // 매핑된 텍스트 반환, 없으면 상태 자체 반환
  };

  const getStatusColor = (status) => { // 상태에 따른 색상을 반환하는 함수
    const statusColors = { // 상태와 색상 매핑
      longStay: theme.colors.longStay,
      overnightStay: theme.colors.overnightStay,
      salesStopped: theme.colors.salesStopped,
      cleaningComplete: theme.colors.cleaningComplete,
      underInspection: theme.colors.underInspection,
      inspectionComplete: theme.colors.inspectionComplete,
      cleaningRequested: theme.colors.cleaningRequested,
      hourlyStay: theme.colors.hourlyStay,
      cleaningInProgress: theme.colors.cleaningInProgress,
      vacant: theme.colors.vacant,
      reservationComplete: theme.colors.reservationComplete,
      inspectionRequested: theme.colors.inspectionRequested
    };
    return statusColors[status] || theme.colors.default; // 매핑된 색상 반환, 없으면 기본 색상 반환
  };

  const getStatusTextColor = (status) => { // 상태에 따른 텍스트 색상을 반환하는 함수
    // 검은색 글씨를 사용할 상태들
    const blackTextStatuses = ['underInspection', 'inspectionRequested'];
    return blackTextStatuses.includes(status) ? 'black' : 'white'; // 해당 상태면 검은색, 아니면 흰색
  };

  return (
    <TableContainer> {/* 테이블 컨테이너 */}
      <Table> {/* 테이블 */}
        <thead>
          <tr>
            <Th>예약 객실</Th> {/* 예약 객실 헤더 */}
            <Th>객실 이름</Th> {/* 객실 이름 헤더 */}
            <Th>체크인 상태</Th> {/* 체크인 상태 헤더 */}
            <Th>예약 시간</Th> {/* 예약 시간 헤더 */}
            <Th>네트워크 상태</Th> {/* 네트워크 상태 헤더 */}
            <Th>카드키 상태</Th> {/* 카드키 상태 헤더 */}
            <Th>객실 상태</Th> {/* 객실 상태 헤더 */}
            <Th>관리자 메모</Th> {/* 관리자 메모 헤더 */}
            <Th>수정</Th> {/* 수정 헤더 */}
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => ( // rooms 배열을 순회하며 각 방에 대한 행을 생성
            <tr key={room.id}>
              <Td>{room.name}</Td> {/* 객실 이름 표시 */}
              <Td>{getCheckInStatus(room)}</Td> {/* 체크인 상태 표시 */}
              <Td>{room.checkIn} | {room.checkOut}</Td> {/* 체크인 및 체크아웃 시간 표시 */}
              <Td><WifiIcon strength={room.wifiStrength} /></Td> {/* Wi-Fi 상태 아이콘 표시 */}
              <Td>
                    {!room.mainCard && !room.subCard ? (
                        <AlertIcon>
                        <IoIosWarning size={20} color="#FF0000" />
                        </AlertIcon>
                    ) : (
                        <CardIconsContainer>
                        <CardIconWrapper>
                            <CardLabel>M</CardLabel>
                            <CardIcon active={room.mainCard}>
                            {room.mainCard ? <MdCreditCard /> : <MdCreditCardOff />}
                            </CardIcon>
                        </CardIconWrapper>
                        <CardIconWrapper>
                            <CardLabel>S</CardLabel>
                            <CardIcon active={room.subCard}>
                            {room.subCard ? <MdCreditCard /> : <MdCreditCardOff />}
                            </CardIcon>
                        </CardIconWrapper>
                        </CardIconsContainer>
                    )}
                    </Td>
              <Td>
                <StatusBadge 
                  color={getStatusColor(room.status)} // 상태에 따른 배경색 설정
                  textColor={getStatusTextColor(room.status)} // 상태에 따른 텍스트 색상 설정
                >
                  {getStatusText(room.status)} {/* 상태 텍스트 표시 */}
                </StatusBadge>
              </Td>
              <Td>{room.memo}</Td> {/* 관리자 메모 표시 */}
              <Td>
                <EditButton onClick={() => onEditRoom(room)}> {/* 수정 버튼, 클릭 시 onEditRoom 함수 호출 */}
                  수정
                </EditButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableContainer>
  );
};

// 상태 배지 스타일링
const StatusBadge = styled.span`
  background-color: ${props => props.color}; // 배경색 설정
  color: ${props => props.textColor}; // 텍스트 색상 설정
  padding: 4px 8px; // 내부 여백 설정
  width: 100px; // 너비 설정
  height: 30px; // 높이 설정
  border-radius: 12px; // 모서리 반경 설정
  font-size: 16px; // 폰트 크기 설정
  font-weight: bold; // 폰트 두께 설정
`;

// 테이블 컨테이너 스타일링
const TableContainer = styled.div`
  overflow-x: auto; // 가로 스크롤 허용
`;

// 테이블 스타일링
const Table = styled.table`
  width: 100%; // 너비 100% 설정
  border-collapse: collapse; // 테두리 간격 제거
`;

// 테이블 헤더 스타일링
const Th = styled.th`
  background-color: #f2f2f2; // 배경색 설정
  padding: 12px; // 내부 여백 설정
  text-align: center; // 텍스트 가운데 정렬
  border-bottom: 2px solid #ddd; // 아래 테두리 설정
`;

// 테이블 데이터 셀 스타일링
const Td = styled.td`
  padding: 12px; // 내부 여백 설정
  border-bottom: 1px solid #ddd; // 아래 테두리 설정
  text-align: center; // 텍스트 가운데 정렬
  vertical-align: middle; // 수직 정렬 중간
`;

// 경고 아이콘 컨테이너 스타일링
const AlertIcon = styled.div`
  display: flex; // Flexbox 레이아웃 사용
  justify-content: center; // 수평 중앙 정렬
  align-items: center; // 수직 중앙 정렬
`;

// 수정 버튼 스타일링
const EditButton = styled.button`
  background-color: #4CAF50; // 배경색 설정
  border: none; // 테두리 제거
  color: white; // 텍스트 색상 설정
  padding: 5px 10px; // 내부 여백 설정
  text-align: center; // 텍스트 가운데 정렬
  text-decoration: none; // 텍스트 장식 제거
  display: inline-block; // 인라인 블록 디스플레이
  font-size: 14px; // 폰트 크기 설정
  margin: 2px 2px; // 외부 여백 설정
  cursor: pointer; // 마우스 커서를 포인터로 변경
  border-radius: 3px; // 모서리 반경 설정
`;

// 지연 시간 텍스트 스타일링
const DelayText = styled.span`
  color: #FF6B6B; // 텍스트 색상 설정
  font-weight: bold; // 폰트 두께 설정
`;

const CardIconsContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
`;

const CardIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const CardLabel = styled.span`
  color: #333333;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 2px;
`;

const CardIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.active ? '#333333' : '#FFFFFF'};
  font-size: 20px;
transform: rotate(90deg);
`;

export default RoomList; // RoomList 컴포넌트를 기본 내보내기
