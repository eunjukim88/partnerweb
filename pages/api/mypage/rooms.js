import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  switch (req.method) {
    case 'GET':
      return handleGetRooms(req, res);
    case 'PUT':
      return handleUpdateRoom(req, res);
    case 'DELETE':
      return handleDeleteRoom(req, res);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGetRooms(req, res) {
  try {
    const { number } = req.query;
    
    const query = number 
      ? sql`
          SELECT r.*, 
                 rds.*, 
                 rsl.*,
                 rr.*
          FROM rooms r
          LEFT JOIN room_display_settings rds ON r.id = rds.room_id
          LEFT JOIN room_sales_limits rsl ON r.id = rsl.room_id
          LEFT JOIN room_rates rr ON r.id = rr.room_id
          WHERE r.number = ${number}
        `
      : sql`
          SELECT r.*, 
                 rds.*, 
                 rsl.*,
                 rr.*
          FROM rooms r
          LEFT JOIN room_display_settings rds ON r.id = rds.room_id
          LEFT JOIN room_sales_limits rsl ON r.id = rsl.room_id
          LEFT JOIN room_rates rr ON r.id = rr.room_id
          ORDER BY r.number
        `;
    
    const { rows } = await query;

    if (number && rows.length === 0) {
      return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
    }

    // 응답 데이터 구조화
    const processedRooms = rows.map(row => ({
      id: row.id,
      number: row.number,
      floor: row.floor,
      building: row.building,
      name: row.name,
      type: row.type,
      status: row.status,
      display: {
        floor: row.show_floor,
        building: row.show_building,
        name: row.show_name,
        type: row.show_type
      },
      salesLimit: {
        hourly: row.hourly,
        nightly: row.nightly,
        longTerm: row.long_term
      },
      rates: {
        hourly: {
          weekday: row.hourly_weekday,
          friday: row.hourly_friday,
          weekend: row.hourly_weekend
        },
        nightly: {
          weekday: row.nightly_weekday,
          friday: row.nightly_friday,
          weekend: row.nightly_weekend
        }
      },
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    res.status(200).json(number ? processedRooms[0] : processedRooms);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: '서버 오류가 발생했습니다.' });
  }
}

async function handleUpdateRoom(req, res) {
  try {
    const {
      id,
      number,
      floor,
      building,
      name,
      type,
      display,
      salesLimit,
      rates
    } = req.body;

    // 트랜잭션 시작
    await sql`BEGIN`;

    try {
      // 기본 정보 업데이트
      const roomResult = await sql`
        UPDATE rooms 
        SET 
          floor = ${floor || null},
          building = ${building || null},
          name = ${name || null},
          type = ${type || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
        RETURNING *
      `;

      // 표시 설정 업데이트
      await sql`
        INSERT INTO room_display_settings (
          room_id, 
          show_floor, 
          show_building, 
          show_name, 
          show_type
        ) 
        VALUES (
          ${id},
          ${display.floor},
          ${display.building},
          ${display.name},
          ${display.type}
        )
        ON CONFLICT (room_id) 
        DO UPDATE SET
          show_floor = ${display.floor},
          show_building = ${display.building},
          show_name = ${display.name},
          show_type = ${display.type},
          updated_at = CURRENT_TIMESTAMP
      `;

      // 판매 제한 설정 업데이트
      await sql`
        INSERT INTO room_sales_limits (
          room_id,
          hourly,
          nightly,
          long_term
        )
        VALUES (
          ${id},
          ${salesLimit.hourly},
          ${salesLimit.nightly},
          ${salesLimit.longTerm}
        )
        ON CONFLICT (room_id)
        DO UPDATE SET
          hourly = ${salesLimit.hourly},
          nightly = ${salesLimit.nightly},
          long_term = ${salesLimit.longTerm},
          updated_at = CURRENT_TIMESTAMP
      `;

      // 요금 설정 ��데이트
      await sql`
        INSERT INTO room_rates (
          room_id,
          hourly_weekday,
          hourly_friday,
          hourly_weekend,
          nightly_weekday,
          nightly_friday,
          nightly_weekend
        )
        VALUES (
          ${id},
          ${rates.hourly.weekday},
          ${rates.hourly.friday},
          ${rates.hourly.weekend},
          ${rates.nightly.weekday},
          ${rates.nightly.friday},
          ${rates.nightly.weekend}
        )
        ON CONFLICT (room_id)
        DO UPDATE SET
          hourly_weekday = ${rates.hourly.weekday},
          hourly_friday = ${rates.hourly.friday},
          hourly_weekend = ${rates.hourly.weekend},
          nightly_weekday = ${rates.nightly.weekday},
          nightly_friday = ${rates.nightly.friday},
          nightly_weekend = ${rates.nightly.weekend},
          updated_at = CURRENT_TIMESTAMP
      `;

      await sql`COMMIT`;
      res.status(200).json(roomResult.rows[0]);
    } catch (error) {
      await sql`ROLLBACK`;
      throw error;
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: '업데이트 실패', details: error.message });
  }
}

async function handleDeleteRoom(req, res) {
  try {
    const { id } = req.query;
    const { rowCount } = await sql`DELETE FROM rooms WHERE id = ${id}`;
    
    if (rowCount === 0) {
      return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
    }
    
    res.status(200).json({ message: '객실이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    console.error('객실 삭제 오류:', error);
    res.status(500).json({ error: '삭제 실패', details: error.message });
  }
}

