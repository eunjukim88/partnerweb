

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      res.status(200).json({ reservations });
      break;
    case 'POST':
      try {
        const newReservation = validateReservation({
          id: Date.now().toString(),
          ...req.body,
        });
        reservations.push(newReservation);
        res.status(201).json({ message: '예약이 생성되었습니다', data: newReservation });
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
      break;
    case 'PUT':
      try {
        const updateData = validateReservation(req.body);
        const index = reservations.findIndex(r => r.id === updateData.id);
        if (index !== -1) {
          reservations[index] = { ...reservations[index], ...updateData };
          res.status(200).json({ message: '예약이 수정되었습니다', data: reservations[index] });
        } else {
          res.status(404).json({ message: '예약을 찾을 수 없습니다' });
        }
      } catch (error) {
        res.status(400).json({ message: error.message });
      }
      break;
    case 'DELETE':
      const { ids } = req.body;
      const initialLength = reservations.length;
      reservations = reservations.filter(r => !ids.includes(r.id));
      if (reservations.length < initialLength) {
        res.status(200).json({ message: '예약이 삭제되었습니다', deletedIds: ids });
      } else {
        res.status(404).json({ message: '삭제할 예약을 찾을 수 없습니다' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}

function validateReservation(data) {
  const requiredFields = ['roomNumber', 'checkIn', 'checkOut', 'guestName', 'phone', 'bookingSource', 'stayType'];
  for (let field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} 필드는 필수입니다.`);
    }
  }

  // 날짜 유효성 검사
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('유효하지 않은 날짜 형식입니다.');
  }
  if (checkOut <= checkIn) {
    throw new Error('체크아웃 날짜는 체크인 날짜보다 늦어야 합니다.');
  }

  // ISO 8601 형식으로 날짜 변환
  data.checkIn = checkIn.toISOString();
  data.checkOut = checkOut.toISOString();

  return data;
}
