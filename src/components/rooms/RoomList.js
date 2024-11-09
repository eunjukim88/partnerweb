import React, { useState } from 'react';
import styled from 'styled-components';
import { IoIosWarning } from "react-icons/io";
import WifiIcon from '../WifiIcon';
import theme from '../../styles/theme';
import { MdCreditCard, MdCreditCardOff } from "react-icons/md";
import ReservationModal from '../reservations/ReservationModal';

const RoomList = ({ rooms, onEditRoom }) => {
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getCheckInStatus = (room) => {
    const activeStatuses = ['longStay', 'overnightStay', 'hourlyStay', 'reservationComplete', 'cleaningRequested'];
    if (activeStatuses.includes(room.status)) {
      if (room.checkInStatus) {
        if (room.delay) {
          return (
            <>
              체크인 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText>
            </>
          );
        }
        return `체크인 | ${room.checkInStatus}`;
      } else if (room.checkOutStatus) {
        if (room.delay) {
          return (
            <>
              체크아웃 | <DelayText>{formatDelayTime(room.delay)} 지연</DelayText>
            </>
          );
        }
        return '체크아웃';
      }
    }
    return null;
  };

  const formatDelayTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

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
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const statusColors = {
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
    return statusColors[status] || theme.colors.default;
  };

  const getStatusTextColor = (status) => {
    const blackTextStatuses = ['underInspection', 'inspectionRequested'];
    return blackTextStatuses.includes(status) ? 'black' : 'white';
  };

  const handleEditReservation = (room) => {
    setSelectedReservation({
      reservation_id: room.reservation_id,
      reservation_number: room.reservation_number,
      guest_name: room.guest_name,
      phone: room.phone,
      booking_source: room.booking_source,
      stay_type: room.stay_type,
      check_in_date: room.check_in_date,
      check_out_date: room.check_out_date,
      check_in_time: room.check_in_time,
      check_out_time: room.check_out_time,
      room_id: room.room_id,
      rate_amount: room.rate_amount,
      memo: room.memo
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleSaveReservation = async () => {
    handleCloseModal();
  };

  return (
    <TableContainer>
      <Table>
        <thead>
          <tr>
            <Th>예약 객실</Th>
            <Th>객실 이름</Th>
            <Th>체크인 상태</Th>
            <Th>예약 시간</Th>
            <Th>네트워크 상태</Th>
            <Th>카드키 상태</Th>
            <Th>객실 상태</Th>
            <Th>관리자 메모</Th>
            <Th>수정</Th>
          </tr>
        </thead>
        <tbody>
          {rooms.map((room) => (
            <tr key={room.id}>
              <Td>{room.name}</Td>
              <Td>{getCheckInStatus(room)}</Td>
              <Td>{room.checkIn} | {room.checkOut}</Td>
              <Td><WifiIcon strength={room.wifiStrength} /></Td>
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
                  color={getStatusColor(room.status)}
                  textColor={getStatusTextColor(room.status)}
                >
                  {getStatusText(room.status)}
                </StatusBadge>
              </Td>
              <Td>{room.memo}</Td>
              <Td>
                <EditButton onClick={() => handleEditReservation(room)}>
                  수정
                </EditButton>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {isModalOpen && (
        <ReservationModal
          isEdit={true}
          initialData={selectedReservation}
          onClose={handleCloseModal}
          onSave={handleSaveReservation}
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

const EditButton = styled.button`
  background-color: #4CAF50;
  border: none;
  color: white;
  padding: 5px 10px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 14px;
  margin: 2px 2px;
  cursor: pointer;
  border-radius: 3px;
`;

const DelayText = styled.span`
  color: #FF6B6B;
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

export default RoomList;
