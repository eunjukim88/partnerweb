import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import theme from '../../styles/theme';
import { roomNumbers, tempReservations } from '../../data/tempData';

const ReservationList = ({ reservations: initialReservations = tempReservations }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [listSize, setListSize] = useState(10);
  const [bookingSource, setBookingSource] = useState('all');
  const [stayType, setStayType] = useState('all');
  const [searchType, setSearchType] = useState('reservationNumber');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modalMode, setModalMode] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [timelineStartDate, setTimelineStartDate] = useState(new Date());
  const [reservations, setReservations] = useState(initialReservations);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredReservations, setFilteredReservations] = useState([]);

  // roomNumbers를 직접 사용합니다.
  const availableRoomNumbers = roomNumbers;

  useEffect(() => {
    if (reservations && reservations.length > 0) {
      const startIndex = (currentPage - 1) * listSize;
      setFilteredReservations(reservations.slice(startIndex, startIndex + listSize));
    } else {
      setFilteredReservations([]);
    }
    setTotalPages(Math.ceil(reservations.length / listSize));
  }, [currentPage, listSize, reservations]);

  const handleOpenModal = (mode, reservation = null) => {
    setModalMode(mode);
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setReservations(reservations.filter(res => res.id !== id));
    }
  };

  const handleSaveReservation = (reservationData) => {
    if (modalMode === 'add') {
      setReservations([...reservations, { ...reservationData, id: String(reservations.length + 1) }]);
    } else {
      setReservations(reservations.map(res => res.id === reservationData.id ? reservationData : res));
    }
    setIsModalOpen(false);
  };

  const handleQuickDate = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  };

  const handleSearch = () => {
    const filtered = reservations.filter(res => {
      const isInDateRange = new Date(res.checkIn) >= startDate && new Date(res.checkOut) <= endDate;
      const matchesSearchTerm = res[searchType].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBookingSource = bookingSource === 'all' || res.bookingSource === bookingSource;
      const matchesStayType = stayType === 'all' || res.stayType === stayType;
      return isInDateRange && matchesSearchTerm && matchesBookingSource && matchesStayType;
    });
    setFilteredReservations(filtered.slice(0, listSize));
    setCurrentPage(1);
  };

  const handleReset = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setBookingSource('all');
    setStayType('all');
    setSearchType('reservationNumber');
    setSearchTerm('');
    setFilteredReservations(reservations.slice(0, listSize));
    setCurrentPage(1);
  };

  const handleTimelineChange = (direction) => {
    setTimelineStartDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 15 : -15));
      return newDate;
    });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisibleButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisibleButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxVisibleButtons - 1);

    if (endPage - startPage + 1 < maxVisibleButtons) {
      startPage = Math.max(1, endPage - maxVisibleButtons + 1);
    }

    buttons.push(
      <PaginationButton key="prev" onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
        <FaChevronLeft />
      </PaginationButton>
    );

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <PaginationButton key={i} onClick={() => handlePageChange(i)} active={i === currentPage}>
          {i}
        </PaginationButton>
      );
    }

    buttons.push(
      <PaginationButton key="next" onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
        <FaChevronRight />
      </PaginationButton>
    );

    return buttons;
  };
  
  return (
    <PageContainer>
      <Content>
        <TabMenu>
          <TabItem>
            <TabButton active={activeTab === 'list'} onClick={() => setActiveTab('list')}>리스트 뷰</TabButton>
          </TabItem>
          <TabItem>
            <TabButton active={activeTab === 'timeline'} onClick={() => setActiveTab('timeline')}>타임라인 뷰</TabButton>
          </TabItem>
        </TabMenu>
        
        {activeTab === 'list' ? (
          <>
            <ControlPanel>
              <DateRangeContainer>
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
                <span>~</span>
                <input
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                />
              </DateRangeContainer>
              <QuickDateButtons>
                <Button onClick={() => handleQuickDate(7)}>7일</Button>
                <Button onClick={() => handleQuickDate(30)}>30일</Button>
                <Button onClick={() => handleQuickDate(90)}>90일</Button>
              </QuickDateButtons>
              <Select value={listSize} onChange={(e) => setListSize(Number(e.target.value))}>
                <option value={10}>10개씩 보기</option>
                <option value={20}>20개씩 보기</option>
                <option value={50}>50개씩 보기</option>
              </Select>
              <Select value={bookingSource} onChange={(e) => setBookingSource(e.target.value)}>
                <option value="all">전체 예약경로</option>
                <option value="야놀자">야놀자</option>
                <option value="여기어때">여기어때</option>
                <option value="에어비앤비">에어비앤비</option>
              </Select>
              <Select value={stayType} onChange={(e) => setStayType(e.target.value)}>
                <option value="all">전체 숙박유형</option>
                <option value="숙박">숙박</option>
                <option value="대실">대실</option>
                <option value="장기">장기</option>
              </Select>
              <SearchContainer>
                <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                  <option value="reservationNumber">예약번호</option>
                  <option value="guestName">예약자명</option>
                  <option value="phone">연락처</option>
                </Select>
                <SearchInput
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="검색어를 입력하세요"
                />
                <SearchButton onClick={handleSearch}>
                  <FaSearch />
                </SearchButton>
              </SearchContainer>
              <RightControls>
                <Button onClick={handleReset}>초기화</Button>
              </RightControls>
            </ControlPanel>
            <ReservationTable>
              <thead>
                <tr>
                  <th>예약번호</th>
                  <th>객실번호</th>
                  <th>체크인</th>
                  <th>체크아웃</th>
                  <th>예약자명</th>
                  <th>연락처</th>
                  <th>예약경로</th>
                  <th>숙박유형</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
              {filteredReservations.map(reservation => (
          <tr key={reservation.id}>
                    <TableCell>{reservation.reservationNumber}</TableCell>
                    <TableCell>{reservation.roomNumber}</TableCell>
                    <TableCell>{new Date(reservation.checkIn).toLocaleString()}</TableCell>
                    <TableCell>{new Date(reservation.checkOut).toLocaleString()}</TableCell>
                    <TableCell>{reservation.guestName}</TableCell>
                    <TableCell>{reservation.phone}</TableCell>
                    <TableCell>{reservation.bookingSource}</TableCell>
                    <TableCell>{reservation.stayType}</TableCell>
                    <TableCell>
                      <ActionButtonGroup>
                        <ActionButton onClick={() => handleOpenModal('edit', reservation)}>
                          <FaEdit />
                        </ActionButton>
                        <ActionButton onClick={() => handleDelete(reservation.id)}>
                          <FaTrash />
                        </ActionButton>
                      </ActionButtonGroup>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </ReservationTable>
            <Pagination>
              {renderPaginationButtons()}
            </Pagination>
          </>
        ) : (
          <TimelineView
            reservations={reservations}
            timelineStartDate={timelineStartDate}
            onTimelineChange={handleTimelineChange}
            roomNumbers={availableRoomNumbers}
          />
        )}
      </Content>
      {isModalOpen && (
        <ReservationModal
          onClose={handleCloseModal}
          onSave={handleSaveReservation}
          reservation={selectedReservation}
          mode={modalMode}
        />
      )}
    </PageContainer>
  );
};

const TimelineView = ({ reservations, timelineStartDate, onTimelineChange, roomNumbers }) => {
  const safeReservations = Array.isArray(reservations) ? reservations : [];

  const getDateRange = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const isFirstHalf = date.getDate() <= 15;
    const startDate = new Date(year, month, isFirstHalf ? 1 : 16);
    const endDate = new Date(year, month, isFirstHalf ? 15 : new Date(year, month + 1, 0).getDate());
    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange(timelineStartDate);

  const stayTypes = ['장기', '숙박', '대실'];

  return (
    <TimelineContainer>
      <TimelineHeader>
        <DateRangeContainer>
          <ArrowButton onClick={() => onTimelineChange('prev')}>&lt;</ArrowButton>
          <DateRange>
            {startDate.getFullYear()}년 {startDate.getMonth() + 1}월 {startDate.getDate()}일 - {endDate.getDate()}일
          </DateRange>
          <ArrowButton onClick={() => onTimelineChange('next')}>&gt;</ArrowButton>
        </DateRangeContainer>
      </TimelineHeader>
      <TimelineTable>
        <thead>
          <tr>
            <HeaderCell>객실 호수</HeaderCell>
            <HeaderCell>숙박 유형</HeaderCell>
            {[...Array(endDate.getDate() - startDate.getDate() + 1)].map((_, index) => {
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + index);
              return (
                <HeaderCell key={index}>
                  {currentDate.getDate()}일
                </HeaderCell>
              );
            })}
          </tr>
        </thead>
        <tbody>
        {(roomNumbers || []).map(roomNumber => (
        (stayTypes || []).map((stayType, typeIndex) => (
          <tr key={`${roomNumber}-${stayType}`}>
            {typeIndex === 0 && <RoomCell rowSpan={3}>{roomNumber}</RoomCell>}
            <StayTypeCell>{stayType}</StayTypeCell>
            {[...Array(endDate.getDate() - startDate.getDate() + 1)].map((_, index) => {
              const currentDate = new Date(startDate);
              currentDate.setDate(currentDate.getDate() + index);
              const reservationsForDay = safeReservations.filter(res => 
                res.roomNumber === roomNumber &&
                res.stayType === stayType &&
                new Date(res.checkIn) <= new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59) &&
                new Date(res.checkOut) > new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0)
              );
                  
                  return (
                    <TimelineCell key={index}>
                      {reservationsForDay.map(res => {
                        const isCheckIn = new Date(res.checkIn).toDateString() === currentDate.toDateString();
                        const isCheckOut = new Date(res.checkOut).toDateString() === currentDate.toDateString();
                        
                        return (
                          <ReservationBlock
                            key={res.id}
                            stayType={res.stayType}
                            isCheckIn={isCheckIn}
                            isCheckOut={isCheckOut}
                          />
                        );
                      })}
                    </TimelineCell>
                  );
                })}
              </tr>
            ))
          ))}
        </tbody>
      </TimelineTable>
    </TimelineContainer>
  );
};

// Styled Components
const PageContainer = styled.div`
  padding: 20px;
`;

const Content = styled.div`
  margin-top: 20px;
`;

const TabMenu = styled.ul`
  display: flex;
  list-style-type: none;
  margin: 0 0 20px 0;
  padding: 0;
  border-bottom: 1px solid #ccc;
`;

const TabItem = styled.li`
  margin-right: 10px;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  border: none;
  background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'transparent'};
  color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.text};
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.active ? theme.colors.buttonPrimary.hover : '#f0f0f0'};
  }
`;

const ControlPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  input[type="date"] {
    padding: 5px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }
`;

const QuickDateButtons = styled.div`
  display: flex;
  gap: 5px;
`;

const Select = styled.select`
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SearchInput = styled.input`
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

const SearchButton = styled.button`
  padding: 5px 10px;
  border-radius: 4px;
  border: none;
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }
`;

const RightControls = styled.div`
  margin-left: auto;
`;

const Button = styled.button`
  padding: 5px 10px;
  border-radius: 4px;
  border: none;
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }
`;

const ReservationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: center; // 모든 셀의 텍스트를 중앙 정렬
  }

  th {
    background-color: #f2f2f2;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
`;

const PaginationButton = styled.button`
  background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'white'};
  color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.buttonSecondary.text};
  border: 1px solid ${theme.colors.buttonSecondary.border};
  padding: 5px 10px;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonSecondary.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
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

const TimelineContainer = styled.div`
  width: 100%;
  overflow-x: auto;
`;

const TimelineHeader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const ArrowButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
`;

const DateRange = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

const TimelineTable = styled.table`
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 12px;
`;

const HeaderCell = styled.th`
  padding: 5px;
  background-color: #f2f2f2;
  font-weight: bold;
  text-align: center;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
`;

const RoomCell = styled.td`
  padding: 5px;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
`;

const StayTypeCell = styled.td`
  padding: 5px;
  text-align: center;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
`;

const TimelineCell = styled.td`
  padding: 0;
  position: relative;
  height: 20px;
  border-top: 1px solid #ddd;
  border-bottom: 1px solid #ddd;
`;

const ReservationBlock = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${props => {
    switch(props.stayType) {
      case '숙박': return '#4CAF50';
      case '대실': return '#2196F3';
      case '장기': return '#FFC107';
      default: return '#9E9E9E';
    }
  }};
  color: white;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  ${props => props.isCheckIn && `
    &::before {
      content: 'IN';
      position: absolute;
      left: 2px;
      font-weight: bold;
    }
  `}
  ${props => props.isCheckOut && `
    &::after {
      content: 'OUT';
      position: absolute;
      right: 2px;
      font-weight: bold;
    }
  `}
`;

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
`;

export default ReservationList;
