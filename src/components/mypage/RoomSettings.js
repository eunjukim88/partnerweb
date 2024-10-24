import { useState } from 'react';
import styled from 'styled-components';
import { Button, Input, Pagination } from '../common/FormComponents';

const RoomSettings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rooms, setRooms] = useState([
    { floor: 1, building: 'A', number: '101', name: '디럭스', type: '더블' },
    { floor: 1, building: 'A', number: '102', name: '스위트', type: '트윈' },
    { floor: 2, building: 'B', number: '201', name: '스탠다드', type: '싱글' },
    // ... 더 많은 방 데이터 추가
  ]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(rooms.length / itemsPerPage);

  const handleEdit = (roomNumber) => {
    alert(`${roomNumber}호 수정`);
  };

  const filteredRooms = rooms.filter((room) => room.number.includes(searchTerm));
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Container>
      <Header>
        <Title>객실 설정</Title>
        <SearchContainer>
          <Input
            type="text"
            placeholder="호수 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </SearchContainer>
      </Header>
      <TableContainer>
        <Table>
          <thead>
            <tr>
              <Th>층수</Th>
              <Th>동수</Th>
              <Th>호수</Th>
              <Th>객실이름</Th>
              <Th>객실타입</Th>
              <Th>수정</Th>
            </tr>
          </thead>
          <tbody>
            {paginatedRooms.map((room, index) => (
              <tr key={index}>
                <Td>{room.floor}</Td>
                <Td>{room.building}</Td>
                <Td>{room.number}</Td>
                <Td>{room.name}</Td>
                <Td>{room.type}</Td>
                <Td>
                  <Button onClick={() => handleEdit(room.number)}>수정</Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableContainer>
      <PaginationContainer>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </PaginationContainer>
    </Container>
  );
};

export default RoomSettings;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  width: 100%;
  height: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: ${props => props.theme.colors.text};
`;

const SearchContainer = styled.div`
  width: 300px;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background-color: ${props => props.theme.colors.buttonSecondary.background};
  color: ${props => props.theme.colors.text};
  padding: 12px;
  text-align: left;
  border: 1px solid ${props => props.theme.colors.border};
`;

const Td = styled.td`
  padding: 12px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;
