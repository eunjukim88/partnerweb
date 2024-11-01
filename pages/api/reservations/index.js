import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT 
          id,
          reservation_number,
          room_number,
          guest_name,
          phone,
          check_in,
          check_out,
          TO_CHAR(check_in_time, 'HH24:MI:SS') as check_in_time,
          TO_CHAR(check_out_time, 'HH24:MI:SS') as check_out_time,
          booking_source,
          stay_type,
          status,
          memo,
          price,
          created_at,
          updated_at
        FROM reservations 
        WHERE status != 'cancelled'
        ORDER BY created_at DESC
      `;

      const formattedReservations = rows.map(reservation => ({
        ...reservation,
        check_in: reservation.check_in,
        check_out: reservation.check_out,
        price: Number(reservation.price)
      }));

      res.status(200).json(formattedReservations);
    } catch (error) {
      console.error('예약 조회 실패:', error);
      res.status(500).json({ error: '예약 목록을 불러오는데 실패했습니다.' });
    }
  } else if (req.method === 'POST') {
    try {
      const reservationData = req.body;
      console.log('Attempting to save reservation:', reservationData);

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
          price
        ) VALUES (
          ${reservationData.reservationNumber},
          ${reservationData.roomNumber},
          ${reservationData.guestName},
          ${reservationData.phone},
          ${reservationData.checkIn}::date,
          ${reservationData.checkOut}::date,
          ${reservationData.checkInTime}::time,
          ${reservationData.checkOutTime}::time,
          ${reservationData.bookingSource},
          ${reservationData.stayType},
          'confirmed',
          ${reservationData.memo || ''},
          ${reservationData.price}
        )
        RETURNING *;
      `;

      console.log('Created reservation:', result.rows[0]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('예약 저장 중 오류 발생:', error);
      res.status(500).json({ 
        error: '예약 저장에 실패했습니다.',
        details: error.message 
      });
    }
  } else if (req.method === 'PUT') {
    try {
      const { id } = req.query;
      if (!id) {
        throw new Error('수정 예약 ID가 필요합다.');
      }

      const result = await handleReservation(req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error('예약 수정 실패:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      const { id } = req.query;
      if (!id) {
        throw new Error('삭제할 예약 ID가 필요합니다.');
      }

      await sql`
        DELETE FROM reservations 
        WHERE id = ${id}
        RETURNING *
      `;

      res.status(200).json({ message: '예약이 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('예약 삭제 실패:', error);
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 날짜 및 시간 포맷팅 함수들
const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
};

const formatTimeForDisplay = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.substring(0, 8); // "HH:MM:SS" 형식으로 반환
};

// 예약 처리 함수
const handleReservation = async (reservationData) => {
  try {
    // 예약 설정 가져오기
    const stayTypeMap = {
      '대실': 'hourly',
      '숙박': 'nightly',
      '장기': 'longTerm'
    };

    const settingsResult = await sql`
      SELECT * FROM reservation_settings 
      WHERE stay_type = ${stayTypeMap[reservationData.stay_type]}
    `;

    if (settingsResult.rows.length === 0) {
      throw new Error(`${reservationData.stay_type} 유형의 예약 설정을 찾을 수 없습니다.`);
    }

    const settings = settingsResult.rows[0];
    const baseRate = typeof settings.base_rate === 'string' 
      ? JSON.parse(settings.base_rate) 
      : settings.base_rate;

    // 체크인 날짜 기준으로 가격 계산
    const checkInDate = new Date(reservationData.check_in);
    const dayOfWeek = checkInDate.getDay();
    
    let calculatedPrice = 0;
    if (dayOfWeek === 5) { // 금요일
      calculatedPrice = baseRate.friday || 0;
    } else if (dayOfWeek === 0 || dayOfWeek === 6) { // 일요일(0) 또는 토요일(6)
      calculatedPrice = baseRate.weekend || 0;
    } else { // 평일
      calculatedPrice = baseRate.weekday || 0;
    }

    // 대실인 경우 설정된 시간 사용
    const check_in_time = reservationData.stay_type === '대실' ? 
      settings.check_in_time : reservationData.check_in_time;
    const check_out_time = reservationData.stay_type === '대실' ? 
      settings.check_out_time : reservationData.check_out_time;

    const result = await sql`
      UPDATE reservations
      SET
        room_number = ${reservationData.room_number},
        guest_name = ${reservationData.guest_name},
        phone = ${reservationData.phone},
        check_in = ${reservationData.check_in.split('T')[0]},
        check_out = ${reservationData.check_out.split('T')[0]},
        check_in_time = ${check_in_time},
        check_out_time = ${check_out_time},
        booking_source = ${reservationData.booking_source},
        stay_type = ${reservationData.stay_type},
        status = ${reservationData.status || 'confirmed'},
        memo = ${reservationData.memo || ''},
        price = ${calculatedPrice},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${reservationData.id}
      RETURNING *
    `;

    // 결과를 표시 형식으로 변환
    const formattedResult = {
      ...result.rows[0],
      check_in: formatDateForDisplay(result.rows[0].check_in),
      check_out: formatDateForDisplay(result.rows[0].check_out),
      check_in_time: formatTimeForDisplay(result.rows[0].check_in_time),
      check_out_time: formatTimeForDisplay(result.rows[0].check_out_time),
      price: Number(result.rows[0].price)
    };

    return formattedResult;
  } catch (error) {
    console.error('Reservation update error:', error);
    throw error;
  }
};
