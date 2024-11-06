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
      SELECT r.*, rr.*
      FROM rooms r
      LEFT JOIN room_rates rr ON r.room_id = rr.room_id
      ORDER BY r.room_number
    `;
    console.log('API response data:', result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('객실 조회 실패:', error);
    res.status(500).json({ error: '객실 조회 실패' });
  }
}

/**
 * 객실 수정
 * rooms 테이블과 room_rates 테이블 동시 수정
 */
async function handleUpdateRoom(req, res) {
  const { room_id, rates, ...roomData } = req.body;
  
  try {
    await sql`BEGIN`;
    
    // 1. rooms 테이블 업데이트
    await sql`
      UPDATE rooms
      SET
        room_floor = ${roomData.room_floor},
        room_building = ${roomData.room_building},
        room_name = ${roomData.room_name},
        room_type = ${roomData.room_type},
        stay_type = ${roomData.stay_type},
        show_floor = ${roomData.show_floor},
        show_building = ${roomData.show_building},
        show_name = ${roomData.show_name},
        show_type = ${roomData.show_type},
        hourly = ${roomData.hourly},
        nightly = ${roomData.nightly},
        long_term = ${roomData.long_term},
        memo = ${roomData.memo},
        updated_at = CURRENT_TIMESTAMP
      WHERE room_id = ${room_id}
      RETURNING *
    `;

    // 2. room_rates 테이블 업데이트
    if (rates) {
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
          ${room_id},
          ${rates.rate_hourly_weekday},
          ${rates.rate_hourly_friday},
          ${rates.rate_hourly_weekend},
          ${rates.rate_nightly_weekday},
          ${rates.rate_nightly_friday},
          ${rates.rate_nightly_weekend}
        )
        ON CONFLICT (room_id) DO UPDATE SET
          rate_hourly_weekday = EXCLUDED.rate_hourly_weekday,
          rate_hourly_friday = EXCLUDED.rate_hourly_friday,
          rate_hourly_weekend = EXCLUDED.rate_hourly_weekend,
          rate_nightly_weekday = EXCLUDED.rate_nightly_weekday,
          rate_nightly_friday = EXCLUDED.rate_nightly_friday,
          rate_nightly_weekend = EXCLUDED.rate_nightly_weekend,
          updated_at = CURRENT_TIMESTAMP
      `;
    }

    await sql`COMMIT`;

    // 업데이트된 전체 데이터 조회
    const finalResult = await sql`
      SELECT r.*, rr.*
      FROM rooms r
      LEFT JOIN room_rates rr ON r.room_id = rr.room_id
      WHERE r.room_id = ${room_id}
    `;

    res.status(200).json(finalResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('객실 수정 실패:', error);
    res.status(500).json({ error: error.message || '객실 수정 실패' });
  }
}
