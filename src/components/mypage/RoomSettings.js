import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button, Input, Pagination } from '../common/FormComponents';
import { useRouter } from 'next/router';
import useRoomStore from '@/src/store/roomStore';

const RoomSettings = () => {
  const { rooms, isLoading, error, fetchRooms, updateRoom: updateRoomStore } = useRoomStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const loadRooms = async () => {
      await fetchRooms();
    };
    loadRooms();
  }, [fetchRooms]);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  const itemsPerPage = 10;

  const filteredRooms = rooms.filter((room) => {
    if (!room || !room.room_number) return false;
    return room.room_number.toString().includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleEdit = (room) => {
    console.log('Editing room (before):', room);

    if (!room || typeof room.room_id !== 'number' || isNaN(room.room_id)) {
      console.error('Invalid room_id:', room);
      alert('유효하지 않은 객실 정보입니다.');
      return;
    }

    if (!room.room_number) {
      console.error('Missing room_number:', room);
      alert('객실 번호가 없습니다.');
      return;
    }

    console.log('Editing room (after validation):', room);
    router.push(`/mypage?section=room-edit&roomNumber=${room.room_number}&roomId=${room.room_id}`);
  };

  const handleRoomUpdate = async (roomData) => {
    try {
      const room_id = roomData.room_id;
      
      if (!room_id) {
        throw new Error('객실 ID가 누락되었습니다.');
      }

      const roomDataToUpdate = {
        roomData: {
          room_floor: roomData.room_floor,
          room_building: roomData.room_building,
          room_name: roomData.room_name,
          room_type: roomData.room_type,
          show_floor: roomData.show_floor,
          show_building: roomData.show_building,
          show_name: roomData.show_name,
          show_type: roomData.show_type
        },
        ratesData: {
          rate_hourly_weekday: roomData.rate_hourly_weekday,
          rate_hourly_friday: roomData.rate_hourly_friday,
          rate_hourly_weekend: roomData.rate_hourly_weekend,
          rate_nightly_weekday: roomData.rate_nightly_weekday,
          rate_nightly_friday: roomData.rate_nightly_friday,
          rate_nightly_weekend: roomData.rate_nightly_weekend
        }
      };

      await updateRoomStore(room_id, roomDataToUpdate);
      alert('객실 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('객실 정보 업데이트 실패:', error);
      alert(error.message || '객실 정보 업데이트에 실패했습니다.');
    }
  };

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
            {paginatedRooms.map((room, index) => {
              console.log(`Room ${index}:`, room);
              
              if (!room || !room.room_id) {
                console.error(`Invalid room at index ${index}:`, room);
                return null;
              }

              return (
                <tr key={room.room_id}>
                  <TableCell>{room.room_floor}</TableCell>
                  <TableCell>{room.room_building}</TableCell>
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>{room.room_name}</TableCell>
                  <TableCell>{room.room_type}</TableCell>
                  <TableCell>
                    <ActionButton onClick={() => handleEdit(room)}>
                      {room.room_number}호 수정
                    </ActionButton>
                  </TableCell>
                </tr>
              );
            })}
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

// 스타일 정의
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
