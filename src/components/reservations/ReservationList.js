'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import ReservationModal from './ReservationModal';
import useReservationStore from '../../store/reservationStore';
import { 
  Button, 
  Select, 
  Input, 
  PaginationButtons, 
  PaginationButton 
} from '../common/FormComponents';
import { BOOKING_SOURCES } from '../../constants/reservation';

// 날짜 포맷팅 함수 추가
const formatDateToKorean = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// 예약 경로 한글 변환 함수 수정
const getBookingSourceKorean = (source) => {
  const bookingSource = BOOKING_SOURCES.find(item => item.value === source);
  return bookingSource ? bookingSource.label : source;
};

const ReservationList = () => {
  // 필요한 상태만 구독
  const { 
    filteredReservations,
    isLoading,
    error,
    currentPage,
    listSize,
    searchTerm,
    searchType,
    startDate,
    endDate,
    isModalOpen,
    selectedReservation,
    
    fetchReservations,
    deleteReservation,
    setModalOpen,
    setSelectedReservation,
    setCurrentPage,
    setSearchTerm,
    setSearchType,
    setStartDate,
    setEndDate,
  } = useReservationStore();

  // 초기 데이터 로딩 및 날짜 설정
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        setStartDate(today);
        setEndDate(today);
        await fetchReservations();
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, []);

  // 검색 조건이 변경될 때마다 데이터 다시 로딩
  useEffect(() => {
    fetchReservations();
  }, [startDate, endDate, searchTerm, searchType]);

  // QuickDateButtons 클릭 시 endDate만 변경
  const handleQuickDate = (days) => {
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    newEndDate.setHours(0, 0, 0, 0);
    
    setEndDate(newEndDate);
  };

  // 날짜 직접 선택 핸들러
  const handleDateChange = (type, value) => {
    const newDate = value ? new Date(value) : null;
    if (newDate) {
      newDate.setHours(0, 0, 0, 0);
      if (type === 'start') {
        setStartDate(newDate);
      } else {
        setEndDate(newDate);
      }
    }
  };

  // 실시간 검색 처리
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  // 페이지네이션 관련 계산
  const itemsPerPage = 10;
  const totalItems = filteredReservations?.length || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredReservations?.slice(startIndex, endIndex) || [];

  if (isLoading) return <LoadingSpinner>로딩 중...</LoadingSpinner>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <Controls>
        <LeftControlGroup>
          <DateRangeContainer>
            <Input
              type="date"
              value={startDate ? formatDateToKorean(startDate) : ''}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
            <span>~</span>
            <Input
              type="date"
              value={endDate ? formatDateToKorean(endDate) : ''}
              onChange={(e) => handleDateChange('end', e.target.value)}
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
            value={searchType} 
            onChange={handleSearchTypeChange}
          >
            <option value="reservation_number">예약번호</option>
            <option value="guest_name">고객명</option>
            <option value="phone">연락처</option>
          </Select>
          
          <SearchContainer>
            <Input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="검색어를 입력하세요"
            />
            <Button onClick={() => setSearchTerm('')}>
              <FaSearch /> 초기화
            </Button>
          </SearchContainer>
        </RightControlGroup>
      </Controls>
      
      <ReservationTable>
        <thead>
          <tr>
            <TableHeader>예약번호</TableHeader>
            <TableHeader>고객명</TableHeader>
            <TableHeader>연락처</TableHeader>
            <TableHeader>체크인</TableHeader>
            <TableHeader>체크아웃</TableHeader>
            <TableHeader>객실</TableHeader>
            <TableHeader>숙박유형</TableHeader>
            <TableHeader>예약경로</TableHeader>
            <TableHeader>요금</TableHeader>
            <TableHeader>관리</TableHeader>
          </tr>
        </thead>
        <tbody>
          {currentPageData.length > 0 ? (
            currentPageData.map(reservation => (
              <TableRow key={reservation.reservation_id}>
                <TableCell>{reservation.reservation_number}</TableCell>
                <TableCell>{reservation.guest_name}</TableCell>
                <TableCell>{reservation.phone}</TableCell>
                <TableCell>{formatDateToKorean(reservation.check_in_date)}</TableCell>
                <TableCell>{formatDateToKorean(reservation.check_out_date)}</TableCell>
                <TableCell>{reservation.room_number}호</TableCell>
                <TableCell>{reservation.stay_type}</TableCell>
                <TableCell>{getBookingSourceKorean(reservation.booking_source)}</TableCell>
                <TableCell>{reservation.rate_amount?.toLocaleString()}원</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <ActionButton onClick={() => {
                      setSelectedReservation(reservation);
                      setModalOpen(true);
                    }}>
                      <FaEdit />
                    </ActionButton>
                    <ActionButton onClick={() => deleteReservation(reservation.reservation_id)}>
                      <FaTrash />
                    </ActionButton>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <tr>
              <td colSpan="10" style={{ textAlign: 'center' }}>
                예약 내역이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </ReservationTable>
      
      {totalItems > 0 && (
        <PaginationContainer>
          <PaginationInfo>
            전체 {totalItems}건 중 {startIndex + 1}-{Math.min(endIndex, totalItems)}건
          </PaginationInfo>
          <PaginationButtons>
            <PaginationButton 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              {'<<'}
            </PaginationButton>
            <PaginationButton 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              이전
            </PaginationButton>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
              <PageNumber
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                $active={currentPage === pageNum}
              >
                {pageNum}
              </PageNumber>
            ))}
            <PaginationButton 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              다음
            </PaginationButton>
            <PaginationButton 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              {'>>'}
            </PaginationButton>
          </PaginationButtons>
        </PaginationContainer>
      )}
      
      {isModalOpen && (
        <ReservationModal
          isEdit={!!selectedReservation}
          initialData={selectedReservation}
          onClose={() => {
            setModalOpen(false);
            setSelectedReservation(null);
          }}
          onSave={fetchReservations}
        />
      )}
    </Container>
  );
};

// 스타일 컴포넌트들은 최소한으로 유지
const Container = styled.div`
  padding: 20px;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
`;

const LeftControlGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const RightControlGroup = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const QuickDateButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const ReservationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
`;

const TableCell = styled.td`
  padding: 12px;
  border: 1px solid #ddd;
  text-align: center;
`;

const ActionButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
`;

const ActionButton = styled(Button)`
  padding: 4px 8px;
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 20px;
`;

const ErrorMessage = styled.div`
  color: red;
  text-align: center;
  padding: 20px;
`;

const TableHeader = styled.th`
  padding: 12px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  text-align: center;
  font-weight: bold;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
`;

const PaginationInfo = styled.div`
  color: #666;
  font-size: 0.9em;
`;

const PageNumbers = styled.div`
  display: flex;
  gap: 5px;
  align-items: center;
  margin: 0 10px;
`;

const PageNumber = styled.button`
  padding: 5px 10px;
  border: 1px solid ${props => props.$active ? '#007bff' : '#dee2e6'};
  background-color: ${props => props.$active ? '#007bff' : 'white'};
  color: ${props => props.$active ? 'white' : '#333'};
  cursor: pointer;
  border-radius: 4px;

  &:hover {
    background-color: ${props => props.$active ? '#0056b3' : '#e9ecef'};
  }
`;

export default ReservationList;