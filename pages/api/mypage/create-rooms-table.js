import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) NOT NULL UNIQUE,
        floor INTEGER,
        building VARCHAR(10),
        name VARCHAR(50),
        type VARCHAR(20),
        display JSONB DEFAULT '{"floor": false, "building": false, "name": false, "type": false}',
        sales_limit JSONB DEFAULT '{"hourly": false, "nightly": false, "longTerm": false}',
        hourly_rate INTEGER DEFAULT 0,
        nightly_rate INTEGER DEFAULT 0,
        room_settings JSONB DEFAULT '{}',
        status VARCHAR(20) DEFAULT 'available',
        check_in_status VARCHAR(20),
        check_out_status VARCHAR(20),
        delay INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    res.status(200).json({ message: 'Rooms 테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}