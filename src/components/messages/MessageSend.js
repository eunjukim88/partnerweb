import React, { useState } from 'react';
import styled from 'styled-components';
import { FaTrash, FaPlus } from 'react-icons/fa';
import ReservationModal from './ReservationModal';
import PhoneContainer from './PhoneContainer';

const MessageSend = () => {
    const [senderNumber, setSenderNumber] = useState('');
    const [receiverNumber, setReceiverNumber] = useState('');
    const [receiverNumbers, setReceiverNumbers] = useState([]);
    const [blockNumbers, setBlockNumbers] = useState('');
    const [messageContent, setMessageContent] = useState('');
    const [isAdvertisement, setIsAdvertisement] = useState(false);
    const [isSendingNow, setIsSendingNow] = useState(true);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAddReceiver = () => {
        if (receiverNumber && !receiverNumbers.includes(receiverNumber)) {
            setReceiverNumbers([...receiverNumbers, receiverNumber]);
            setReceiverNumber('');
        }
    };

    const handleRemoveReceiver = (index) => {
        const newReceiverNumbers = receiverNumbers.filter((_, i) => i !== index);
        setReceiverNumbers(newReceiverNumbers);
    };

    const handleRemoveAllReceivers = () => {
        setReceiverNumbers([]);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleAddReceiver();
        }
    };

    const handleAddFromReservations = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSelectReservation = (phones) => {
        const newReceiverNumbers = [...new Set([...receiverNumbers, ...phones])];
        setReceiverNumbers(newReceiverNumbers);
    };

    const handleSendMessage = () => {
        // 메시지 전송 로직
    };

    const handleLoadTemplate = () => {
        // 템플릿 불러오기 로직
    };

    return (
        <Container>
            <LeftSection>
                <Balance>
                    <h3>충전금: 5,000,000원</h3>
                    <h3>발송한도: MMS(50건), LMS(20건)</h3>
                </Balance>
                <InputGroup>
                    <label style={{ width: '80px' }}>발신번호</label>
                    <Input
                        type="text"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                    />
                    <Button style={{ width: '30%' }} onClick={handleAddReceiver}>연락처 변경</Button>
                </InputGroup>
                <InputGroup>
                    <label style={{ width: '80px' }}>수신번호</label>
                    <Input 
                        type="text" 
                        placeholder="수신번호 입력" 
                        value={receiverNumber}
                        onChange={(e) => setReceiverNumber(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <Button style={{ width: '30%' }} onClick={handleAddFromReservations}>예약자 검색</Button>
                </InputGroup>
                <InputGroup>
                    <label
                        style={{ width: '90px' }}
                    >수신거부</label>
                    <Input
                        type="text"
                        style={{ width: '100%' }}                        
                        value={blockNumbers}
                        onChange={(e) => setBlockNumbers(e.target.value)}
                        placeholder="수신거부 번호 입력"
                    />
                </InputGroup>
                <CheckboxGroup>
                    <input
                        type="checkbox"
                        style={{ width: '20px', height: '20px' }}
                        checked={isAdvertisement}
                        onChange={(e) => setIsAdvertisement(e.target.checked)}
                    />
                    <label>(광고)문구 및 수신거부 표시</label>
                </CheckboxGroup>
                <ReceiverList>
                    <div>수신번호 (총 {receiverNumbers.length}개)</div>
                    <Button style={{ width: '150px' }} onClick={handleRemoveAllReceivers}>연락처 전체 삭제</Button>
                </ReceiverList>
                <ReceiverListContent>
                    {receiverNumbers.map((number, index) => (
                        <ReceiverItem key={index}>
                            <span>{number}</span>
                            <FaTrash onClick={() => handleRemoveReceiver(index)} />
                        </ReceiverItem>
                    ))}
                </ReceiverListContent>
            </LeftSection>
            <RightSection>
                <PhoneContainer title="새 메시지">
                    <MessageArea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder="메시지를 입력하세요..."
                    />
                    <Button onClick={handleLoadTemplate}>템플릿 선택</Button>
                    <RadioGroup>
                        <RadioButton
                            active={isSendingNow}
                            onClick={() => setIsSendingNow(true)}
                        >
                            즉시 발송
                        </RadioButton>
                        <RadioButton
                            active={!isSendingNow}
                            onClick={() => setIsSendingNow(false)}
                        >
                            예약 발송
                        </RadioButton>
                    </RadioGroup>
                    <ScheduleGroup>
                        <StyledInput
                            type="date"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            disabled={isSendingNow}
                        />
                        <StyledInput
                            type="time"
                            value={scheduledTime}
                            onChange={(e) => setScheduledTime(e.target.value)}
                            disabled={isSendingNow}
                        />
                    </ScheduleGroup>
                    <SendButton onClick={handleSendMessage}>문자 전송</SendButton>
                </PhoneContainer>
            </RightSection>
            <ReservationModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSelect={handleSelectReservation}
            />
        </Container>
    );
};

const Container = styled.div`
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    height: 667px;
`;

const LeftSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
    background-color: #f5f5f7;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    height: 667px;
    max-width: 500px;
    min-width: 450px;
    border-radius: 30px;
    overflow: hidden;
    padding: 30px;
`;

const RightSection = styled.div`
    flex: 1;
    display: flex;
    justify-content: center;
`;

const Balance = styled.div`
    padding: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    gap: 10px;
`;

const InputGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Input = styled.input`
    padding: 12px 15px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    background-color: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
`;

const Button = styled.button`
    padding: 10px 5px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    background-color: #007AFF;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
        background-color: #0056b3;
    }
`;

const CheckboxGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
`;

const ReceiverList = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
`;

const ReceiverListContent = styled.div`
    height: 350px;
    overflow-y: auto;
    background-color: #ffffff;
    border-radius: 10px;
    padding: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
`;

const ReceiverItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
        border-bottom: none;
    }
`;

const MessageArea = styled.textarea`
    height: 250px;
    width: 100%;
    border: none;
    border-radius: 10px;
    padding: 15px;
    font-size: 16px;
    resize: none;
    background-color: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:focus {
        outline: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
`;

const RadioGroup = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 10px;
`;

const RadioButton = styled.button`
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: ${props => props.active ? '#007AFF' : '#ffffff'};
    color: ${props => props.active ? '#ffffff' : '#1c1c1e'};
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);

    &:hover {
        background-color: ${props => props.active ? '#0056b3' : '#f0f0f0'};
    }
`;

const ScheduleGroup = styled.div`
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
`;

const StyledInput = styled.input`
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
    flex: 1;
    background-color: ${props => props.disabled ? '#f5f5f5' : 'white'};
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};

    &:focus {
        outline: none;
        border-color: #007AFF;
    }
`;

const SendButton = styled.button`
    background-color: #007AFF;
    color: white;
    border: none;
    border-radius: 15px;
    padding: 15px;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);

    &:hover {
        background-color: #0056b3;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
    }
`;

export default MessageSend;
