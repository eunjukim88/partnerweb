import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaEye, FaTrash, FaSearch, FaRedo } from 'react-icons/fa';
import theme from '../../styles/theme';
import { Button, Select, Input } from '../common/FormComponents';
import ManagerDetailModal from './ManagerDetailModal';

const ManagerList = () => {
  const [managers, setManagers] = useState([
    { id: 1, name: '김철수', phone: '010-1234-5678', email: 'kim@example.com', role: '영업담당' },
    { id: 2, name: '이영희', phone: '010-2345-6789', email: 'lee@example.com', role: '고객지원' },
    // ... 더 많은 초기 데이터
  ]);

  const [filteredManagers, setFilteredManagers] = useState(managers);
  const [listSize, setListSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

  useEffect(() => {
    handleSearch();
  }, [managers, listSize, searchTerm, currentPage]);

  const handleSearch = () => {
    const filtered = managers.filter(manager => 
      manager.name.includes(searchTerm) || 
      manager.phone.includes(searchTerm) || 
      manager.email.includes(searchTerm)
    );
    const startIdx = (currentPage - 1) * listSize;
    setFilteredManagers(filtered.slice(startIdx, startIdx + listSize));
  };

  const handleFilterChange = (filterType, value) => {
    switch(filterType) {
      case 'listSize':
        setListSize(Number(value));
        break;
      case 'searchTerm':
        setSearchTerm(value);
        break;
    }
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setListSize(10);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const handleOpenModal = (manager) => {
    setSelectedManager(manager);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedManager(null);
  };

  const handleDelete = (manager) => {
    if (window.confirm(`${manager.name}님을 삭제하시겠습니까? 사이트의 모든 접속 권한이 삭제됩니다.`)) {
      setManagers(managers.filter(m => m.id !== manager.id));
    }
  };

  const totalPages = Math.ceil(managers.length / listSize);

  return (
    <StyledContent>
      <ControlPanel>
        <ControlGroup>
          <StyledSelect value={listSize} onChange={(e) => handleFilterChange('listSize', e.target.value)}>
            <option value={10}>10개씩 보기</option>
            <option value={20}>20개씩 보기</option>
            <option value={30}>30개씩 보기</option>
          </StyledSelect>
        </ControlGroup>
        <ControlGroup>
          <SearchContainer>
            <StyledInput
              type="text"
              value={searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              placeholder="이름, 연락처, 이메일 검색"
            />
            <StyledButton onClick={handleSearch}>
              <FaSearch />
            </StyledButton>
          </SearchContainer>
          <StyledButton onClick={handleResetFilters}>
            <FaRedo /> 초기화
          </StyledButton>
        </ControlGroup>
        <ControlGroup>
          <StyledButton onClick={() => console.log('신규등록')}>신규등록</StyledButton>
        </ControlGroup>
      </ControlPanel>

      <ManagerTable>
        <thead>
          <tr>
            <th>이름</th>
            <th>연락처</th>
            <th>이메일</th>
            <th>담당업무</th>
            <th>상세보기</th>
            <th>삭제하기</th>
          </tr>
        </thead>
        <tbody>
          {filteredManagers.map(manager => (
            <tr key={manager.id}>
              <TableCell>{manager.name}</TableCell>
              <TableCell>{manager.phone}</TableCell>
              <TableCell>{manager.email}</TableCell>
              <TableCell>{manager.role}</TableCell>
              <TableCell>
                <ActionButton onClick={() => handleOpenModal(manager)}>
                  <FaEye />
                </ActionButton>
              </TableCell>
              <TableCell>
                <ActionButton onClick={() => handleDelete(manager)}>
                  <FaTrash />
                </ActionButton>
              </TableCell>
            </tr>
          ))}
        </tbody>
      </ManagerTable>

      <Pagination>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <PageButton
            key={page}
            onClick={() => setCurrentPage(page)}
            active={currentPage === page}
          >
            {page}
          </PageButton>
        ))}
      </Pagination>

      {isModalOpen && (
        <ManagerDetailModal
          manager={selectedManager}
          onClose={handleCloseModal}
        />
      )}
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

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  height: 100%;
`;

const ManagerTable = styled.table`
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

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
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

const StyledSelect = styled(Select)`
  height: 40px;
  padding: 0 10px;
`;

const StyledInput = styled(Input)`
  height: 40px;
  padding: 0 10px;
`;

const StyledButton = styled(Button)`
  height: 40px;
  padding: 0 15px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Pagination = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

const PageButton = styled.button`
  margin: 0 5px;
  padding: 5px 10px;
  border: 1px solid #ddd;
  background-color: ${props => props.active ? theme.colors.primary : 'white'};
  color: ${props => props.active ? 'white' : 'black'};
  cursor: pointer;

  &:hover {
    background-color: ${theme.colors.primary};
    color: white;
  }
`;

export default ManagerList;
