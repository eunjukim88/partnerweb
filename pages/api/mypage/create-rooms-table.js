import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  try {
    // rooms 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        number VARCHAR(10) NOT NULL UNIQUE,
        floor INTEGER,
        building VARCHAR(10),
        name VARCHAR(50),
        type VARCHAR(20),
        status VARCHAR(20) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // room_display_settings 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS room_display_settings (
        room_id INTEGER PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
        show_floor BOOLEAN DEFAULT false,
        show_building BOOLEAN DEFAULT false,
        show_name BOOLEAN DEFAULT false,
        show_type BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // room_sales_limits 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS room_sales_limits (
        room_id INTEGER PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
        hourly BOOLEAN DEFAULT false,
        nightly BOOLEAN DEFAULT false,
        long_term BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // room_rates 테이블 생성
    await sql`
      CREATE TABLE IF NOT EXISTS room_rates (
        room_id INTEGER PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
        hourly_weekday INTEGER DEFAULT 0,
        hourly_friday INTEGER DEFAULT 0,
        hourly_weekend INTEGER DEFAULT 0,
        nightly_weekday INTEGER DEFAULT 0,
        nightly_friday INTEGER DEFAULT 0,
        nightly_weekend INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    res.status(200).json({ message: 'Rooms 테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}
