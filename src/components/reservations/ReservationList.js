'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import useReservationStore from '../../store/reservationStore';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import ReservationModal from './ReservationModal';
import { 
  Button, 
  Select, 
  Input, 
  PaginationButtons, 
  PaginationButton,
  Pagination 
} from '../common/FormComponents';
import { BOOKING_SOURCES, STAY_TYPES } from '../../constants/reservation';

const ReservationList = () => {
  // zustand store 사용
  const { 
    reservations, 
    fetchReservations,
    deleteReservation,
    addReservation,
    updateReservation,
    isLoading,
    error 
  } = useReservationStore();

  // 로컬 상태들
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [totalFilteredReservations, setTotalFilteredReservations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('reservationNumber');
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
  const [bookingSource, setBookingSource] = useState('all');
  const [stayType, setStayType] = useState('all');
  const [listSize, setListSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // 컴포넌트 마운트 시 예약 데이터 로드
  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 검색 및 필터링 로직
  const handleSearch = useCallback(() => {
    if (!Array.isArray(reservations)) return;

    let filtered = [...reservations];
    
    // 날짜 필터링
    if (startDate && endDate) {
      filtered = filtered.filter(reservation => {
        if (!reservation.check_in) return false;
        
        const checkIn = new Date(reservation.check_in);
        checkIn.setHours(0, 0, 0, 0);
        
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        
        return checkIn >= start && checkIn <= end;
      });
    }

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
            return r.reservation_number?.includes(searchTerm);
          case 'guestName':
            return r.guest_name?.includes(searchTerm);
          case 'phone':
            return r.phone?.includes(searchTerm);
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
  }, [reservations, startDate, endDate, bookingSource, stayType, searchType, searchTerm, currentPage, listSize]);

  // 필터 변경 시 검색 실행
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // 필터 초기화
  const handleResetFilters = () => {
    const today = new Date();
    setStartDate(new Date(today.setHours(0, 0, 0, 0)));
    setEndDate(new Date(today.setHours(23, 59, 59, 999)));
    setBookingSource('all');
    setStayType('all');
    setSearchType('reservationNumber');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // 빠른 날짜 선택 (미래 날짜)
  const handleQuickDate = (days) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);

    const end = new Date();
    end.setDate(end.getDate() + days); // 오늘부터 N일 후까지
    end.setHours(23, 59, 59, 999);
    setEndDate(end);
  };

  // 필터 변경 핸들러
  const handleFilterChange = (type, value) => {
    switch (type) {
      case 'listSize':
        setListSize(value);
        setCurrentPage(1);
        break;
      case 'bookingSource':
        setBookingSource(value);
        setCurrentPage(1);
        break;
      case 'stayType':
        setStayType(value);
        setCurrentPage(1);
        break;
      case 'searchType':
        setSearchType(value);
        setCurrentPage(1);
        break;
      case 'searchTerm':
        setSearchTerm(value);
        setCurrentPage(1);
        break;
      default:
        break;
    }
  };

  // 예약 삭제 핸들러
  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 예약을 삭제하시겠습니까?')) {
      try {
        await deleteReservation(id);
        // 삭제 후 필터링된 목록도 업데이트
        setFilteredReservations(prev => prev.filter(r => r.id !== id));
        setTotalFilteredReservations(prev => prev.filter(r => r.id !== id));
        
        // 현재 페이지에 항목이 없으면 이전 페이지로 이동
        const remainingItems = filteredReservations.length - 1;
        if (remainingItems === 0 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } catch (error) {
        console.error('예약 삭제 실패:', error);
        alert('예약 삭제에 실패했습니다.');
      }
    }
  };

  // 모달 열기
  const handleOpenModal = (reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // 예약 저장 핸들러
  const handleSaveReservation = async (reservationData) => {
    try {
      if (reservationData.id) {
        await updateReservation(reservationData.id, reservationData);
      } else {
        await addReservation(reservationData);
      }
      handleSearch(); // 목록 새로고침
    } catch (error) {
      console.error('예약 저장 실패:', error);
      throw error;
    }
  };

  // 날짜 포맷팅
  const formatDateTime = (date, time) => {
    if (!date) return '';
    const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return time ? `${formattedDate} ${time}` : formattedDate;
  };

  return (
    <StyledContent>
      <ControlPanel>
        <LeftControlGroup>
          <Select 
            value={listSize} 
            onChange={(e) => handleFilterChange('listSize', Number(e.target.value))}
          >
            <option value={10}>10개씩</option>
            <option value={20}>20개씩</option>
            <option value={30}>30개씩</option>
            <option value={50}>50개씩</option>
          </Select>

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
        </LeftControlGroup>

        <RightControlGroup>
          <Select 
            value={bookingSource} 
            onChange={(e) => handleFilterChange('bookingSource', e.target.value)}
          >
            <option value="all">전체 예약경로</option>
            {BOOKING_SOURCES.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
          </Select>

          <Select 
            value={stayType} 
            onChange={(e) => handleFilterChange('stayType', e.target.value)}
          >
            <option value="all">전체 숙박유형</option>
            {STAY_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>

          <SearchContainer>
            <Select 
              value={searchType} 
              onChange={(e) => handleFilterChange('searchType', e.target.value)}
            >
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
            <FaRedo />
          </Button>
        </RightControlGroup>
      </ControlPanel>

      {isLoading ? (
        <LoadingSpinner>데이터를 불러오는 중...</LoadingSpinner>
      ) : error ? (
        <ErrorMessage>에러: {error}</ErrorMessage>
      ) : filteredReservations.length > 0 ? (
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
                <TableCell>{reservation.reservation_number}</TableCell>
                <TableCell>{reservation.room_number}</TableCell>
                <TableCell>
                  {formatDateTime(reservation.check_in, reservation.check_in_time)}
                </TableCell>
                <TableCell>
                  {formatDateTime(reservation.check_out, reservation.check_out_time)}
                </TableCell>
                <TableCell>{reservation.guest_name}</TableCell>
                <TableCell>{reservation.phone}</TableCell>
                <TableCell>{reservation.booking_source}</TableCell>
                <TableCell>{reservation.stay_type}</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <ActionButton onClick={() => handleOpenModal(reservation)}>
                      <FaEdit />
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDelete(reservation.id)}
                      title="예약 삭제"
                    >
                      <FaTrash />
                    </ActionButton>
                  </ActionButtonGroup>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </ReservationTable>
      ) : (
        <EmptyMessage>예약 내역이 없습니다.</EmptyMessage>
      )}

      {isModalOpen && (
        <ReservationModal
          reservation={selectedReservation}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedReservation(null);
          }}
          onSave={async (savedData) => {
            await handleSaveReservation(savedData);
            setIsModalOpen(false);
            setSelectedReservation(null);
          }}
        />
      )}

      <PaginationButtons>
        <PaginationButton 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
        >
          처음
        </PaginationButton>
        <PaginationButton 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          이전
        </PaginationButton>
        
        <span style={{ margin: '0 10px', color: '#6c757d' }}>
          {currentPage} / {Math.ceil(totalFilteredReservations.length / listSize)}
        </span>
        
        <PaginationButton 
          onClick={() => setCurrentPage(prev => 
            Math.min(Math.ceil(totalFilteredReservations.length / listSize), prev + 1)
          )}
          disabled={currentPage >= Math.ceil(totalFilteredReservations.length / listSize)}
        >
          다음
        </PaginationButton>
        <PaginationButton 
          onClick={() => setCurrentPage(Math.ceil(totalFilteredReservations.length / listSize))}
          disabled={currentPage >= Math.ceil(totalFilteredReservations.length / listSize)}
        >
          마지막
        </PaginationButton>
      </PaginationButtons>
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
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
  
  @media (max-width: 1200px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LeftControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
`;

const RightControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  justify-content: flex-end;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  
  span {
    color: #6c757d;
  }
`;

const QuickDateButtons = styled.div`
  display: flex;
  gap: 4px;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 300px;
`;

const ReservationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background-color: white;

  th, td {
    padding: 12px;
    text-align: center;
    border-bottom: 1px solid #eee;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
    color: #495057;
  }

  tbody tr:hover {
    background-color: #f8f9fa;
  }

  @media (max-width: 1024px) {
    display: block;
    overflow-x: auto;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  color: #6c757d;
  border-radius: 4px;
  transition: all 0.2s;

  &:hover {
    background-color: #e9ecef;
    color: #495057;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(108, 117, 125, 0.25);
  }
`;

const TableCell = styled.td`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #007bff;
`;

const ErrorMessage = styled.div`
  color: #dc3545;
  text-align: center;
  padding: 20px;
  background-color: #f8d7da;
  border-radius: 4px;
  margin: 20px 0;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #6c757d;
  background-color: #f8f9fa;
  border-radius: 4px;
  margin: 20px 0;
`;

export default ReservationList;
