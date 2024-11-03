import { sql } from '@vercel/postgres';

/**
 * 객실 관리 API
 * 
 * DB 테이블:
 * - rooms: 객실 기본 정보
 * - room_rates: 객실별 개별 요금 (CASCADE)
 * 
 * 주요 필드:
 * - room_id: 객실 고유 ID (PK)
 * - room_number: 객실 번호 (UNIQUE)
 * - reservation_status: 예약 상태 (DEFAULT: 'vacant')
 */
export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGetRooms(req, res);
    case 'POST':
      return handleCreateRoom(req, res);
    case 'PUT':
      return handleUpdateRoom(req, res);
    case 'DELETE':
      return handleDeleteRoom(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * 객실 목록 조회
 * rooms 테이블과 room_rates 테이블 JOIN하여 조회
 */
async function handleGetRooms(req, res) {
  try {
    const { rows } = await sql`
      SELECT r.*, rr.*
      FROM rooms r
      LEFT JOIN room_rates rr ON r.room_id = rr.room_id
      ORDER BY r.room_number
    `;
    res.status(200).json(rows);
  } catch (error) {
    console.error('객실 조회 실패:', error);
    res.status(500).json({ error: '객실 조회 실패' });
  }
}

/**
 * 객실 생성
 * 1. rooms 테이블에 기본 정보 생성
 * 2. room_rates 테이블에 요금 정보 생성
 */
async function handleCreateRoom(req, res) {
  const {
    room_number,
    room_floor,
    room_building,
    room_name,
    room_type,
    reservation_status,
    room_status,
    show_floor,
    show_building,
    show_name,
    show_type,
    hourly,
    nightly,
    long_term,
    memo,
    // room_rates 테이블 필드
    rate_hourly_weekday,
    rate_hourly_friday,
    rate_hourly_weekend,
    rate_nightly_weekday,
    rate_nightly_friday,
    rate_nightly_weekend
  } = req.body;

  try {
    await sql`BEGIN`;

    // 1. rooms 테이블에 객실 생성
    const roomResult = await sql`
      INSERT INTO rooms (
        room_number,
        room_floor,
        room_building,
        room_name,
        room_type,
        reservation_status,
        room_status,
        show_floor,
        show_building,
        show_name,
        show_type,
        hourly,
        nightly,
        long_term,
        memo
      ) VALUES (
        ${room_number},
        ${room_floor},
        ${room_building},
        ${room_name},
        ${room_type},
        ${reservation_status || 'vacant'},
        ${room_status},
        ${show_floor},
        ${show_building},
        ${show_name},
        ${show_type},
        ${hourly},
        ${nightly},
        ${long_term},
        ${memo}
      )
      RETURNING *
    `;

    // 2. room_rates 테이블에 요금 정보 생성
    await sql`
      INSERT INTO room_rates (
        room_id,
        rate_hourly_weekday,
        rate_hourly_friday,
        rate_hourly_weekend,
        rate_nightly_weekday,
        rate_nightly_friday,
        rate_nightly_weekend
      ) VALUES (
        ${roomResult.rows[0].room_id},
        ${rate_hourly_weekday || 0},
        ${rate_hourly_friday || 0},
        ${rate_hourly_weekend || 0},
        ${rate_nightly_weekday || 0},
        ${rate_nightly_friday || 0},
        ${rate_nightly_weekend || 0}
      )
    `;

    await sql`COMMIT`;
    
    res.status(201).json(roomResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('객실 생성 실패:', error);
    res.status(500).json({ error: '객실 생성 실패' });
  }
}

/**
 * 객실 수정
 * rooms 테이블과 room_rates 테이블 동시 수정
 */
async function handleUpdateRoom(req, res) {
  const { room_id, ...updateData } = req.body;
  const { rates, ...roomData } = updateData;  // 요금 정보 분리

  try {
    await sql`BEGIN`;

    // 1. rooms 테이블 수정
    const roomResult = await sql`
      UPDATE rooms
      SET ${sql(roomData)}, updated_at = CURRENT_TIMESTAMP
      WHERE room_id = ${room_id}
      RETURNING *
    `;

    if (roomResult.rows.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({ error: '객실을 찾을 수 없습니다' });
    }

    // 2. room_rates 테이블 수정 (있는 경우)
    if (rates) {
      await sql`
        UPDATE room_rates
        SET ${sql(rates)}, updated_at = CURRENT_TIMESTAMP
        WHERE room_id = ${room_id}
      `;
    }

    await sql`COMMIT`;
    res.status(200).json(roomResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('객실 수정 실패:', error);
    res.status(500).json({ error: '객실 수정 실패' });
  }
}

/**
 * 객실 삭제
 * room_rates는 CASCADE 설정으로 자동 삭제
 */
async function handleDeleteRoom(req, res) {
  const { room_id } = req.query;

  try {
    const { rowCount } = await sql`
      DELETE FROM rooms
      WHERE room_id = ${room_id}
    `;

    if (rowCount === 0) {
      return res.status(404).json({ error: '객실을 찾을 수 없습니다' });
    }

    res.status(200).json({ message: '객실이 삭제되었습니다' });
  } catch (error) {
    console.error('객실 삭제 실패:', error);
    res.status(500).json({ error: '객실 삭제 실패' });
  }
}

