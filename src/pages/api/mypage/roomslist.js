import { sql } from '@vercel/postgres';
import getConfig from 'next/config';

const { serverRuntimeConfig } = getConfig();

console.log('POSTGRES_URL:', serverRuntimeConfig.POSTGRES_URL);

export default async function handler(req, res) {
  try {
    // 데이터베이스 연결 테스트
    await sql`SELECT 1`;
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ error: 'Database connection failed', details: error.message });
  }

  try {
    // rooms 테이블 존재 여부 확인
    const { rows } = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'rooms'
      )
    `;
    if (!rows[0]?.exists) {
      console.error('Rooms table does not exist');
      return res.status(500).json({ error: 'Rooms table does not exist in the database' });
    } else {
      console.log('Rooms table exists:', rows[0].exists);
    }
  } catch (error) {
    console.error('Error checking table existence:', error);
    return res.status(500).json({ error: 'Error checking table existence', details: error.message });
  }

  // 요청 메서드에 따른 핸들러 실행
  try {
    switch (req.method) {
      case 'GET':
        return await getRooms(req, res);
      case 'POST':
        return await addRoom(req, res);
      case 'PUT':
        return await updateRoom(req, res);
      case 'DELETE':
        return await deleteRoom(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ error: 'Server error occurred while handling request', details: error.message });
  }
}

// 모든 객실 조회
async function getRooms(req, res) {
  try {
    const { rows } = await sql`
      SELECT id, number, floor, building, name, type 
      FROM rooms 
      ORDER BY floor, building, number
    `;
    console.log('Fetched rooms:', rows);
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: '객실 정보를 가져오는 데 실패했습니다.', details: error.message });
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
    console.log('Room added:', rows[0]);
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding room:', error);
    res.status(500).json({ error: '객실 추가에 실패했습니다.', details: error.message });
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
      console.log('Room updated:', rows[0]);
      res.status(200).json(rows[0]);
    }
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ error: '객실 정보 수정에 실패했습니다.', details: error.message });
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
      console.log('Room deleted with id:', id);
      res.status(200).json({ message: '객실이 성공적으로 삭제되었습니다.' });
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ error: '객실 삭제에 실패했습니다.', details: error.message });
  }
}
