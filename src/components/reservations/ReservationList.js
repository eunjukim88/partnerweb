'use client';

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import useReservationDisplayStore from '../../store/reservationDisplayStore';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import ReservationModal from './ReservationModal';
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
  const { 
    reservations,
    filteredReservations,
    totalFilteredReservations,
    currentPage,
    listSize,
    searchTerm,
    searchType,
    startDate,
    endDate,
    bookingSource,
    stayType,
    isModalOpen,
    selectedReservation,
    isLoading,
    error,
    
    fetchReservations,
    deleteReservation,
    setCurrentPage,
    setListSize,
    setSearchTerm,
    setSearchType,
    setStartDate,
    setEndDate,
    setBookingSource,
    setStayType,
    setModalOpen,
    setSelectedReservation,
    handleSearch,
    handleQuickDate,
    resetFilters
  } = useReservationDisplayStore();

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchReservations();
        console.log('서버 응답:', result);
        
        if (Array.isArray(result)) {
          handleSearch();
        }
      } catch (error) {
        console.error('예약 데이터 로딩 오류:', error);
      }
    };
    loadData();
  }, [fetchReservations, handleSearch]);

  // 예약 데이터 변경 감지
  useEffect(() => {
    console.log('예약 데이터 변경됨:', reservations);
    if (Array.isArray(reservations) && reservations.length > 0) {
      handleSearch();
    }
  }, [reservations]);

  if (isLoading) return <LoadingSpinner>로딩 중...</LoadingSpinner>;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  return (
    <Container>
      <Controls>
        <LeftControlGroup>
          {/* 날짜 필터 */}
          <DateRangeContainer>
            <Input
              type="date"
              value={formatDateToKorean(startDate)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setStartDate(date);
              }}
            />
            <span>~</span>
            <Input
              type="date"
              value={formatDateToKorean(endDate)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                setEndDate(date);
              }}
            />
          </DateRangeContainer>

          {/* 빠른 날짜 선택 */}
          <QuickDateButtons>
            <Button onClick={() => handleQuickDate(7)}>7일</Button>
            <Button onClick={() => handleQuickDate(30)}>30일</Button>
            <Button onClick={() => handleQuickDate(90)}>90일</Button>
          </QuickDateButtons>

          {/* 필터 초기화 */}
          <Button onClick={resetFilters}>
            <FaRedo /> 초기화
          </Button>
        </LeftControlGroup>

        <RightControlGroup>
          {/* 검색 필터 */}
          <Select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
            <option value="reservation_number">예약번호</option>
            <option value="guest_name">고객명</option>
            <option value="phone">연락처</option>
          </Select>

          <SearchContainer>
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색어를 입력하세요"
            />
            <Button onClick={handleSearch}>
              <FaSearch /> 검색
            </Button>
          </SearchContainer>
        </RightControlGroup>
      </Controls>

      {/* 예약 목록 테이블 */}
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

      {/* 페이지네이션 */}
      <PaginationButtons>
        <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
          처음
        </PaginationButton>
        <PaginationButton 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          이전
        </PaginationButton>
        
        <span>{currentPage} / {Math.ceil(totalFilteredReservations.length / listSize)}</span>
        
        <PaginationButton 
          onClick={() => setCurrentPage(prev => 
            Math.min(Math.ceil(totalFilteredReservations.length / listSize), prev + 1)
          )}
          disabled={currentPage >= Math.ceil(totalFilteredReservations.length / listSize)}
        >
          다음
        </PaginationButton>
      </PaginationButtons>

      {/* 예약 수정 모달 */}
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
