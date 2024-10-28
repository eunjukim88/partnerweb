import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { number } = req.query;
      const { status } = req.body;

      const result = await sql`
        UPDATE rooms
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP
        WHERE number = ${number}
        RETURNING *
      `;

      if (result.rowCount === 0) {
        return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: '상태 업데이트에 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
