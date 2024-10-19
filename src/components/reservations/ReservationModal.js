import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import { roomNumbers, bookingSources, stayTypes } from '../../data/tempData';

const ReservationModal = ({ reservation, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    reservationNumber: '',
    checkIn: '',
    checkOut: '',
    roomNumber: '',
    phone: '',
    bookingSource: '',
    stayType: '',
  });

  useEffect(() => {
    if (reservation) {
      setFormData({
        ...reservation,
        checkIn: reservation.checkIn.slice(0, 16),
        checkOut: reservation.checkOut.slice(0, 16),
      });
    }
  }, [reservation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <h2>{reservation ? '예약 수정' : '신규 예약'}</h2>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <FormRow>
              <FormGroup>
                <Label>예약번호</Label>
                <Input
                  type="text"
                  name="reservationNumber"
                  value={formData.reservationNumber}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>체크인</Label>
                <Input
                  type="datetime-local"
                  name="checkIn"
                  value={formData.checkIn}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
              <FormGroup>
                <Label>체크아웃</Label>
                <Input
                  type="datetime-local"
                  name="checkOut"
                  value={formData.checkOut}
                  onChange={handleChange}
                  required
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>객실 번호</Label>
                <Select
                  name="roomNumber"
                  value={formData.roomNumber}
                  onChange={handleChange}
                  required
                >
                  <option value="">선택하세요</option>
                  {roomNumbers.map(room => (
                    <option key={room} value={room}>{room}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>전화번호</Label>
                <Input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </FormGroup>
            </FormRow>
            <FormRow>
              <FormGroup>
                <Label>예약 경로</Label>
                <Select
                  name="bookingSource"
                  value={formData.bookingSource}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {bookingSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>숙박 유형</Label>
                <Select
                  name="stayType"
                  value={formData.stayType}
                  onChange={handleChange}
                >
                  <option value="">선택하세요</option>
                  {stayTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </Select>
              </FormGroup>
            </FormRow>
            <SubmitButton type="submit">저장</SubmitButton>
          </form>
        </ModalBody>
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
  z-index: 1100; // 이 값을 높게 설정
`;

const ModalContent = styled.div`
  background-color: #fff;
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1101; // ModalOverlay보다 높게 설정
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormRow = styled.div`
  display: flex;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-bottom: 20px;
`;

const Label = styled.label`
  margin-bottom: 5px;
  font-weight: bold;
`;

const SubmitButton = styled.button`
  padding: 10px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  width: 100%;
  margin-top: 15px;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }
`;

export default ReservationModal;
