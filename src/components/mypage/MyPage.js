import { useRouter } from 'next/router';
import RoomSettings from './RoomSettings';
import RoomEdit from './RoomEdit';

const RightSection = () => {
  const router = useRouter();
  const { section, roomNumber } = router.query;

  switch (section) {
    case 'room-settings':
      return <RoomSettings />;
    case 'room-edit':
      return <RoomEdit roomNumber={roomNumber} />;
    // ... 다른 케이스들 ...
    default:
      return <RoomSettings />;
  }
};

export default RightSection;
