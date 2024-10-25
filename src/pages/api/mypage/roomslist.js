import { sql } from '@vercel/postgres';
import getConfig from 'next/config';

console.log('POSTGRES_URL:', process.env.POSTGRES_URL);

export default async function handler(req, res) {
  try {
    await sql`SELECT 1`; // 데이터베이스 연결 테스트
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }

  try {
    const { rows } = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'rooms'
      )
    `;
    console.log('Rooms table exists:', rows[0].exists);
  } catch (error) {
    console.error('Error checking table existence:', error);
  }

  switch (req.method) {
    case 'GET':
      return getRooms(req, res);
    case 'POST':
      return addRoom(req, res);
    case 'PUT':
      return updateRoom(req, res);
    case 'DELETE':
      return deleteRoom(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// 모든 객실 조회
async function getRooms(req, res) {
  try {
    const { rows } = await sql`SELECT id, number, floor, building, name, type FROM rooms ORDER BY floor, building, number`;
    console.log('Fetched rooms:', rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: '객실 정보를 가져오는 데 실패했습니다.', details: error.message, stack: error.stack });
  }
}

// 새 객실 추가
async function addRoom(req, res) {
  const { floor, building, number, name, type } = req.body;
  try {
    const { rows } = await sql`
      INSERT INTO rooms (floor, building, number, name, type)
      VALUES (${floor}, ${building}, ${number}, ${name}, ${type})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: '객실 추가에 실패했습니다.' });
  }
}

// 객실 정보 수정
async function updateRoom(req, res) {
  const { id, floor, building, number, name, type } = req.body;
  try {
    const { rows } = await sql`
      UPDATE rooms
      SET floor = ${floor}, building = ${building}, number = ${number}, name = ${name}, type = ${type}
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      res.status(404).json({ error: '해당 객실을 찾을 수 없습니다.' });
    } else {
      res.status(200).json(rows[0]);
    }
  } catch (error) {
    res.status(500).json({ error: '객실 정보 수정에 실패했습니다.' });
  }
}

// 객실 삭제
async function deleteRoom(req, res) {
  const { id } = req.query;
  try {
    const { rowCount } = await sql`DELETE FROM rooms WHERE id = ${id}`;
    if (rowCount === 0) {
      res.status(404).json({ error: '해당 객실을 찾을 수 없습니다.' });
    } else {
      res.status(200).json({ message: '객실이 성공적으로 삭제되었습니다.' });
    }
  } catch (error) {
    res.status(500).json({ error: '객실 삭제에 실패했습니다.' });
  }
}
