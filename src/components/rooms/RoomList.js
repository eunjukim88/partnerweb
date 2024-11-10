import React, { useState } from 'react';
import styled from 'styled-components';
import { IoIosWarning } from "react-icons/io";
import { FaEdit } from "react-icons/fa";
import WifiIcon from '../WifiIcon';
import theme from '../../styles/theme';
import { MdCreditCard, MdCreditCardOff } from "react-icons/md";
import useRoomStore from '../../store/roomStore';
import RoomStatusModal from './RoomStatusModal';

const RoomList = ({ rooms }) => {
  const { getRoomStatus } = useRoomStore();
  const [selectedRoom, setSelectedRoom] = useState(null);

  const getStatusText = (status) => {
    const statusMap = {
      longStay: '장기',
      overnightStay: '숙박',
      hourlyStay: '대실',
      vacant: '공실',
      reservationComplete: '예약완료',
      cleaningRequested: '청소요청',
      cleaningInProgress: '청소중',
      cleaningComplete: '청소완료',
      inspectionRequested: '점검요청',
      underInspection: '점검중',
      inspectionComplete: '점검완료',
      salesStopped: '판매중지'
    };
    return statusMap[status] || status;
  };

  const formatTime = (time) => {
    if (!time) return '';
    return time.slice(0, 5);
  };

  const handleEditClick = (room) => {
    setSelectedRoom(room);
  };

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>객실 정보</Th>
            <Th>객실 상태</Th>
            <Th>예약 시간</Th>
            <Th>WiFi</Th>
            <Th>카드키</Th>
            <Th>메모</Th>
            <Th>관리</Th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => {
            const currentReservation = room.currentReservation;
            const needsCardAlert = !room.mainCard && !room.subCard;
            const roomStatus = getRoomStatus(room.room_id);

            return (
              <tr key={room.room_id}>
                <Td>
                  <RoomInfo>
                    {room.show_building && room.room_building && `${room.room_building} `}
                    {room.show_floor && room.room_floor && `${room.room_floor}층 `}
                    {room.room_number}호
                    {room.show_name && room.room_name && ` (${room.room_name})`}
                    {room.show_type && room.room_type && ` [${room.room_type}]`}
                  </RoomInfo>
                </Td>
                <Td>
                  <StatusBadge 
                    color={theme.colors[roomStatus.status] || theme.colors.vacant}
                    textColor={['underInspection', 'inspectionRequested'].includes(roomStatus.status) ? 'black' : 'white'}
                  >
                    {getStatusText(roomStatus.status)}
                  </StatusBadge>
                </Td>
                <Td>
                  {currentReservation && (
                    `${formatTime(currentReservation.check_in_time)} ~ ${formatTime(currentReservation.check_out_time)}`
                  )}
                </Td>
                <Td>
                  <WifiIcon />
                </Td>
                <Td>
                  {needsCardAlert ? (
                    <AlertIcon>
                      <IoIosWarning size={20} color="#FF0000" />
                    </AlertIcon>
                  ) : (
                    <CardIconsContainer>
                      <CardIconWrapper>
                        <CardLabel>M</CardLabel>
                        <CardIcon active={roomStatus.mainCard}>
                          {roomStatus.mainCard ? <MdCreditCard /> : <MdCreditCardOff />}
                        </CardIcon>
                      </CardIconWrapper>
                      <CardIconWrapper>
                        <CardLabel>S</CardLabel>
                        <CardIcon active={roomStatus.subCard}>
                          {roomStatus.subCard ? <MdCreditCard /> : <MdCreditCardOff />}
                        </CardIcon>
                      </CardIconWrapper>
                    </CardIconsContainer>
                  )}
                </Td>
                <Td>{room.memo}</Td>
                <Td>
                  <EditButton onClick={() => handleEditClick(room)}>
                    <FaEdit /> 수정
                  </EditButton>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {selectedRoom && (
        <RoomStatusModal
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </TableContainer>
  );
};

const StatusBadge = styled.span`
  background-color: ${props => props.color};
  color: ${props => props.textColor};
  padding: 4px 8px;
  width: 100px;
  height: 30px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background-color: #f2f2f2;
  padding: 12px;
  text-align: center;
  border-bottom: 2px solid #ddd;
`;

const Td = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  text-align: center;
  vertical-align: middle;
`;

const AlertIcon = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const RoomInfo = styled.span`
  color: #333333;
  font-size: 14px;
  font-weight: bold;
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

const EditButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background-color: ${theme.colors.primary};
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    opacity: 0.9;
  }

  svg {
    font-size: 16px;
  }
`;

export default RoomList;
