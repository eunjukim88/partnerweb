import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Input, Pagination } from '../common/FormComponents';

// 헤더 컴포넌트
const Header = ({ onAddClick }) => (
  <HeaderContainer>
    <Title>특정 날짜 예약 설정</Title>
    <AddButton onClick={onAddClick}>
      <FaPlus size={16} /> 추가하기
    </AddButton>
  </HeaderContainer>
);

// 입력 폼 컴포넌트
const InputForm = ({ newDate, onChange, onSubmit }) => (
  <FormContainer>
    <StyledInput
      type="date"
      value={newDate.date}
      onChange={(e) => onChange('date', e.target.value)}
    />
    <StyledInput
      type="time"
      value={newDate.checkIn}
      onChange={(e) => onChange('checkIn', e.target.value)}
      placeholder="체크인 시간"
    />
    <StyledInput
      type="time"
      value={newDate.checkOut}
      onChange={(e) => onChange('checkOut', e.target.value)}
      placeholder="체크아웃 시간"
    />
    <StyledInput
      type="number"
      value={newDate.price}
      onChange={(e) => onChange('price', e.target.value)}
      placeholder="예약 요금"
    />
    <SubmitButton onClick={onSubmit}>등록</SubmitButton>
  </FormContainer>
);

// 테이블 컴포넌트
const Table = ({ items, onEdit, onDelete }) => (
  <StyledTable>
    <thead>
      <tr>
        <th>날짜</th>
        <th>체크인 시간</th>
        <th>체크아웃 시간</th>
        <th>예약 요금</th>
        <th>관리</th>
      </tr>
    </thead>
    <tbody>
      {items.map((date, index) => (
        <tr key={index}>
          <td>{date.date}</td>
          <td>{date.checkIn}</td>
          <td>{date.checkOut}</td>
          <td>{Number(date.price).toLocaleString()}원</td>
          <td>
            <IconButton onClick={() => onEdit(index)}><FaEdit /></IconButton>
            <IconButton onClick={() => onDelete(index)}><FaTrash /></IconButton>
          </td>
        </tr>
      ))}
    </tbody>
  </StyledTable>
);

// 메인 컴포넌트
const SpecialDateSettings = () => {
  const [specialDates, setSpecialDates] = useState([]);
  const [newSpecialDate, setNewSpecialDate] = useState({ date: '', checkIn: '', checkOut: '', price: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const today = new Date();
    setSpecialDates(prevDates => prevDates.filter(date => new Date(date.date) >= today));
  }, []);

  const handleNewSpecialDateChange = (field, value) => {
    setNewSpecialDate(prev => ({ ...prev, [field]: value }));
  };

  const handleAddSpecialDate = () => {
    if (newSpecialDate.date && newSpecialDate.checkIn && newSpecialDate.checkOut && newSpecialDate.price) {
      setSpecialDates(prev => [...prev, newSpecialDate]);
      setNewSpecialDate({ date: '', checkIn: '', checkOut: '', price: '' });
      setIsAdding(false);
    }
  };

  const handleDeleteSpecialDate = (index) => {
    setSpecialDates(prev => prev.filter((_, i) => i !== index));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = specialDates.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <Container>
      <Header onAddClick={() => setIsAdding(!isAdding)} />
      {isAdding && (
        <InputForm
          newDate={newSpecialDate}
          onChange={handleNewSpecialDateChange}
          onSubmit={handleAddSpecialDate}
        />
      )}
      {specialDates.length > 0 ? (
        <>
          <Table
            items={currentItems}
            onEdit={(index) => console.log('Edit', index)}
            onDelete={handleDeleteSpecialDate}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(specialDates.length / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <NoDataMessage>등록된 특정 날짜 예약이 없습니다.</NoDataMessage>
      )}
    </Container>
  );
};

export default SpecialDateSettings;

// 스타일 컴포넌트
const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: ${theme.colors.text};
`;

const AddButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 16px;
  font-weight: bold;
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }

  svg {
    vertical-align: middle;
  }
`;

const FormContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
`;

const StyledInput = styled(Input)`
  flex: 1;
  min-width: 150px;
`;

const SubmitButton = styled(Button)`
  min-width: 100px;
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;

  th, td {
    border: 1px solid ${theme.colors.border};
    padding: 12px;
    text-align: left;
  }

  th {
    background-color: ${theme.colors.buttonSecondary.background};
    color: ${theme.colors.text};
    font-weight: bold;
  }

  tr:nth-child(even) {
    background-color: ${theme.colors.background};
  }
`;

const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${theme.colors.buttonPrimary.background};
  margin-right: 5px;
  font-size: 16px;

  &:hover {
    color: ${theme.colors.buttonPrimary.hover};
  }
`;

const NoDataMessage = styled.p`
  text-align: center;
  color: ${theme.colors.text};
  font-size: 16px;
  margin-top: 20px;
`;
