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
  const { id, ...updateData } = req.body;

  try {
    const { rows } = await sql`
      UPDATE reservation_settings
      SET ${sql(updateData)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: '설정을 찾을 수 없습니다' });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('설정 수정 실패:', error);
    res.status(500).json({ error: '설정 수정에 실패했습니다.' });
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

export const config = {
  api: {
    bodyParser: true,
  },
};
