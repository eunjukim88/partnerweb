'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FaSearch, FaEdit, FaTrash, FaRedo } from 'react-icons/fa';
import ReservationModal from './ReservationModal';
import useReservationListStore from '../../store/reservationListStore';
import { 
  Button, 
  Select, 
  Input, 
  Pagination, 
} from '../common/FormComponents';
import { BOOKING_SOURCES } from '../../constants/reservation';
import axios from 'axios';

// 기존 유틸리티 함수들 유지
const formatDateToKorean = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getBookingSourceKorean = (source) => {
  const bookingSource = BOOKING_SOURCES.find(item => item.value === source);
  return bookingSource ? bookingSource.label : source;
};

const ReservationList = () => {
  // 필요한 상태만 구독
  const { 
    filteredReservations,
    currentPage,
    listSize,
    searchTerm,
    searchType,
    startDate,
    endDate,
    
    fetchReservations,
    setStartDate,
    setEndDate,
    setSearchTerm,
    setSearchType,
    setCurrentPage,
    applyFilters,
    resetFilters
  } = useReservationListStore();

  // 로컬 상태 유지
  const [localStartDate, setLocalStartDate] = useState(startDate);
  const [localEndDate, setLocalEndDate] = useState(endDate);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // 수정 모달 상태 관리
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 초기 데이터 로딩
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        setLocalStartDate(today);
        setLocalEndDate(today);
        setStartDate(today);
        setEndDate(today);
        
        await fetchReservations();
      } catch (error) {
        console.error('초기 데이터 로딩 실패:', error);
      }
    };

    loadInitialData();
  }, []);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback((type, value) => {
    const newDate = value ? new Date(value) : null;
    if (type === 'start') {
      setLocalStartDate(newDate);
    } else {
      setLocalEndDate(newDate);
    }
  }, []);

  // 검색 핸들러
  const handleSearch = useCallback(async () => {
    setStartDate(localStartDate);
    setEndDate(localEndDate);
    await fetchReservations();
  }, [localStartDate, localEndDate, setStartDate, setEndDate, fetchReservations]);

  // 수정 버튼 핸들러
  const handleEditClick = (reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  // 모달 닫기 핸들러
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  // 저장 완료 후 핸들러
  const handleSaveComplete = async () => {
    await fetchReservations();
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  // 삭제 버튼 핸들러 수정
  const handleDeleteClick = async (reservationId) => {
    if (window.confirm('예약을 삭제하시겠습니까?')) {
      try {
        // URL에서 ID 제거하고 body로 전달
        await axios({
          method: 'DELETE',
          url: '/api/reservations/reservations',
          data: {
            reservation_id: reservationId
          }
        });
        
        await fetchReservations();
      } catch (error) {
        console.error('예약 삭제 실패:', error);
        alert('예약 삭제에 실패했습니다: ' + error.message);
      }
    }
  };

  // 퀵 날짜 버튼 핸들러
  const handleQuickDateSelect = async (days) => {
    const newEndDate = new Date(localStartDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    setLocalEndDate(newEndDate);
    setEndDate(newEndDate);
    await fetchReservations();
  };

  // 기존 렌더링 로직 유지
  return (
    <Container>
      <Controls>
        <LeftControlGroup>
          <DateRangeContainer>
            <DateInput
              type="start"
              value={localStartDate}
              onChange={handleDateChange}
            />
            <span>~</span>
            <DateInput
              type="end"
              value={localEndDate}
              onChange={handleDateChange}
            />
          </DateRangeContainer>
          <ButtonGroup>
            <SearchButton onClick={handleSearch}>
              <FaSearch /> 기간 조회
            </SearchButton>
            <QuickButton onClick={() => handleQuickDateSelect(7)}>7일</QuickButton>
            <QuickButton onClick={() => handleQuickDateSelect(15)}>15일</QuickButton>
            <QuickButton onClick={() => handleQuickDateSelect(30)}>30일</QuickButton>
          </ButtonGroup>
        </LeftControlGroup>
        <RightControlGroup>
          <Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="reservation_number">예약번호</option>
            <option value="guest_name">고객명</option>
            <option value="phone">연락처</option>
          </Select>
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="검색어를 입력하세요"
          />
          <Button onClick={applyFilters}>
            <FaSearch /> 검색
          </Button>
          <Button onClick={resetFilters}>
            <FaRedo /> 초기화
          </Button>
        </RightControlGroup>
      </Controls>

      <TableContainer>
        <Table>
          <thead>
            <tr>
              <TableHeader>예약번호</TableHeader>
              <TableHeader>고객명</TableHeader>
              <TableHeader>연락처</TableHeader>
              <TableHeader>객실정보</TableHeader>
              <TableHeader>체크인</TableHeader>
              <TableHeader>체크아웃</TableHeader>
              <TableHeader>예약경로</TableHeader>
              <TableHeader>관리</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.slice((currentPage - 1) * listSize, currentPage * listSize).map(reservation => (
              <TableRow key={reservation.reservation_id}>
                <TableCell>{reservation.reservation_number}</TableCell>
                <TableCell>{reservation.guest_name}</TableCell>
                <TableCell>{reservation.phone}</TableCell>
                <TableCell>
                  {reservation.room_number}호
                  {reservation.room_type && ` (${reservation.room_type})`}
                </TableCell>
                <TableCell>{formatDateToKorean(reservation.check_in_date)}</TableCell>
                <TableCell>{formatDateToKorean(reservation.check_out_date)}</TableCell>
                <TableCell>{getBookingSourceKorean(reservation.booking_source)}</TableCell>
                <TableCell>
                  <ActionButtonGroup>
                    <ActionButton onClick={() => handleEditClick(reservation)}>
                      <FaEdit />
                    </ActionButton>
                    <ActionButton onClick={() => handleDeleteClick(reservation.reservation_id)}>
                      <FaTrash />
                    </ActionButton>
                  </ActionButtonGroup>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>

      <Pagination 
        currentPage={currentPage}
        totalPages={Math.ceil(filteredReservations.length / listSize)}
        onPageChange={setCurrentPage}
      />

      {isModalOpen && (
        <ReservationModal
          isEdit={true}
          initialData={selectedReservation}
          onClose={handleModalClose}
          onSave={handleSaveComplete}
        />
      )}
    </Container>
  );
};

// 스타일 컴포넌트들은 기존과 동일하게 유지
const Container = styled.div`
  padding: 20px;
  width: 100%;
`;

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
`;

const LeftControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RightControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const DateRangeContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  margin-top: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
`;

const TableHeader = styled.th`
  background-color: #f2f2f2;
  padding: 12px;
  text-align: center;
  border-bottom: 2px solid #ddd;
  font-weight: bold;
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #ddd;
  text-align: center;
  vertical-align: middle;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const ActionButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 4px;
  
  &:hover {
    color: #333;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  height: 38px;
`;

const QuickButton = styled(Button)`
  height: 100%;
  padding: 0 16px;
  background-color: #333;
  color: white;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const SearchButton = styled(Button)`
  height: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #535353;
  color: white;
  padding: 0 16px;
  
  &:hover {
    background-color: #333;
  }
`;

const DateInput = React.memo(({ value, onChange, type }) => {
  return (
    <Input
      type="date"
      value={value ? formatDateToKorean(value) : ''}
      onChange={(e) => onChange(type, e.target.value)}
    />
  );
});

export default ReservationList;