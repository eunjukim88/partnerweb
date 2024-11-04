import { sql } from '@vercel/postgres';

/**
 * 예약 설정 API 핸들러
 * - GET: 설정 조회
 * - PUT: 설정 수정
 * - POST: 설정 생성
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
 * 예약 설정 조회 핸들러
 */
async function handleGetSettings(req, res) {
  try {
    const { rows } = await sql`
      SELECT * FROM reservation_settings
      ORDER BY stay_type
    `;
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: '설정이 존재하지 않습니다.' });
    }

    res.status(200).json(rows);
  } catch (error) {
    console.error('예약 설정 조회 실패:', error);
    res.status(500).json({ error: '예약 설정 조회에 실패했습니다.' });
  }
}

/**
 * 예약 설정 수정 핸들러
 */
async function handleUpdateSettings(req, res) {
  try {
    const { 
      stay_type,
      available_days,
      check_in_time,
      check_out_time,
      weekday_rate,
      friday_rate,
      weekend_rate
    } = req.body;

    // 1. 필수 필드 확인
    if (!stay_type || !available_days || !check_in_time || !check_out_time) {
      return res.status(400).json({
        message: '필수 필드가 누락되었습니다.',
        required: ['stay_type', 'available_days', 'check_in_time', 'check_out_time']
      });
    }

    try {
      // 2. 데이터 유효성 검사
      validateStayType(stay_type);
      validateAvailableDays(available_days);
      validateTime(check_in_time, '체크인 시간');
      validateTime(check_out_time, '체크아웃 시간');

      // 3. 요금 유효성 검사 (available_days에 따른 조건부 검사)
      const days = available_days.split('');
      
      if (days.slice(0, 4).includes('1')) {
        validateRate(weekday_rate, '평일 요금');
      }
      
      if (days[4] === '1') {
        validateRate(friday_rate, '금요일 요금');
      }
      
      if (days.slice(5, 7).includes('1')) {
        validateRate(weekend_rate, '주말 요금');
      }
    } catch (validationError) {
      return res.status(400).json({
        message: '입력값이 올바르지 않습니다.',
        error: validationError.message
      });
    }

    // 4. 데이터베이스 업데이트
    const query = `
      UPDATE reservation_settings 
      SET 
        available_days = B'${available_days}',
        check_in_time = $1,
        check_out_time = $2,
        weekday_rate = $3,
        friday_rate = $4,
        weekend_rate = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE stay_type = $6
      RETURNING *
    `;

    const values = [
      check_in_time,
      check_out_time,
      weekday_rate || 0,
      friday_rate || 0,
      weekend_rate || 0,
      stay_type
    ];

    const result = await sql.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        message: '해당하는 설정을 찾을 수 없습니다.',
        stay_type
      });
    }

    // 5. 응답 데이터 가공
    const response = {
      ...result.rows[0],
      available_days: result.rows[0].available_days.toString()
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('설정 업데이트 오류:', error);
    res.status(500).json({
      message: '서버 오류가 발생했습니다.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * 예약 설정 생성 핸들러
 */
async function handleCreateSettings(req, res) {
  const { stay_type, ...data } = req.body;

  try {
    const { rows } = await sql`
      INSERT INTO reservation_settings (
        stay_type,
        default_duration,
        check_in_time,
        check_out_time,
        weekday_rate,
        friday_rate,
        weekend_rate
      ) VALUES (
        ${stay_type},
        ${data.default_duration},
        ${data.check_in_time}::time,
        ${data.check_out_time}::time,
        ${data.weekday_rate},
        ${data.friday_rate},
        ${data.weekend_rate}
      )
      RETURNING *
    `;

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('설정 생성 실패:', error);
    res.status(500).json({ error: '설정 생성에 실패했습니다.' });
  }
}

// 데이터 유효성 검사 함수들
const validateStayType = (stayType) => {
  const validTypes = ['hourly', 'nightly', 'long_term'];
  if (!validTypes.includes(stayType)) {
    throw new Error('유효하지 않은 숙박 유형입니다.');
  }
};

const validateAvailableDays = (days) => {
  if (typeof days !== 'string' || !/^[01]{7}$/.test(days)) {
    throw new Error('예약 가능 요일 형식이 올바르지 않습니다. (7자리 이진수 형태로 입력해주세요)');
  }
};

const validateTime = (time, fieldName) => {
  const timePattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(time)) {
    throw new Error(`${fieldName} 형식이 올바르지 않습니다. (HH:mm)`);
  }
};

const validateRate = (rate, fieldName) => {
  if (typeof rate !== 'number' || rate < 0 || !Number.isInteger(rate)) {
    throw new Error(`${fieldName}는 0 이상의 정수여야 합니다.`);
  }
};

export const config = {
  api: {
    bodyParser: true,
  },
};
