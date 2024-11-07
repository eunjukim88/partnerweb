import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ReservationModal = ({ isOpen, onClose, onSelect }) => {
  const [reservations, setReservations] = useState([]);
  const [selectedReservations, setSelectedReservations] = useState([]);

  const handleCheckboxChange = (phone) => {
    setSelectedReservations(prev => 
      prev.includes(phone) ? prev.filter(p => p !== phone) : [...prev, phone]
    );
  };

  const handleSelectAll = () => {
    if (selectedReservations.length === reservations.length) {
      setSelectedReservations([]);
    } else {
      setSelectedReservations(reservations.map(r => r.phone));
    }
  };

  const handleConfirm = () => {
    onSelect(selectedReservations);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <h2>예약자 목록</h2>
        <Table>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedReservations.length === reservations.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th>체크인</th>
              <th>체크아웃</th>
              <th>숙박유형</th>
              <th>이름</th>
              <th>연락처</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(reservation => (
              <tr key={reservation.id}>
                <td>
                  <input 
                    type="checkbox" 
                    checked={selectedReservations.includes(reservation.phone)}
                    onChange={() => handleCheckboxChange(reservation.phone)}
                  />
                </td>
                <td>{reservation.checkIn.split('T')[0]}</td>
                <td>{reservation.checkOut.split('T')[0]}</td>
                <td>{reservation.stayType}</td>
                <td>{reservation.guestName}</td>
                <td>{reservation.phone}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        <ButtonGroup>
          <ConfirmButton onClick={handleConfirm}>확인</ConfirmButton>
          <CloseButton onClick={onClose}>닫기</CloseButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
};

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  max-width: 800px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }

  th {
    background-color: #f2f2f2;
  }

  tr:nth-child(even) {
    background-color: #f9f9f9;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
`;

const CloseButton = styled(Button)`
  background-color: #f44336;
  color: white;
`;

const ConfirmButton = styled(Button)`
  background-color: #4CAF50;
  color: white;
`;

export default ReservationModal;