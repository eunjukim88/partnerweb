import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [roomNumbers, setRoomNumbers] = useState([]);

  useEffect(() => {
    setReservations(getReservations());
  }, []);

  useEffect(() => {
    handleSearch();
  }, [reservations, startDate, endDate, bookingSource, stayType, searchType, searchTerm, currentPage, listSize]);

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
      const matchesSearchTerm = res[searchType].toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBookingSource = bookingSource === 'all' || res.bookingSource === bookingSource;
      const matchesStayType = stayType === 'all' || res.stayType === stayType;
      return isInDateRange && matchesSearchTerm && matchesBookingSource && matchesStayType;
    });
    setTotalFilteredReservations(filtered);
    setFilteredReservations(filtered.slice((currentPage - 1) * listSize, currentPage * listSize));
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

  return (
    <Content>
      <ControlPanel>
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
      <Select value={bookingSource} onChange={(e) => setBookingSource(e.target.value)}>
        <option value="all">전체 예약경로</option>
        {bookingSources.map(source => (
          <option key={source} value={source}>{source}</option>
        ))}
      </Select>
      <Select value={stayType} onChange={(e) => setStayType(e.target.value)}>
        <option value="all">전체 숙박유형</option>
        {stayTypes.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </Select>
        <SearchContainer>
          <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="reservationNumber">예약번호</option>
            <option value="guestName">예약자명</option>
            <option value="phone">연락처</option>
          </Select>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요"
          />
          <Button onClick={handleSearch}>
            <FaSearch />
          </Button>
        </SearchContainer>
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
          {reservations.map(reservation => (
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

      <Pagination>
        {renderPaginationButtons()}
      </Pagination>

      {isModalOpen && (
        <ReservationModal
          reservation={selectedReservation}
          onClose={handleCloseModal}
          onSave={handleSaveReservation}
        />
      )}
    </Content>
  );
};

const Content = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
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
`;

const QuickDateButtons = styled.div`
  display: flex;
  gap: 5px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 5px;
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

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
`;

export default ReservationList;
