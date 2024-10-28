import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { number } = req.query;
      
      const { rows } = await sql`
        SELECT * FROM rooms 
        WHERE number = ${number}
      `;
      
      if (rows.length === 0) {
        return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
      }
      
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('객실 정보 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { number } = req.query;
      const { floor, building, name, type } = req.body;
      
      const { rows } = await sql`
        UPDATE rooms 
        SET 
          floor = ${floor},
          building = ${building},
          name = ${name},
          type = ${type}
        WHERE number = ${number}
        RETURNING *
      `;
      
      if (rows.length === 0) {
        return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
      }
      
      res.status(200).json({ message: '객실 정보가 성공적으로 업데이트되었습니다.' });
    } catch (error) {
      console.error('객실 정보 업데이트 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}