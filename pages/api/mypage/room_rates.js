import { sql } from '@vercel/postgres';

/**
 * 객실 요금 API 핸들러
 * - GET: 모든 요금 설정 조회
 * - PUT: 기존 요금 설정 수정
 * - POST: 새로운 요금 설정 생성
 * 
 * room_rates 테이블과 연동
 */
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetRoomRates(req, res);
        break;
      case 'PUT':
        await handleUpdateRoomRates(req, res);
        break;
      case 'POST':
        await handleCreateRoomRates(req, res);
        break;
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}

/**
 * 객실 요금 조회 핸들러
 * @returns {Array} 요금 설정 목록
 * - room_id: 객실 ID
 * - rate_hourly_weekday: 평일 시간제 요금
 * - rate_hourly_friday: 금요일 시간제 요금
 * - rate_hourly_weekend: 주말 시간제 요금
 * - rate_nightly_weekday: 평일 숙박 요금
 * - rate_nightly_friday: 금요일 숙박 요금
 * - rate_nightly_weekend: 주말 숙박 요금
 */
async function handleGetRoomRates(req, res) {
  try {
    const { rows } = await sql`
      SELECT * FROM room_rates
      ORDER BY room_id
    `;
    res.status(200).json(rows);
  } catch (error) {
    console.error('요금 조회 실패:', error);
    res.status(500).json({ error: '요금 조회 실패' });
  }
}

/**
 * 객실 요금 수정 핸들러
 */
async function handleUpdateRoomRates(req, res) {
  try {
    const {
      room_id,
      rate_hourly_weekday,
      rate_hourly_friday,
      rate_hourly_weekend,
      rate_nightly_weekday,
      rate_nightly_friday,
      rate_nightly_weekend
    } = req.body;

    // 데이터 유효성 검증 추가
    if (!room_id || typeof room_id !== 'number') {
      return res.status(400).json({ error: '유효하지 않은 room_id입니다.' });
    }

    // 요금 데이터 유효성 검증
    const rates = [rate_hourly_weekday, rate_hourly_friday, rate_hourly_weekend,
                  rate_nightly_weekday, rate_nightly_friday, rate_nightly_weekend];
    
    if (rates.some(rate => rate < 0 || isNaN(rate))) {
      return res.status(400).json({ error: '유효하지 않은 요금 데이터입니다.' });
    }

    const { rows } = await sql`
      UPDATE room_rates
      SET
        rate_hourly_weekday = ${rate_hourly_weekday},
        rate_hourly_friday = ${rate_hourly_friday},
        rate_hourly_weekend = ${rate_hourly_weekend},
        rate_nightly_weekday = ${rate_nightly_weekday},
        rate_nightly_friday = ${rate_nightly_friday},
        rate_nightly_weekend = ${rate_nightly_weekend},
        updated_at = CURRENT_TIMESTAMP
      WHERE room_id = ${room_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: '요금 설정을 찾을 수 없습니다' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('요금 수정 실패:', error);
    res.status(500).json({ error: '요금 수정 실패' });
  }
}

/**
 * 객실 요금 생성 핸들러
 */
async function handleCreateRoomRates(req, res) {
  try {
    const {
      room_id,
      rate_hourly_weekday,
      rate_hourly_friday,
      rate_hourly_weekend,
      rate_nightly_weekday,
      rate_nightly_friday,
      rate_nightly_weekend
    } = req.body;

    const { rows } = await sql`
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
        ${rate_hourly_weekday || 0},
        ${rate_hourly_friday || 0},
        ${rate_hourly_weekend || 0},
        ${rate_nightly_weekday || 0},
        ${rate_nightly_friday || 0},
        ${rate_nightly_weekend || 0}
      )
      RETURNING *
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('요금 생성 실패:', error);
    res.status(500).json({ error: '요금 생성 실패' });
  }
}
