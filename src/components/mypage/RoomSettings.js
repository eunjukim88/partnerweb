import { useState, useEffect } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { Button, Input, Pagination } from '../common/FormComponents';
import { useRouter } from 'next/router';

const RoomSettings = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/mypage/roomslist');
      console.log('API 응답:', response.data);
      setRooms(response.data);
    } catch (error) {
      console.error('객실 정보를 가져오는 데 실패했습니다:', error);
      setError(`객실 정보를 불러오는 중 오류가 발생했습니다: ${error.response?.data?.details || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  const itemsPerPage = 10;
  const totalPages = Math.ceil(rooms.length / itemsPerPage);

  const handleEdit = (roomNumber) => {
    router.push(`/mypage?section=room-edit&roomNumber=${roomNumber}`);
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말로 이 객실을 삭제하시겠습니까?')) {
      try {
        await axios.delete(`/api/mypage/roomslist?id=${id}`);
        fetchRooms(); // 삭제 후 목록 새로고침
      } catch (error) {
        console.error('객실 삭제에 실패했습니다:', error);
        setError('객실 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    }
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
