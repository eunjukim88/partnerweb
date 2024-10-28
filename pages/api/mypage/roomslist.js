import { sql } from '@vercel/postgres';

console.log('POSTGRES_URL:', process.env.POSTGRES_URL);

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { number } = req.query;
      
      // 특정 객실 번호가 있으면 해당 객실 정보만 반환
      if (number) {
        const { rows } = await sql`
          SELECT * FROM rooms 
          WHERE number = ${number}
        `;

        if (rows.length === 0) {
          return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
        }

        return res.status(200).json(rows[0]);
      }
      
      // 객실 번호가 없으면 전체 목록 반환
      const { rows } = await sql`
        SELECT * FROM rooms 
        ORDER BY number
      `;
      
      res.status(200).json(rows);
    } catch (error) {
      console.error('객실 정보 조회 중 오류 발생:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
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
