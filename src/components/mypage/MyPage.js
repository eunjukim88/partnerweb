import { useRouter } from 'next/router';
import UserGuide from './UserGuide';
import RoomSettings from './RoomSettings';
import RoomEdit from './RoomEdit/index';
import ReservationSettings from './ReservationSettings';

const RightSectionContent = () => {
  const router = useRouter();
  const { section, roomNumber } = router.query;

  console.log('Current section:', section);
  console.log('Room number:', roomNumber);

  switch (section) {
    case 'user-guide':
      return <UserGuide />;
    case 'room-settings':
      return <RoomSettings />;
    case 'room-edit':
      return roomNumber ? <RoomEdit roomNumber={roomNumber} /> : null;
    case 'reservation-settings':
      return <ReservationSettings />;
    case 'special-date-settings':
      return <div>특정 예약 날짜 설정</div>;
    default:
      return <UserGuide />;
  }
};

export default RightSectionContent;