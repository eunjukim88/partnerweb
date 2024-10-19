import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import theme from '../../styles/theme';
import ReservationModal from './ReservationModal';
import { Button, Select, Input } from '../common/FormComponents';
import { addReservation, updateReservation, deleteReservation, getReservations } from '../../data/tempData';

const ReservationList = ({ reservations, setReservations, bookingSources, stayTypes }) => {
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
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [totalFilteredReservations, setTotalFilteredReservations] = useState([]);

  useEffect(() => {
    setReservations(getReservations());
  }, []);

  useEffect(() => {
    handleSearch();
  }, [startDate, endDate, bookingSource, stayType, listSize, currentPage, searchTerm]);

  const handleOpenModal = (reservation = null) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleSaveReservation = (reservationData) => {
    if (selectedReservation) {
      if (updateReservation(reservationData)) {
        setReservations(getReservations());
      }
    } else {
      const newReservation = addReservation(reservationData);
      setReservations(getReservations());
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      if (deleteReservation(id)) {
        setReservations(getReservations());
      }
    }
  };

  const handleSearch = () => {
    const filtered = reservations.filter(res => {
      const isInDateRange = new Date(res.checkIn) >= startDate && new Date(res.checkOut) <= endDate;
      const matchesSearchTerm = searchTerm === '' || res[searchType].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBookingSource = bookingSource === 'all' || res.bookingSource === bookingSource;
      const matchesStayType = stayType === 'all' || res.stayType === stayType;
      return isInDateRange && matchesSearchTerm && matchesBookingSource && matchesStayType;
    });
    setTotalFilteredReservations(filtered);
    const startIdx = (currentPage - 1) * listSize;
    setFilteredReservations(filtered.slice(startIdx, startIdx + listSize));
  };

  const handleFilterChange = (filterType, value) => {
    switch(filterType) {
      case 'bookingSource':
        setBookingSource(value);
        break;
      case 'stayType':
        setStayType(value);
        break;
      case 'searchType':
        setSearchType(value);
        break;
      case 'searchTerm':
        setSearchTerm(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleQuickDate = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start);
    setEndDate(end);
  };

  const renderPaginationButtons = () => {
    const totalPages = Math.ceil(totalFilteredReservations.length / listSize);
    return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
      <PaginationButton
        key={page}
        onClick={() => setCurrentPage(page)}
        active={currentPage === page}
      >
        {page}
      </PaginationButton>
    ));
  };

  const handleResetFilters = () => {
    setStartDate(new Date());
    setEndDate(new Date());
    setBookingSource('all');
    setStayType('all');
    setSearchType('reservationNumber');
    setSearchTerm('');
    setCurrentPage(1);
    setListSize(10);
    handleSearch();
  };

  return (
    <StyledContent >
      <ControlPanel>
        <ControlGroup>
          <PaginationContainer>
            <Select value={listSize} onChange={(e) => handleFilterChange('listSize', Number(e.target.value))}>
              <option value={10}>10개씩 보기</option>
              <option value={20}>20개씩 보기</option>
              <option value={30}>30개씩 보기</option>
              <option value={50}>50개씩 보기</option>
            </Select>
          </PaginationContainer>
        </ControlGroup>
        <ControlGroup>
          <DateRangeContainer>
            <Input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
            <span>~</span>
            <Input
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
        </ControlGroup>
        <ControlGroup>
          <Select value={bookingSource} onChange={(e) => handleFilterChange('bookingSource', e.target.value)}>
            <option value="all">전체 예약경로</option>
            {bookingSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </Select>
          <Select value={stayType} onChange={(e) => handleFilterChange('stayType', e.target.value)}>
            <option value="all">전체 숙박유형</option>
            {stayTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <SearchContainer>
            <Select value={searchType} onChange={(e) => handleFilterChange('searchType', e.target.value)}>
              <option value="reservationNumber">예약번호</option>
              <option value="guestName">예약자명</option>
              <option value="phone">연락처</option>
            </Select>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="검색어를 입력하세요"
            />
            <Button onClick={handleSearch}>
              <FaSearch />
            </Button>
          </SearchContainer>
          <Button onClick={handleResetFilters}>
            <FaRedo /> 초기화
          </Button>
        </ControlGroup>
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
                  <ActionButton onClick={() => handleOpenModal(reservation)}><FaEdit /></ActionButton>
                  <ActionButton onClick={() => handleDelete(reservation.id)}><FaTrash /></ActionButton>
                </ActionButtonGroup>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </ReservationTable>

      <PaginationButtons>
        <PaginationButton onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          &lt;
        </PaginationButton>
        {renderPaginationButtons()}
        <PaginationButton onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalFilteredReservations.length / listSize)))} disabled={currentPage === Math.ceil(totalFilteredReservations.length / listSize)}>
          &gt;
        </PaginationButton>
      </PaginationButtons>

      {isModalOpen && (
        <ReservationModal
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onSave={handleSaveReservation}
        />
      )}
    </StyledContent >
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

const ReservationTable = styled.table`
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

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
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

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
`;


const PaginationButtons = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

export default ReservationList;
