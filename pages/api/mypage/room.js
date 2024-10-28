import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const {
        number,
        floor,
        building,
        name,
        type,
        display,
        salesLimit
      } = req.body;

      console.log('업데이트할 데이터:', {
        number, floor, building, name, type,
        display: JSON.stringify(display),
        salesLimit: JSON.stringify(salesLimit)
      });

      const result = await sql`
        UPDATE rooms 
        SET 
          floor = ${floor || ''},
          building = ${building || ''},
          name = ${name || ''},
          type = ${type || ''},
          display = ${JSON.stringify(display || {})},
          sales_limit = ${JSON.stringify(salesLimit || {})}
        WHERE number = ${number}
        RETURNING *
      `;

      if (result.rowCount === 0) {
        return res.status(404).json({ 
          message: '객실을 찾을 수 없습니다.',
          number: number 
        });
      }

      res.status(200).json({ 
        message: '객실 정보가 성공적으로 업데이트되었습니다.',
        data: result.rows[0]
      });
    } catch (error) {
      console.error('객실 정보 업데이트 중 오류 발생:', error);
      res.status(500).json({ 
        message: '서버 오류가 발생했습니다.',
        error: error.message
      });
    }
  } else if (req.method === 'GET') {
    try {
      const { number } = req.query;
      
      const { rows } = await sql`
        SELECT * FROM rooms 
        WHERE number = ${number}
      `;

      if (rows.length === 0) {
        return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
      }

      // JSON 필드 파싱 및 기본값 설정
      const roomData = {
        ...rows[0],
        display: rows[0].display || {
          floor: false,
          building: false,
          name: false,
          type: false
        },
        salesLimit: rows[0].sales_limit || {
          hourly: false,
          nightly: false,
          longTerm: false
        }
      };

      res.status(200).json(roomData);
    } catch (error) {
      console.error('객실 정보 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
