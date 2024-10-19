import { tempReservations } from '../../../data/tempData';

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      res.status(200).json({ reservations: tempReservations });
      break;
    case 'POST':
      const newReservation = {
        id: Date.now().toString(),
        ...req.body,
      };
      res.status(201).json({ message: '예약이 생성되었습니다', data: newReservation });
      break;
    case 'PUT':
      const updateData = req.body;
      const updatedReservation = tempReservations.find(r => r.id === updateData.id);
      if (updatedReservation) {
        res.status(200).json({ message: '예약이 수정되었습니다', data: { ...updatedReservation, ...updateData } });
      } else {
        res.status(404).json({ message: '예약을 찾을 수 없습니다' });
      }
      break;
    case 'DELETE':
      const { ids } = req.body;
      const deletedReservations = tempReservations.filter(r => ids.includes(r.id));
      if (deletedReservations.length > 0) {
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