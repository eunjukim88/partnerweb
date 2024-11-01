import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT 
          id,
          reservation_number,
          room_number,
          guest_name,
          phone,
          TO_CHAR(check_in, 'YYYY-MM-DD') as check_in,
          TO_CHAR(check_out, 'YYYY-MM-DD') as check_out,
          TO_CHAR(check_in_time, 'HH24:MI:SS') as check_in_time,
          TO_CHAR(check_out_time, 'HH24:MI:SS') as check_out_time,
          booking_source,
          stay_type,
          status,
          memo,
          price
        FROM reservations 
        WHERE id = ${id}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });
      }

      const reservation = {
        ...rows[0],
        price: Number(rows[0].price)
      };

      res.status(200).json(reservation);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      res.status(500).json({ error: '예약 조회에 실패했습니다.' });
    }
  } else if (req.method === 'PUT') {
    try {
      // PUT 요청 처리 로직
      const updateData = req.body;
      const result = await sql`
        UPDATE reservations
        SET
          room_number = ${updateData.roomNumber},
          guest_name = ${updateData.guestName},
          phone = ${updateData.phone},
          check_in = ${updateData.checkIn}::date,
          check_out = ${updateData.checkOut}::date,
          check_in_time = ${updateData.checkInTime}::time,
          check_out_time = ${updateData.checkOutTime}::time,
          booking_source = ${updateData.bookingSource},
          stay_type = ${updateData.stayType},
          status = ${updateData.status || 'confirmed'},
          memo = ${updateData.memo || ''},
          price = ${updateData.price}
        WHERE id = ${id}
        RETURNING *
      `;

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('예약 수정 실패:', error);
      res.status(500).json({ error: '예약 수정에 실패했습니다.' });
    }
  } else if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM reservations WHERE id = ${id}`;
      res.status(200).json({ message: '예약이 삭제되었습니다.' });
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      res.status(500).json({ error: '예약 삭제에 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}