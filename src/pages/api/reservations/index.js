export default function handler(req, res) {
    const { method } = req;
  
    switch (method) {
      case 'GET':
        // 예약 정보 조회
        res.status(200).json({ reservations });
        break;
      case 'POST':
        // 새로운 예약 생성
        const newReservation = {
          id: Date.now().toString(),
          ...req.body,
        };
        reservations.push(newReservation);
        res.status(201).json({ message: '예약이 생성되었습니다', data: newReservation });
        break;
      case 'PUT':
        // 기존 예약 수정
        const updateData = req.body;
        const index = reservations.findIndex(r => r.id === updateData.id);
        if (index !== -1) {
          reservations[index] = { ...reservations[index], ...updateData };
          res.status(200).json({ message: '예약이 수정되었습니다', data: reservations[index] });
        } else {
          res.status(404).json({ message: '예약을 찾을 수 없습니다' });
        }
        break;
      case 'DELETE':
        // 예약 삭제
        const { ids } = req.body;
        reservations = reservations.filter(r => !ids.includes(r.id));
        res.status(200).json({ message: '예약이 삭제되었습니다', deletedIds: ids });
        break;
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  }
  
  let reservations = []; // 실제 애플리케이션에서는 데이터베이스를 사용해야 합니다