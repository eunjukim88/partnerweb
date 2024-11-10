import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import theme from '../../styles/theme';
import useRoomStore from '../../store/roomStore';
import useReservationStore from '../../store/reservationStore';

const RoomStatusModal = ({ room, onClose }) => {
  const [memo, setMemo] = useState(room?.memo || '');
  const [selectedStatus, setSelectedStatus] = useState(room?.room_status || null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { updateRoom } = useRoomStore();
  const { filteredReservations, setSelectedReservation, setModalOpen: setReservationModalOpen } = useReservationStore();

  // 현재 객실의 예약 정보 찾기
  const currentReservation = filteredReservations.find(reservation => 
    reservation.room_id === room.room_id
  );

  const statusOptions = [
    { value: 'reservationComplete', label: '예약완료' },
    { value: 'cleaningRequested', label: '청소요청' },
    { value: 'cleaningInProgress', label: '청소중' },
    { value: 'cleaningComplete', label: '청소완료' },
    { value: 'inspectionRequested', label: '점검요청' },
    { value: 'underInspection', label: '점검중' },
    { value: 'inspectionComplete', label: '점검완료' },
    { value: 'salesStopped', label: '판매중지' }
  ];

  const handleStatusClick = (status) => {
    setSelectedStatus(prev => prev === status ? null : status);
  };

  const handleSaveChanges = async () => {
    setError(null);
    setIsLoading(true);
    
    try {
      await updateRoom(room.room_id, {
        ...room,
        room_status: selectedStatus,
        memo: memo
      });
      
      onClose();
    } catch (error) {
      setError(error.message || '변경사항 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReservationClick = () => {
    if (currentReservation) {
      setSelectedReservation(currentReservation);
    } else {
      setSelectedReservation(null);
    }
    setReservationModalOpen(true);
    onClose();
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>객실 관리 - {room.room_number}호</h2>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>

        <ButtonSection>
          <ActionButton onClick={handleReservationClick}>
            {currentReservation ? '예약 변경' : '예약 등록'}
          </ActionButton>
        </ButtonSection>

        <StatusSection>
          <SectionTitle>객실 상태 변경</SectionTitle>
          <StatusButtonGrid>
            {statusOptions.map(({ value, label }) => (
              <StatusButton
                key={value}
                onClick={() => handleStatusClick(value)}
                $selected={selectedStatus === value}
              >
                {label}
              </StatusButton>
            ))}
          </StatusButtonGrid>
        </StatusSection>

        <MemoSection>
          <SectionTitle>메모</SectionTitle>
          <MemoTextArea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모를 입력하세요"
          />
        </MemoSection>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <SaveButtonSection>
          <SaveButton 
            onClick={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? '저장 중...' : '변경사항 저장'}
          </SaveButton>
        </SaveButtonSection>
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
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h2 {
    margin: 0;
  }
`;

const ButtonSection = styled.div`
  margin-bottom: 20px;
`;

const StatusSection = styled.div`
  margin-bottom: 20px;
`;

const MemoSection = styled.div`
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin-bottom: 10px;
`;

const StatusButtonGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
`;

const StatusButton = styled.button`
  background-color: ${props => props.$selected ? '#007bff' : '#f8f9fa'};
  color: ${props => props.$selected ? 'white' : '#333'};
  border: 1px solid ${props => props.$selected ? '#007bff' : '#dee2e6'};
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$selected ? '#0056b3' : '#e9ecef'};
  }
`;

const ActionButton = styled.button`
  background-color: ${theme.colors.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
  margin-bottom: 10px;

  &:hover {
    opacity: 0.9;
  }
`;

const MemoTextArea = styled.textarea`
  width: 100%;
  height: 100px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
  resize: vertical;
`;

const MemoSubmitButton = styled.button`
  background-color: ${theme.colors.secondary};
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;

  &:hover {
    color: #333;
  }
`;

const SaveButtonSection = styled.div`
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

const SaveButton = styled.button`
  background-color: ${props => props.disabled ? '#6c757d' : theme.colors.primary};
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-weight: bold;
  opacity: ${props => props.disabled ? 0.7 : 1};

  &:hover {
    opacity: ${props => props.disabled ? 0.7 : 0.9};
  }
`;

const ErrorMessage = styled.div`
  color: ${theme.colors.error || '#dc3545'};
  margin: 10px 0;
  padding: 10px;
  background-color: #fff3f3;
  border-radius: 4px;
  font-size: 14px;
`;

export default RoomStatusModal;
