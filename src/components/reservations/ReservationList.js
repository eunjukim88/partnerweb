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

// 날짜 포맷팅 함수 추가
const formatDateToKorean = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const ReservationList = () => {
  // 필요한 상태만 구독
  const { 
    reservations,
    filteredReservations,
    totalFilteredReservations,
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
    resetFilters,
  } = useReservationStore();

  // 초기 데이터 로딩 및 날짜 설정
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    setStartDate(today);
    setEndDate(today);
    handleSearch();
  }, []);

  // 검색 핸들러 수정
  const handleSearch = async () => {
    try {
      setCurrentPage(1);
      await fetchReservations();
    } catch (error) {
      console.error('검색 오류:', error);
    }
  };

  // QuickDateButtons 클릭 시 endDate만 변경
  const handleQuickDate = (days) => {
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    newEndDate.setHours(0, 0, 0, 0);
    
    setEndDate(newEndDate);
    handleSearch();
  };

  // 날짜 직접 선택 핸들러
  const handleDateChange = (type, value) => {
    const newDate = value ? new Date(value) : null;
    if (newDate) {
      newDate.setHours(0, 0, 0, 0);
    }
    
    if (type === 'start') {
      setStartDate(newDate);
    } else {
      setEndDate(newDate);
    }
    handleSearch();
  };

  // 실시간 검색 처리
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // 검색 타입 변경 핸들러
  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
  };

  // 페이지네이션 계산 - null 체크 추가
  const totalItems = filteredReservations?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / (listSize || 10))); // listSize 0이면 기본값 10 사용

  if (isLoading) return <LoadingSpinner>로딩 중...</LoadingSpinner>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <Controls>
        <LeftControlGroup>
          <DateRangeContainer>
            <Input
              type="date"
              value={formatDateToKorean(startDate)}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
            <span>~</span>
            <Input
              type="date"
              value={formatDateToKorean(endDate)}
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
            <TableHeader>예약타입</TableHeader>
            <TableHeader>예약경로</TableHeader>
            <TableHeader>요금</TableHeader>
            <TableHeader>관리</TableHeader>
          </tr>
        </thead>
        <tbody>
          {filteredReservations && filteredReservations.length > 0 ? (
            filteredReservations.map(reservation => (
              <TableRow key={reservation.reservation_id}>
                <TableCell>{reservation.reservation_number}</TableCell>
                <TableCell>{reservation.guest_name}</TableCell>
                <TableCell>{reservation.phone}</TableCell>
                <TableCell>{formatDateToKorean(reservation.check_in_date)}</TableCell>
                <TableCell>{formatDateToKorean(reservation.check_out_date)}</TableCell>
                <TableCell>{reservation.room_number}호</TableCell>
                <TableCell>{reservation.stay_type}</TableCell>
                <TableCell>{reservation.booking_source}</TableCell>
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
      
      <PaginationButtons>
        <PaginationButton 
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          이전
        </PaginationButton>
        
        <span>
          {currentPage || 1} / {totalPages || 1}
        </span>
        
        <PaginationButton 
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          다음
        </PaginationButton>
      </PaginationButtons>
      
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

export default ReservationList;
