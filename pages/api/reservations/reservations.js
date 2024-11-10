import { sql } from '@vercel/postgres';

/**
 * 예약 CRUD API
 * 단순 데이터베이스 작업만 수행
 * 비즈니스 로직은 프론트엔드 reservationStore에서 처리
 */
export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGetReservations(req, res);
    case 'POST':
      return handleCreateReservation(req, res);
    case 'PUT':
      return handleUpdateReservation(req, res);
    case 'DELETE':
      return handleDeleteReservation(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * 예약 조회
 * - 단일 예약 조회: reservation_id로 조회
 * - 전체 예약 조회: 조건 없이 전체 조회
 */
async function handleGetReservations(req, res) {
  try {
    const { reservation_id } = req.query;
    
    let query;
    if (reservation_id) {
      query = sql`
        SELECT 
          r.*,
          rm.room_number,
          rm.room_floor,
          rm.room_building,
          rm.room_type
        FROM reservations r
        LEFT JOIN rooms rm ON r.room_id = rm.room_id
        WHERE r.reservation_id = ${reservation_id}
      `;
    } else {
      query = sql`
        SELECT 
          r.*,
          rm.room_number,
          rm.room_floor,
          rm.room_building,
          rm.room_type
        FROM reservations r
        LEFT JOIN rooms rm ON r.room_id = rm.room_id
        ORDER BY r.check_in_date DESC
      `;
    }

    const { rows } = await query;
    res.status(200).json(rows);
  } catch (error) {
    console.error('예약 조회 실패:', error);
    res.status(500).json({ 
      error: '예약 조회 실패',
      details: error.message 
    });
  }
}

/**
 * 예약 생성
 * @param {Object} req.body
 * - reservation_number: 예약 번호 (필수, 유니크)
 * - room_id: 객실 ID (필수)
 * - guest_name: 투숙객 이름 (필수)
 * - phone: 연락처 (필수)
 * - check_in: 체크인 날짜 YYYY-MM-DD (필수)
 * - check_out: 체크아웃 날짜 YYYY-MM-DD (필수)
 * - check_in_time: 체크인 시간 HH:MM (필수)
 * - check_out_time: 체크아웃 시간 HH:MM (필수)
 * - stay_type: 숙박 유형 (hourly/nightly/long_term) (필수)
 * - booking_source: 예약 경로
 * - rate_amount: 요금
 * - memo: 메모
 */
async function handleCreateReservation(req, res) {
  try {
    console.log('받은 예약 데이터:', req.body);

    const {
      reservation_number,
      room_id,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      stay_type,
      booking_source,
      rate_amount,
      memo,
      phone,
      guest_name
    } = req.body;

    // 필수 필드 검증
    const requiredFields = ['reservation_number', 'room_id', 'check_in_date', 
      'check_out_date', 'check_in_time', 'check_out_time', 'stay_type', 
      'booking_source', 'rate_amount', 'phone', 'guest_name'];
    
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      console.error('필수 필드 누락:', missingFields);
      return res.status(400).json({ 
        error: `필수 필드 누락: ${missingFields.join(', ')}` 
      });
    }

    // SQL 쿼리 실행 전 데이터 로깅
    console.log('DB 저장 데이터:', {
      reservation_number,
      room_id,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      stay_type,
      booking_source,
      rate_amount,
      memo,
      phone,
      guest_name
    });

    const { rows } = await sql`
      INSERT INTO reservations (
        reservation_number,
        room_id,
        check_in_date,
        check_out_date,
        check_in_time,
        check_out_time,
        stay_type,
        booking_source,
        rate_amount,
        memo,
        phone,
        guest_name
      ) VALUES (
        ${reservation_number},
        ${room_id},
        ${check_in_date}::date,
        ${check_out_date}::date,
        ${check_in_time}::time,
        ${check_out_time}::time,
        ${stay_type},
        ${booking_source},
        ${rate_amount},
        ${memo || ''},
        ${phone},
        ${guest_name}
      )
      RETURNING *
    `;

    console.log('DB 저장 결과:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('예약 생성 실패 상세:', error);
    res.status(500).json({ 
      error: '예약 생성 실패', 
      details: error.message 
    });
  }
}

/**
 * 예약 수정
 */
async function handleUpdateReservation(req, res) {
  try {
    const {
      reservation_id,
      reservation_number,
      room_id,
      check_in_date,
      check_out_date,
      check_in_time,
      check_out_time,
      stay_type,
      booking_source,
      rate_amount,
      memo,
      phone,
      guest_name
    } = req.body;

    // 필수 필드 검증
    const requiredFields = ['reservation_number', 'room_id', 'check_in_date', 
      'check_out_date', 'check_in_time', 'check_out_time', 'stay_type', 
      'booking_source', 'rate_amount', 'phone', 'guest_name'];
    
    const missingFields = requiredFields.filter(field => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({ 
        error: `필수 필드 누락: ${missingFields.join(', ')}` 
      });
    }

    const { rows } = await sql`
      UPDATE reservations
      SET
        reservation_number = ${reservation_number},
        room_id = ${room_id},
        check_in_date = ${check_in_date}::date,
        check_out_date = ${check_out_date}::date,
        check_in_time = ${check_in_time}::time,
        check_out_time = ${check_out_time}::time,
        stay_type = ${stay_type},
        booking_source = ${booking_source},
        rate_amount = ${rate_amount},
        memo = ${memo || ''},
        phone = ${phone},
        guest_name = ${guest_name},
        updated_at = CURRENT_TIMESTAMP
      WHERE reservation_id = ${reservation_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('예약 수정 실패:', error);
    res.status(500).json({ 
      error: '예약 수정 실패',
      details: error.message 
    });
  }
}

/**
 * 예약 삭제
 */
async function handleDeleteReservation(req, res) {
  try {
    const { reservation_id } = req.query;

    if (!reservation_id) {
      return res.status(400).json({ error: 'reservation_id가 필요합니다.' });
    }

    console.log('삭제할 예약 ID:', reservation_id);

    const { rowCount } = await sql`
      DELETE FROM reservations
      WHERE reservation_id = ${reservation_id}
    `;

    if (rowCount === 0) {
      return res.status(404).json({ message: '예약을 찾을 수 없습니다' });
    }

    res.status(200).json({ message: '예약이 삭제되었습니다' });
  } catch (error) {
    console.error('예약 삭제 실패:', error);
    res.status(500).json({ 
      error: '예약 삭제 실패',
      message: error.message 
    });
  }
} 