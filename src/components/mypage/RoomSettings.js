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
      <SearchContainer>
        <Input
          type="text"
          placeholder="호수 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchContainer>
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
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </Container>
  );
};

export default RoomSettings;

const Container = styled.div`
  padding: 20px;
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background-color: #f2f2f2;
  padding: 12px;
  text-align: left;
  border: 1px solid #ddd;
`;

const Td = styled.td`
  padding: 12px;
  border: 1px solid #ddd;
`;
