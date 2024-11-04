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
        SELECT * FROM reservations 
        WHERE reservation_id = ${reservation_id}
      `;
    } else {
      query = sql`
        SELECT * FROM reservations 
        ORDER BY check_in DESC
      `;
    }

    const { rows } = await query;
    res.status(200).json(rows);
  } catch (error) {
    console.error('예약 조회 실패:', error);
    res.status(500).json({ error: '예약 조회 실패' });
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
 * - price: 요금
 * - memo: 메모
 */
async function handleCreateReservation(req, res) {
  try {
    const {
      reservation_number,
      room_id,
      guest_name,
      phone,
      check_in,
      check_out,
      check_in_time,
      check_out_time,
      stay_type,
      booking_source,
      price,
      memo
    } = req.body;

    const { rows } = await sql`
      INSERT INTO reservations (
        reservation_number,
        room_id,
        guest_name,
        phone,
        check_in,
        check_out,
        check_in_time,
        check_out_time,
        stay_type,
        booking_source,
        price,
        memo
      ) VALUES (
        ${reservation_number},
        ${room_id},
        ${guest_name},
        ${phone},
        ${check_in}::date,
        ${check_out}::date,
        ${check_in_time}::time,
        ${check_out_time}::time,
        ${stay_type},
        ${booking_source},
        ${price},
        ${memo}
      )
      RETURNING *
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('예약 생성 실패:', error);
    res.status(500).json({ error: '예약 생성 실패' });
  }
}

/**
 * 예약 수정
 */
async function handleUpdateReservation(req, res) {
  try {
    const { reservation_id, ...updateData } = req.body;

    const { rows } = await sql`
      UPDATE reservations
      SET ${sql(updateData)}, updated_at = CURRENT_TIMESTAMP
      WHERE reservation_id = ${reservation_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('예약 수정 실패:', error);
    res.status(500).json({ error: '예약 수정 실패' });
  }
}

/**
 * 예약 삭제
 */
async function handleDeleteReservation(req, res) {
  try {
    const { reservation_id } = req.query;

    const { rowCount } = await sql`
      DELETE FROM reservations
      WHERE reservation_id = ${reservation_id}
    `;

    if (rowCount === 0) {
      return res.status(404).json({ error: '예약을 찾을 수 없습니다' });
    }

    res.status(200).json({ message: '예약이 삭제되었습니다' });
  } catch (error) {
    console.error('예약 삭제 실패:', error);
    res.status(500).json({ error: '예약 삭제 실패' });
  }
} 