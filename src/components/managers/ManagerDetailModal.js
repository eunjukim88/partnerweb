import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTimes } from 'react-icons/fa';
import { Input, Button } from '../common/FormComponents';

const ManagerDetailModal = ({ manager, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    permissions: {
      viewRoomStatus: false,
      viewStatistics: false,
      viewManagerList: false,
      manageManagers: false,
      editRoomStatus: false,
      viewReservations: false,
      manageReservations: false,
      editReservations: false,
      deleteReservations: false,
      sendMessages: false,
      viewMessageHistory: false,
      manageMessageTemplates: false,
      manageMyPage: false,
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (manager) {
      setFormData({
        ...manager,
        permissions: {
          ...formData.permissions,
          ...(manager.permissions || {})
        }
      });
    }
  }, [manager]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({ ...prev, [name]: formattedPhone }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/[^\d]/g, '');
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [name]: checked
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = '이름은 필수 입력 사항입니다.';
    if (!formData.phone) newErrors.phone = '휴대전화는 필수 입력 사항입니다.';
    if (!formData.email) newErrors.email = 'E-mail은 필수 입력 사항입니다.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = '유효한 이메일 주소를 입력해주세요.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{manager ? `${manager.name} 담당자 상세보기` : '담당자 신규등록'}</ModalTitle>
          <CloseButton onClick={onClose}><FaTimes /></CloseButton>
        </ModalHeader>
        <ModalBody>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Label>이름</Label>
              <StyledInput
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && <ErrorMessage>{errors.name}</ErrorMessage>}
            </FormGroup>
            <FormGroup>
              <Label>휴대전화</Label>
              <StyledInput
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
              />
              {errors.phone && <ErrorMessage>{errors.phone}</ErrorMessage>}
            </FormGroup>
            <FormGroup>
              <Label>E-mail</Label>
              <StyledInput
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {errors.email && <ErrorMessage>{errors.email}</ErrorMessage>}
            </FormGroup>
            <FormGroup>
              <Label>담당업무</Label>
              <StyledInput
                type="text"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              />
            </FormGroup>
            <FormGroup>
              <Label>권한설정</Label>
              <PermissionsGrid>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="viewRoomStatus"
                    checked={formData.permissions.viewRoomStatus}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>객실현황 조회</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="viewStatistics"
                    checked={formData.permissions.viewStatistics}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>집계조회</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="viewManagerList"
                    checked={formData.permissions.viewManagerList}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>담당자 관리 조회</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="manageManagers"
                    checked={formData.permissions.manageManagers}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>담당자 등록/수정</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="editRoomStatus"
                    checked={formData.permissions.editRoomStatus}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>객실상태 수정</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="viewReservations"
                    checked={formData.permissions.viewReservations}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>예약리스트 조회</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="manageReservations"
                    checked={formData.permissions.manageReservations}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>예약 등록/수정</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="editReservations"
                    checked={formData.permissions.editReservations}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>예약수정</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="deleteReservations"
                    checked={formData.permissions.deleteReservations}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>예약삭제</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="sendMessages"
                    checked={formData.permissions.sendMessages}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>문자발송</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="viewMessageHistory"
                    checked={formData.permissions.viewMessageHistory}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>문자발송조회</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="manageMessageTemplates"
                    checked={formData.permissions.manageMessageTemplates}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>문자 템플릿 등록</CheckboxLabel>
                </CheckboxGroup>
                <CheckboxGroup>
                  <Checkbox
                    type="checkbox"
                    name="manageMyPage"
                    checked={formData.permissions.manageMyPage}
                    onChange={handleCheckboxChange}
                  />
                  <CheckboxLabel>마이페이지 조회/수정</CheckboxLabel>
                </CheckboxGroup>
              </PermissionsGrid>
            </FormGroup>
            <ButtonContainer>
              <SubmitButton type="submit">{manager ? '수정' : '등록'}</SubmitButton>
            </ButtonContainer>
          </Form>
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
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 80%;
  max-width: 450px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const ModalTitle = styled.h2`
  margin: 0;
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
  align-items: center;
  justify-content: center;
`;

const Form = styled.form`
  width: 100%;
`;

const FormGroup = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  width: 100%;
`;

const Label = styled.label`
  width: 100px;
  min-width: 100px;
  margin-right: 10px;
`;

const StyledInput = styled(Input)`
  flex: 1;
  width: calc(100% - 110px); // 100px (Label width) + 10px (margin-right)
`;

const PermissionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  margin-right: 5px;
`;

const CheckboxLabel = styled.label`
  font-size: 0.9rem;
`;

const ErrorMessage = styled.div`
  color: red;
  font-size: 0.8rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
  margin-top: 20px;
`;

const SubmitButton = styled(Button)`
  width: 120px;
  background-color: #007AFF;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }
`;

export default ManagerDetailModal;
