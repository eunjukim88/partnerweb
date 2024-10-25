import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        floor INTEGER NOT NULL,
        building VARCHAR(10) NOT NULL,
        number VARCHAR(10) NOT NULL,
        name VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL
      )
    `;
    res.status(200).json({ message: 'Rooms 테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}