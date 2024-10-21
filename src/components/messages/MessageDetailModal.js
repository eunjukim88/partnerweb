import React from 'react';
import styled from 'styled-components';

const MessageDetailModal = ({ message, onClose }) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <PhoneFrame>
          <PhoneScreen>
            <AppHeader>
              <AppTitle>메시지 상세</AppTitle>
            </AppHeader>
            <MessageContent>
              <MessageBubble>
                <MessageTitle>{message.title}</MessageTitle>
                <MessageText>{message.content}</MessageText>
                <MessageTime>{new Date(message.sendTime).toLocaleString()}</MessageTime>
              </MessageBubble>
            </MessageContent>
            <MessageInfo>
              <InfoItem>
                <InfoLabel>발송 상태:</InfoLabel>
                <InfoValue>{message.status}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>발송 결과:</InfoLabel>
                <InfoValue>{message.result}</InfoValue>
              </InfoItem>
            </MessageInfo>
          </PhoneScreen>
        </PhoneFrame>
        <CloseButton onClick={onClose}>닫기</CloseButton>
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
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 15px;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 350px;
  width: 90%;
`;

const PhoneFrame = styled.div`
  width: 300px;
  height: 500px;
  border-radius: 30px;
  padding: 15px;
  background-color: #f5f5f7;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const AppHeader = styled.div`
  background-color: #ffffff;
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #e0e0e0;
`;

const AppTitle = styled.h2`
  margin: 0;
  font-size: 16px;
`;

const MessageContent = styled.div`
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  background-color: #ffffff;
  height: 500px;
  border-radius: 0 0 20px 20px;
`;

const MessageBubble = styled.div`
  max-width: 80%;
  background-color: #dcf8c6;
  border-radius: 15px;
  padding: 10px;
  margin-left: auto;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

const MessageTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: bold;
`;

const MessageText = styled.p`
  margin: 0;
  font-size: 16px;
`;

const MessageTime = styled.span`
  display: block;
  font-size: 12px;
  color: #7f7f7f;
  text-align: right;
  margin-top: 8px;
`;

const MessageInfo = styled.div`
  padding: 15px;
  background-color: #ffffff;
  border-radius: 15px;
  margin-top: 10px;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
`;

const InfoLabel = styled.span`
  font-weight: bold;
`;

const InfoValue = styled.span`
  color: #007AFF;
`;

const CloseButton = styled.button`
  margin-top: 15px;
  padding: 10px 20px;
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
`;

export default MessageDetailModal;
