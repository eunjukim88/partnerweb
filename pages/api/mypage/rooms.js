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
    // 데이터 유효성 검증
    if (!room_id || typeof room_id !== 'number') {
      return res.status(400).json({ error: '유효하지 않은 room_id입니다.' });
    }

    await sql`BEGIN`;

    // rooms 테이블 업데이트 전 존재 여부 확인
    const roomExists = await sql`
      SELECT room_id FROM rooms WHERE room_id = ${room_id}
    `;

    if (roomExists.rows.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({ error: '객실을 찾을 수 없습니다' });
    }

    // 1. rooms 테이블 수정
    const roomResult = await sql`
      UPDATE rooms
      SET
        ${sql(roomData)},
        updated_at = CURRENT_TIMESTAMP
      WHERE
        room_id = ${room_id}
      RETURNING *
    `;

    if (roomResult.rows.length === 0) {
      await sql`ROLLBACK`;
      return res.status(404).json({ error: '객실을 찾을 수 없습니다' });
    }

    // 2. room_rates 테이블 수정 또는 추가 (있는 경우)
    if (rates) {
      const ratesFields = ['rate_hourly_weekday', 'rate_hourly_friday', 'rate_hourly_weekend',
                          'rate_nightly_weekday', 'rate_nightly_friday', 'rate_nightly_weekend'];
      
      if (!ratesFields.every(field => typeof rates[field] === 'number' && rates[field] >= 0)) {
        await sql`ROLLBACK`;
        return res.status(400).json({ error: '유효하지 않은 요금 데이터입니다.' });
      }

      await sql`
        INSERT INTO room_rates (room_id, rate_hourly_weekday, rate_hourly_friday, rate_hourly_weekend, rate_nightly_weekday, rate_nightly_friday, rate_nightly_weekend)
        VALUES (
          ${room_id},
          ${rates.rate_hourly_weekday || 0},
          ${rates.rate_hourly_friday || 0},
          ${rates.rate_hourly_weekend || 0},
          ${rates.rate_nightly_weekday || 0},
          ${rates.rate_nightly_friday || 0},
          ${rates.rate_nightly_weekend || 0}
        )
        ON CONFLICT (room_id)
        DO UPDATE SET
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
    res.status(200).json(roomResult.rows[0]);
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('객실 수정 실패:', error);
    res.status(500).json({ error: '객실 수정 실패' });
  }
}
