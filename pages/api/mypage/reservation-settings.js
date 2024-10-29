import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT 
          rs.*,
          to_char(check_in_time, 'HH24:MI:SS') as check_in_time,
          to_char(check_out_time, 'HH24:MI:SS') as check_out_time
        FROM reservation_settings rs
        ORDER BY stay_type
      `;
      
      const formattedResult = result.rows.map(row => ({
        ...row,
        available_days: row.available_days || [],
        base_rate: row.base_rate || {
          weekday: 0,
          friday: 0,
          weekend: 0
        }
      }));
      
      res.status(200).json(formattedResult);
    } catch (error) {
      console.error('GET request error:', error);
      res.status(500).json({ message: '설정을 불러오는데 실패했습니다.' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { stayType, settings } = req.body;

      if (!stayType || !settings) {
        return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
      }

      const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
      const availableDays = settings.selectedDays.map(day => dayMap[day]);

      await sql`
        INSERT INTO reservation_settings (
          stay_type,
          available_days,
          check_in_time,
          check_out_time,
          base_rate
        ) VALUES (
          ${stayType},
          ${availableDays}::integer[],
          ${formatTime(settings.checkInTime)}::time,
          ${formatTime(settings.checkOutTime)}::time,
          ${JSON.stringify(settings.base_rate)}::jsonb
        )
        ON CONFLICT (stay_type) 
        DO UPDATE SET
          available_days = ${availableDays}::integer[],
          check_in_time = ${formatTime(settings.checkInTime)}::time,
          check_out_time = ${formatTime(settings.checkOutTime)}::time,
          base_rate = ${JSON.stringify(settings.base_rate)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
      `;

      res.status(200).json({ message: '설정이 저장되었습니다.' });
    } catch (error) {
      console.error('PUT request error:', error);
      res.status(500).json({ message: '설정 저장에 실패했습니다.' });
    }
  } else {
    res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }
}

// API 라우트가 종료될 때 Prisma 연결 해제
export const config = {
  api: {
    bodyParser: true,
  },
};
