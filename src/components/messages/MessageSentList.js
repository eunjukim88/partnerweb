import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaRedo, FaEye } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Select, Input, Pagination } from '../common/FormComponents';
import MessageDetailModal from './MessageDetailModal';

const currentYear = new Date().getFullYear();

const MessageSentList = () => {
  const [sentMessages, setSentMessages] = useState([
    {
      id: 1,
      type: 'SMS',
      status: '완료',
      sendTime: `${currentYear}-10-21 10:30:00`,
      title: '예약 확인',
      receiverNumber: '01012345678',
      result: '성공',
      content: '안녕하세요. 귀하의 예약이 확정되었습니다. 감사합니다.'
    },
    {
      id: 2,
      type: 'LMS',
      status: '대기',
      sendTime: `${currentYear}-10-21 14:45:00`,
      title: '이벤트 안내',
      receiverNumber: '01087654321',
      result: '대기',
      content: '고객님, 새로운 이벤트가 시작되었습니다. 지금 바로 확인해보세요!'
    },
    {
      id: 3,
      type: 'MMS',
      status: '발송중',
      sendTime: `${currentYear}-10-21 09:15:00`,
      title: '결제 완료',
      receiverNumber: '01011112222',
      result: '성공',
      content: '결제가 완료되었습니다. 주문하신 상품은 곧 배송될 예정입니다.'
    },
    {
      id: 4,
      type: 'SMS',
      status: '완료',
      sendTime: `${currentYear}-10-21 16:20:00`,
      title: '배송 안내',
      receiverNumber: '01033334444',
      result: '성공',
      content: '고객님의 상품이 배송되었습니다. '
    },
    {
      id: 5,
      type: 'LMS',
      status: '실패',
      sendTime: `${currentYear}-10-21 11:00:00`,
      title: '긴급 공지',
      receiverNumber: '01055556666',
      result: '실패',
      content: '서비스 점검으로 인해 일시적으로 이용이 제한됩니다. 불편을 드려 죄송합니다.'
    },
    // ... 추가 10개의 메시지 데이터
  ]);

  const [filteredMessages, setFilteredMessages] = useState(sentMessages);
  const [listSize, setListSize] = useState(10);
  const [sendStatus, setSendStatus] = useState('all');
  const [sendResult, setSendResult] = useState('all');
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);

  useEffect(() => {
    handleSearch();
  }, [sentMessages, listSize, sendStatus, sendResult, startDate, endDate, searchTerm, currentPage]);

  const handleSearch = () => {
    const filtered = sentMessages.filter(msg => {
      const msgDate = new Date(msg.sendTime);
      msgDate.setHours(0, 0, 0, 0); // 시간을 무시하고 날짜만 비교
      const startDateCopy = new Date(startDate);
      startDateCopy.setHours(0, 0, 0, 0);
      const endDateCopy = new Date(endDate);
      endDateCopy.setHours(23, 59, 59, 999);
      
      const isInDateRange = msgDate >= startDateCopy && msgDate <= endDateCopy;
      const matchesSearchTerm = searchTerm === '' || msg.receiverNumber.includes(searchTerm.replace(/-/g, ''));
      const matchesSendStatus = sendStatus === 'all' || msg.status === sendStatus;
      const matchesSendResult = sendResult === 'all' || msg.result === sendResult;
      return isInDateRange && matchesSearchTerm && matchesSendStatus && matchesSendResult;
    });
    const startIdx = (currentPage - 1) * listSize;
    setFilteredMessages(filtered.slice(startIdx, startIdx + listSize));
  };

  const handleFilterChange = (filterType, value) => {
    switch(filterType) {
      case 'listSize':
        setListSize(Number(value));
        break;
      case 'sendStatus':
        setSendStatus(value);
        break;
      case 'sendResult':
        setSendResult(value);
        break;
      case 'searchTerm':
        setSearchTerm(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleQuickDate = (days) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1)); // days - 1을 해서 오늘 날짜도 포함되도록 함
    start.setHours(0, 0, 0, 0);
    setStartDate(start);
    setEndDate(end);
  };

  const handleResetFilters = () => {
    setListSize(10);
    setSendStatus('all');
    setSendResult('all');
    setStartDate(new Date());
    setEndDate(new Date());
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleOpenModal = (message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedMessage(null);
  };

  const totalPages = Math.ceil(sentMessages.length / listSize);

  return (
    <StyledContent>
      <ControlPanel>
        <ControlGroup>
          <StyledSelect value={listSize} onChange={(e) => handleFilterChange('listSize', e.target.value)}>
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={30}>30개씩 보기</option>
          </StyledSelect>
          <StyledSelect value={sendStatus} onChange={(e) => handleFilterChange('sendStatus', e.target.value)}>
            <option value="all">전체 발송상태</option>
            <option value="대기">대기</option>
            <option value="발송중">발송중</option>
            <option value="완료">완료</option>
          </StyledSelect>
          <StyledSelect value={sendResult} onChange={(e) => handleFilterChange('sendResult', e.target.value)}>
            <option value="all">전체 발송결과</option>
            <option value="성공">성공</option>
            <option value="실패">실패</option>
          </StyledSelect>
        </ControlGroup>
        <ControlGroup>
          <DateRangeContainer>
            <StyledInput
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
            <span>~</span>
            <StyledInput
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </DateRangeContainer>
          <QuickDateButtons>
            <StyledButton onClick={() => handleQuickDate(7)}>7일</StyledButton>
            <StyledButton onClick={() => handleQuickDate(15)}>15일</StyledButton>
            <StyledButton onClick={() => handleQuickDate(30)}>1개월</StyledButton>
          </QuickDateButtons>
        </ControlGroup>
        <ControlGroup>
          <SearchContainer>
            <StyledInput
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="수신번호 입력 ('-' 제외)"
            />
            <StyledButton onClick={handleSearch}>
              <FaSearch />
            </StyledButton>
          </SearchContainer>
          <StyledButton onClick={handleResetFilters}>
            <FaRedo /> 초기화
          </StyledButton>
        </ControlGroup>
      </ControlPanel>

      <MessageTable>
        <thead>
          <tr>
            <th>발송타입</th>
            <th>발송상태</th>
            <th>발송시간</th>
            <th>메시지 제목</th>
            <th>수신번호</th>
            <th>발송결과</th>
            <th>상세보기</th>
          </tr>
        </thead>
        <tbody>
          {filteredMessages.map(message => (
            <tr key={message.id}>
              <TableCell>{message.type}</TableCell>
              <TableCell>{message.status}</TableCell>
              <TableCell>{new Date(message.sendTime).toLocaleString()}</TableCell>
              <TableCell>{message.title}</TableCell>
              <TableCell>{message.receiverNumber}</TableCell>
              <TableCell>{message.result}</TableCell>
              <TableCell>
                <ActionButton onClick={() => handleOpenModal(message)}>
                  <FaEye />
                </ActionButton>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </MessageTable>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {isModalOpen && (
        <MessageDetailModal
          message={selectedMessage}
          onClose={handleCloseModal}
        />
      )}
    </StyledContent>
  );
};

const StyledContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
`;

const ControlPanel = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  height: 40px;
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  height: 100%;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const QuickDateButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 100%;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 100%;
`;

const MessageTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center;
  }

  th {
    background-color: #f2f2f2;
  }
`;

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
`;

const ActionButton = styled.button`
  background-color: ${theme.colors.buttonSecondary.background};
  color: ${theme.colors.buttonSecondary.text};
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonSecondary.hover};
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${theme.colors.buttonSecondary.focus};
  }
`;

const StyledSelect = styled(Select)`
  height: 40px;
  padding: 0 10px;
`;

const StyledInput = styled(Input)`
  height: 40px;
  padding: 0 10px;
`;

const StyledButton = styled(Button)`
  height: 40px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export default MessageSentList;
