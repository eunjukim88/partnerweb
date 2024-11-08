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
    case 'PUT':
      return handleUpdateRoom(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

/**
 * 객실 목록 조회
 * rooms 테이블과 room_rates 테이블 JOIN하여 조회
 */
async function handleGetRooms(req, res) {
  try {
    const result = await sql`
      SELECT DISTINCT ON (r.room_id)
        r.*,
        rr.rate_hourly_weekday,
        rr.rate_hourly_friday,
        rr.rate_hourly_weekend,
        rr.rate_nightly_weekday,
        rr.rate_nightly_friday,
        rr.rate_nightly_weekend
      FROM rooms r
      LEFT JOIN room_rates rr ON r.room_id = rr.room_id
      ORDER BY r.room_id, r.updated_at DESC
    `;
    
    if (!result || !result.rows) {
      throw new Error('데이터 조회 실패');
    }

    // room_number 기준으로 정렬
    const sortedRooms = result.rows.sort((a, b) => {
      return parseInt(a.room_number) - parseInt(b.room_number);
    });

    res.status(200).json(sortedRooms);
  } catch (error) {
    console.error('객실 조회 실패:', error);
    res.status(500).json({ 
      error: '객실 조회 실패', 
      details: error.message 
    });
  }
}

/**
 * 객실 수정
 * rooms 테이블과 room_rates 테이블 동시 수정
 */
async function handleUpdateRoom(req, res) {
  const { room_id, roomData } = req.body;
  
  try {
    await sql`BEGIN`;
    
    // 현재 데이터 조회
    const currentData = await sql`
      SELECT * FROM rooms WHERE room_id = ${room_id}
    `;

    if (currentData.rows.length === 0) {
      await sql`ROLLBACK`;
      throw new Error('객실을 찾을 수 없습니다.');
    }

    // 업데이트 쿼리 실행
    const result = await sql`
      UPDATE rooms
      SET
        room_floor = COALESCE(${roomData.room_floor}, room_floor),
        room_building = COALESCE(${roomData.room_building}, room_building),
        room_name = ${roomData.room_name},
        room_type = ${roomData.room_type},
        room_status = ${roomData.room_status},
        show_floor = COALESCE(${roomData.show_floor}, show_floor),
        show_building = COALESCE(${roomData.show_building}, show_building),
        show_name = COALESCE(${roomData.show_name}, show_name),
        show_type = COALESCE(${roomData.show_type}, show_type),
        memo = COALESCE(${roomData.memo}, ''),
        updated_at = CURRENT_TIMESTAMP
      WHERE room_id = ${room_id}
      RETURNING *
    `;

    // 전체 데이터 조회
    const fullResult = await sql`
      SELECT DISTINCT ON (r.room_id)
        r.*,
        rr.rate_hourly_weekday,
        rr.rate_hourly_friday,
        rr.rate_hourly_weekend,
        rr.rate_nightly_weekday,
        rr.rate_nightly_friday,
        rr.rate_nightly_weekend
      FROM rooms r
      LEFT JOIN room_rates rr ON r.room_id = rr.room_id
      WHERE r.room_id = ${room_id}
      ORDER BY r.room_id, r.updated_at DESC
    `;

    if (!fullResult.rows || fullResult.rows.length === 0) {
      await sql`ROLLBACK`;
      throw new Error('업데이트된 객실 데이터를 찾을 수 없습니다.');
    }

    await sql`COMMIT`;
    res.status(200).json(fullResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('객실 수정 실패:', error);
    res.status(500).json({ 
      error: '객실 수정 실패',
      details: error.message 
    });
  }
}
