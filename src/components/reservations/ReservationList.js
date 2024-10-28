import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import theme from '../../styles/theme';
import ReservationModal from './ReservationModal';
import { Button, Select, Input, Pagination } from '../common/FormComponents';

// 예약 경로 상수
const BOOKING_SOURCES = [
  '직접예약',
  '에어비앤비',
  '야놀자',
  '여기어때',
  '부킹닷컴',
  '아고다',
  '기타'
];

// 숙박 유형 상수
const STAY_TYPES = [
  '대실',
  '숙박',
  '장기'
];

const ReservationList = ({ reservations, setReservations }) => {
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
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch('/api/reservations');
      const data = await response.json();
      setReservations(data.reservations);
    } catch (error) {
      console.error('예약 데이터를 불러오는 데 실패했습니다:', error);
    }
  };

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

  const handleSaveReservation = async (reservationData) => {
    try {
      const method = selectedReservation ? 'PUT' : 'POST';
      const url = '/api/reservations' + (selectedReservation ? `/${selectedReservation.id}` : '');
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 요청 실패');
      }

      await fetchReservations();
      setIsModalOpen(false);
    } catch (error) {
      console.error('예약 저장 중 오류 발생:', error);
      alert(error.message || '예약 저장에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const response = await fetch('/api/reservations', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [id] }),
        });
        if (!response.ok) throw new Error('API 요청 실패');
        await fetchReservations();
      } catch (error) {
        console.error('예약 삭제 중 오류 발생:', error);
        alert('예약 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleSearch = () => {
    let filtered = [...reservations];
    
    // 날짜 필터링
    filtered = filtered.filter(reservation => {
      const checkIn = new Date(reservation.check_in);
      return checkIn >= startDate && checkIn <= endDate;
    });

    // 예약 경로 필터링
    if (bookingSource !== 'all') {
      filtered = filtered.filter(r => r.booking_source === bookingSource);
    }

    // 숙박 유형 필터링
    if (stayType !== 'all') {
      filtered = filtered.filter(r => r.stay_type === stayType);
    }

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(r => {
        switch (searchType) {
          case 'reservationNumber':
            return r.reservation_number.includes(searchTerm);
          case 'guestName':
            return r.guest_name.includes(searchTerm);
          case 'phone':
            return r.phone.includes(searchTerm);
          default:
            return true;
        }
      });
    }

    setTotalFilteredReservations(filtered);
    
    // 페이지네이션 적용
    const start = (currentPage - 1) * listSize;
    const end = start + listSize;
    setFilteredReservations(filtered.slice(start, end));
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

  const totalPages = Math.ceil(totalFilteredReservations.length / listSize);

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
            {BOOKING_SOURCES.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </Select>
          <Select value={stayType} onChange={(e) => handleFilterChange('stayType', e.target.value)}>
            <option value="all">전체 숙박유형</option>
            {STAY_TYPES.map(type => (
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
            <th>상태</th>
            <th>액션</th>
          </tr>
        </thead>
        <tbody>
          {filteredReservations.map(reservation => (
            <tr key={reservation.id}>
              <TableCell>{reservation.reservation_number}</TableCell>
              <TableCell>{reservation.room_number}</TableCell>
              <TableCell>{new Date(reservation.check_in).toLocaleString()}</TableCell>
              <TableCell>{new Date(reservation.check_out).toLocaleString()}</TableCell>
              <TableCell>{reservation.guest_name}</TableCell>
              <TableCell>{reservation.phone}</TableCell>
              <TableCell>{reservation.booking_source}</TableCell>
              <TableCell>{reservation.stay_type}</TableCell>
              <TableCell>{reservation.status}</TableCell>
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

      <Pagination
        currentPage={currentPage}
        totalItems={totalFilteredReservations.length}
        itemsPerPage={listSize}
        onPageChange={setCurrentPage}
      />

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
