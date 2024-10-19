import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaTrash, FaPlus } from 'react-icons/fa';

const MessageSend = () => {
    const [balance, setBalance] = useState(500000);
    const [mmsLimit, setMmsLimit] = useState(50);
    const [lmsLimit, setLmsLimit] = useState(20);
    const [senderNumber, setSenderNumber] = useState('');
    const [receiverNumbers, setReceiverNumbers] = useState([]);
    const [blockedNumbers, setBlockedNumbers] = useState([]);
    const [isAd, setIsAd] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [isSendingNow, setIsSendingNow] = useState(true);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');

    const handleAddReceiver = () => {
        // 구현 필요: 연락처 추가 로직
    };

    const handleAddFromReservations = () => {
        // 구현 필요: 예약 리스트에서 연락처 추가 로직
    };

    const handleRemoveAllReceivers = () => {
        setReceiverNumbers([]);
    };

    const handleRemoveReceiver = (index) => {
        setReceiverNumbers(receiverNumbers.filter((_, i) => i !== index));
    };

    const handleSelectTemplate = () => {
        // 구현 필요: 템플릿 선택 로직
    };

    const handleSendMessage = () => {
        // 구현 필요: 메시지 전송 로직
    };

    return (
        <StyledContent>
            <PageTitle>문자 발송</PageTitle>
            <FlexContainer>
                <LeftSection>
                    <BalanceInfo>
                        <p>충전금: {balance.toLocaleString()}원</p>
                        <p>발송한도: MMS({mmsLimit}건), LMS({lmsLimit}건)</p>
                    </BalanceInfo>
                    <InputGroup>
                        <label>발신번호</label>
                        <input 
                            type="text" 
                            value={senderNumber} 
                            onChange={(e) => setSenderNumber(e.target.value)}
                        />
                        <Button onClick={handleAddReceiver}>연락처 추가</Button>
                    </InputGroup>
                    <InputGroup>
                        <label>수신번호</label>
                        <input type="text" />
                        <Button onClick={handleAddFromReservations}>예약리스트에서 추가</Button>
                    </InputGroup>
                    <InputGroup>
                        <label>수신거부</label>
                        <input type="text" />
                    </InputGroup>
                    <CheckboxGroup>
                        <input 
                            type="checkbox" 
                            checked={isAd} 
                            onChange={(e) => setIsAd(e.target.checked)}
                        />
                        <label>(광고)문구 및 수신거부 표시</label>
                    </CheckboxGroup>
                    <ReceiverList>
                        <div>수신번호 ({receiverNumbers.length})</div>
                        <Button onClick={handleRemoveAllReceivers}>연락처 전체 삭제</Button>
                    </ReceiverList>
                    <ReceiverListContent>
                        {receiverNumbers.map((number, index) => (
                            <ReceiverItem key={index}>
                                {number}
                                <FaTrash onClick={() => handleRemoveReceiver(index)} />
                            </ReceiverItem>
                        ))}
                    </ReceiverListContent>
                </LeftSection>
                <RightSection>
                    <PhoneSimulator>
                        <textarea
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                            placeholder="메시지를 입력하세요..."
                        />
                    </PhoneSimulator>
                    <Button onClick={handleSelectTemplate}>템플릿 선택</Button>
                    <RadioGroup>
                        <label>
                            <input 
                                type="radio" 
                                checked={isSendingNow} 
                                onChange={() => setIsSendingNow(true)}
                            />
                            즉시 발송
                        </label>
                        <label>
                            <input 
                                type="radio" 
                                checked={!isSendingNow} 
                                onChange={() => setIsSendingNow(false)}
                            />
                            예약 발송
                        </label>
                    </RadioGroup>
                    {!isSendingNow && (
                        <ScheduleGroup>
                            <input 
                                type="date" 
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                            />
                            <input 
                                type="time" 
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                            />
                        </ScheduleGroup>
                    )}
                    <SendButton onClick={handleSendMessage}>문자 전송</SendButton>
                </RightSection>
            </FlexContainer>
        </StyledContent>
    );
};

const StyledContent = styled.div`
    padding: 20px;
`;

const PageTitle = styled.h1`
    font-size: 24px;
    margin-bottom: 20px;
`;

const FlexContainer = styled.div`
    display: flex;
    gap: 20px;
`;

const LeftSection = styled.div`
    flex: 1;
`;

const RightSection = styled.div`
    flex: 1;
`;

const BalanceInfo = styled.div`
    margin-bottom: 20px;
`;

const InputGroup = styled.div`
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const Button = styled.button`
    padding: 5px 10px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
`;

const CheckboxGroup = styled.div`
    margin-bottom: 15px;
`;

const ReceiverList = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
`;

const ReceiverListContent = styled.div`
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 10px;
`;

const ReceiverItem = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
`;

const PhoneSimulator = styled.div`
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 15px;
    height: 300px;
    
    textarea {
        width: 100%;
        height: 100%;
        border: none;
        resize: none;
    }
`;

const RadioGroup = styled.div`
    margin-bottom: 15px;
`;

const ScheduleGroup = styled.div`
    margin-bottom: 15px;
`;

const SendButton = styled(Button)`
    width: 100%;
    padding: 10px;
    font-size: 18px;
`;

export default MessageSend;