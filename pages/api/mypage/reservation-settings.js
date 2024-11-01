import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT 
          id,
          stay_type,
          base_rate,
          check_in_time,
          check_out_time
        FROM reservation_settings
        ORDER BY id ASC
      `;

      // base_rate가 문자열로 저장되어 있다면 JSON으로 파싱
      const formattedSettings = rows.map(setting => ({
        ...setting,
        base_rate: typeof setting.base_rate === 'string' 
          ? JSON.parse(setting.base_rate) 
          : setting.base_rate
      }));

      res.status(200).json(formattedSettings);
    } catch (error) {
      console.error('예약 설정 조회 실패:', error);
      res.status(500).json({ error: '예약 설정을 불러오는데 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// API 라우트가 종료될 때 Prisma 연결 해제
export const config = {
  api: {
    bodyParser: true,
  },
};
