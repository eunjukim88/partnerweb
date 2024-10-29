import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT r.*, rm.status as room_status
        FROM reservations r
        LEFT JOIN rooms rm ON r.room_number = rm.number
        ORDER BY r.check_in DESC
      `;
      res.status(200).json({ reservations: rows });
    } catch (error) {
      res.status(500).json({ error: '예약 조회에 실패했습니다.' });
    }
  } else if (req.method === 'POST') {
    try {
      const reservationData = req.body;
      validateReservation(reservationData);

      await sql`BEGIN`;

      // 예약 정보 저장
      const result = await sql`
        INSERT INTO reservations (
          reservation_number,
          room_number,
          guest_name,
          phone,
          check_in,
          check_out,
          check_in_time,
          check_out_time,
          booking_source,
          stay_type,
          status,
          memo,
          created_at,
          updated_at
        ) VALUES (
          ${reservationData.reservation_number},
          ${reservationData.room_number},
          ${reservationData.guest_name},
          ${reservationData.phone},
          ${reservationData.check_in},
          ${reservationData.check_out},
          ${reservationData.check_in_time},
          ${reservationData.check_out_time},
          ${reservationData.booking_source},
          ${reservationData.stay_type},
          ${reservationData.status},
          ${reservationData.memo || null},
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP
        ) RETURNING *
      `;

      // 객실 상태 업데이트
      await sql`
        UPDATE rooms 
        SET status = ${
          reservationData.stayType === '대실' ? 'hourlyStay' :
          reservationData.stayType === '숙박' ? 'overnightStay' : 'longStay'
        }
        WHERE number = ${reservationData.roomNumber}
      `;

      await sql`COMMIT`;
      res.status(201).json(result.rows[0]);
    } catch (error) {
      await sql`ROLLBACK`;
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'PUT') {
    try {
      const reservationData = req.body;
      validateReservation(reservationData);

      await sql`BEGIN`;

      const result = await sql`
        UPDATE reservations 
        SET 
          room_number = ${reservationData.room_number},
          guest_name = ${reservationData.guest_name},
          phone = ${reservationData.phone},
          check_in = ${reservationData.check_in},
          check_out = ${reservationData.check_out},
          check_in_time = ${reservationData.check_in_time},
          check_out_time = ${reservationData.check_out_time},
          booking_source = ${reservationData.booking_source},
          stay_type = ${reservationData.stay_type},
          status = ${reservationData.status},
          memo = ${reservationData.memo || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${reservationData.id}
        RETURNING *
      `;

      // 객실 상태 업데이트
      await sql`
        UPDATE rooms 
        SET status = ${
          reservationData.stay_type === '대실' ? 'hourlyStay' :
          reservationData.stay_type === '숙박' ? 'overnightStay' : 'longStay'
        }
        WHERE number = ${reservationData.room_number}
      `;

      await sql`COMMIT`;
      res.status(200).json(result.rows[0]);
    } catch (error) {
      await sql`ROLLBACK`;
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { ids } = req.body;
      
      await sql`BEGIN`;
      
      // 예약 삭제 전 객실 상태 업데이트
      await sql`
        UPDATE rooms r
        SET status = 'vacant'
        FROM reservations res
        WHERE r.number = res.room_number
        AND res.id = ANY(${ids}::uuid[])
      `;
      
      // 예약 삭제
      const { rowCount } = await sql`
        DELETE FROM reservations
        WHERE id = ANY(${ids}::uuid[])
      `;
      
      await sql`COMMIT`;
      
      if (rowCount === 0) {
        res.status(404).json({ message: '삭제할 예약을 찾을 수 없습니다.' });
      } else {
        res.status(200).json({ message: '예약이 삭제되었습니다.' });
      }
    } catch (error) {
      await sql`ROLLBACK`;
      res.status(500).json({ error: '예약 삭제에 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

function validateReservation(data) {
  const requiredFields = [
    'reservationNumber',
    'roomNumber',
    'guestName',
    'phone',
    'checkIn',
    'checkOut',
    'checkInTime',
    'checkOutTime',
    'bookingSource',
    'stayType'
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} 필드는 필수입니다.`);
    }
  }

  // 날짜 및 시간 유효성 검사
  const checkIn = new Date(`${data.checkIn} ${data.checkInTime}`);
  const checkOut = new Date(`${data.checkOut} ${data.checkOutTime}`);
  
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('유효하지 않은 날짜/시간 형식입니다.');
  }
  if (checkOut <= checkIn) {
    throw new Error('체크아웃 시간은 체크인 시간보다 늦어야 합니다.');
  }

  return data;
}

const formatTimeToAmPm = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);
  const period = hour >= 12 ? '오후' : '오전';
  
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  
  return `${period}:${hour.toString().padStart(2, '0')}:${minutes}`;
};

// PUT 요청에서의 시간 변환 (프론트엔드 -> DB)
const formatTime = (timeStr) => {
  try {
    console.log('Converting time:', timeStr);
    const [period, timeValue] = timeStr.split(':');
    const [hours] = timeValue.split(':');
    let hour = parseInt(hours);

    // 24시간 형식으로 변환
    if (period === '오후' && hour !== 12) {
      hour += 12;
    } else if (period === '오전' && hour === 12) {
      hour = 0;
    }

    const formattedTime = `${hour.toString().padStart(2, '0')}:00:00`;
    console.log('Formatted time result:', formattedTime);
    return formattedTime;
  } catch (error) {
    console.error('Time formatting error:', {
      input: timeStr,
      error: error.message
    });
    throw new Error(`Invalid time format: ${timeStr}`);
  }
};
