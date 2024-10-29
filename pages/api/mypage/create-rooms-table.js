import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) UNIQUE NOT NULL,
        floor INTEGER,
        building VARCHAR(50),
        name VARCHAR(100),
        type VARCHAR(50),
        status VARCHAR(50) DEFAULT 'vacant',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS room_display_settings (
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        show_floor BOOLEAN DEFAULT false,
        show_building BOOLEAN DEFAULT false,
        show_name BOOLEAN DEFAULT false,
        show_type BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS room_sales_limits (
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        hourly INTEGER DEFAULT 0,
        nightly INTEGER DEFAULT 0,
        long_term INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS room_rates (
        room_id INTEGER REFERENCES rooms(id) ON DELETE CASCADE,
        hourly_weekday INTEGER DEFAULT 0,
        hourly_friday INTEGER DEFAULT 0,
        hourly_weekend INTEGER DEFAULT 0,
        nightly_weekday INTEGER DEFAULT 0,
        nightly_friday INTEGER DEFAULT 0,
        nightly_weekend INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id)
      )
    `;

    res.status(200).json({ message: '테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    console.error('테이블 생성 오류:', error);
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}
