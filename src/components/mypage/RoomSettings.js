import { useState } from 'react';
import { useRouter } from 'next/router';
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

  const router = useRouter();

  const handleEdit = (roomNumber) => {
    router.push(`/mypage?section=room-edit&roomNumber=${roomNumber}`, undefined, { shallow: true });
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
        <MessageTable>
          <thead>
            <tr>
              <TableHeader>층수</TableHeader>
              <TableHeader>동수</TableHeader>
              <TableHeader>호수</TableHeader>
              <TableHeader>객실이름</TableHeader>
              <TableHeader>객실타입</TableHeader>
              <TableHeader>수정</TableHeader>
            </tr>
          </thead>
          <tbody>
            {paginatedRooms.map((room, index) => (
              <tr key={index}>
                <TableCell>{room.floor}</TableCell>
                <TableCell>{room.building}</TableCell>
                <TableCell>{room.number}</TableCell>
                <TableCell>{room.name}</TableCell>
                <TableCell>{room.type}</TableCell>
                <TableCell>
                  <ActionButton onClick={() => handleEdit(room.number)}>수정</ActionButton>
                </TableCell>
              </tr>
            ))}
          </tbody>
        </MessageTable>
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
  text-align: right;
`;

const TableContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const MessageTable = styled.table`
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

const TableHeader = styled.th`
  background-color: #f2f2f2;
  text-align: center;
  vertical-align: middle;
`;

const TableCell = styled.td`
  text-align: center;
  vertical-align: middle;
`;

const ActionButton = styled(Button)`
  background-color: #3395FF;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #2678d9;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;
