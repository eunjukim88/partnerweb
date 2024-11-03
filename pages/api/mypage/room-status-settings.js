import { sql } from '@vercel/postgres';

/**
 * 객실 상태 설정 API 핸들러
 * - GET: 모든 상태 설정 조회
 * - PUT: 기존 상태 설정 수정
 * - POST: 새로운 상태 설정 생성
 * 
 * room_status_settings 테이블과 연동
 * rooms 테이블의 room_status와 reservations 테이블의 stay_type 필드에서 참조
 */
export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        await handleGetSettings(req, res);
        break;
      case 'PUT':
        await handleUpdateSettings(req, res);
        break;
      case 'POST':
        await handleCreateSettings(req, res);
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
 * 상태 설정 조회 핸들러
 * @returns {Array} 상태 설정 목록
 * - setting_id: 설정 ID
 * - status_type: 숙박 유형 (hourly/nightly/long_term)
 * - available_days: 예약 가능 요일 (비트마스크)
 * - rate_weekday: 평일 요금
 * - rate_friday: 금요일 요금
 * - rate_weekend: 주말 요금
 * - check_in_time: 체크인 시간
 * - check_out_time: 체크아웃 시간
 */
async function handleGetSettings(req, res) {
  try {
    const { rows } = await sql`
      SELECT * FROM room_status_settings
      ORDER BY setting_id
    `;
    
    if (!rows || rows.length === 0) {
      // 기본 설정 생성
      const defaultSettings = [
        {
          status_type: 'hourly',
          available_days: '1111111',
          rate_weekday: 0,
          rate_friday: 0,
          rate_weekend: 0,
          check_in_time: '15:00',
          check_out_time: '11:00'
        },
        {
          status_type: 'nightly',
          available_days: '1111111',
          rate_weekday: 0,
          rate_friday: 0,
          rate_weekend: 0,
          check_in_time: '15:00',
          check_out_time: '11:00'
        },
        {
          status_type: 'long_term',
          available_days: '1111111',
          rate_weekday: 0,
          rate_friday: 0,
          rate_weekend: 0,
          check_in_time: '15:00',
          check_out_time: '11:00'
        }
      ];

      const results = await Promise.all(
        defaultSettings.map(setting => handleCreateSettings({ body: setting }, { status: () => ({ json: () => {} }) }))
      );
      
      return res.status(200).json(results);
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('설정 조회 실패:', error);
    res.status(500).json({ error: '설정 조회 실패' });
  }
}

/**
 * 상태 설정 수정 핸들러
 */
async function handleUpdateSettings(req, res) {
  try {
    const {
      setting_id,
      status_type,
      available_days,
      rate_weekday,
      rate_friday,
      rate_weekend,
      check_in_time,
      check_out_time
    } = req.body;

    const { rows } = await sql`
      UPDATE room_status_settings
      SET 
        status_type = ${status_type},
        available_days = ${available_days}::bit(7),
        rate_weekday = ${rate_weekday},
        rate_friday = ${rate_friday},
        rate_weekend = ${rate_weekend},
        check_in_time = ${check_in_time}::time,
        check_out_time = ${check_out_time}::time,
        updated_at = CURRENT_TIMESTAMP
      WHERE setting_id = ${setting_id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: '설정을 찾을 수 없습니다' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('설정 수정 실패:', error);
    res.status(500).json({ error: '설정 수정 실패' });
  }
}

/**
 * 상태 설정 생성 핸들러
 */
async function handleCreateSettings(req, res) {
  try {
    const {
      status_type,
      available_days,
      rate_weekday,
      rate_friday,
      rate_weekend,
      check_in_time,
      check_out_time
    } = req.body;

    // status_type 유효성 검사
    if (!['hourly', 'nightly', 'long_term'].includes(status_type)) {
      return res.status(400).json({ error: '잘못된 상태 유형입니다' });
    }

    const { rows } = await sql`
      INSERT INTO room_status_settings (
        status_type,
        available_days,
        rate_weekday,
        rate_friday,
        rate_weekend,
        check_in_time,
        check_out_time
      ) VALUES (
        ${status_type},
        ${available_days}::bit(7),
        ${rate_weekday},
        ${rate_friday},
        ${rate_weekend},
        ${check_in_time}::time,
        ${check_out_time}::time
      )
      RETURNING *
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('설정 생성 실패:', error);
    res.status(500).json({ error: '설정 생성 실패' });
  }
}