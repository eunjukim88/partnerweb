import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'PUT') {
    try {
      const { number } = req.query;
      const { status } = req.body;

      await sql`BEGIN`;

      const result = await sql`
        UPDATE rooms
        SET 
          status = ${status},
          updated_at = CURRENT_TIMESTAMP
        WHERE number = ${number}
        RETURNING *
      `;

      if (result.rowCount === 0) {
        await sql`ROLLBACK`;
        return res.status(404).json({ message: '객실을 찾을 수 없습니다.' });
      }

      const { rows } = await sql`
        SELECT r.*, 
               rds.*, 
               rsl.*,
               rr.*
        FROM rooms r
        LEFT JOIN room_display_settings rds ON r.id = rds.room_id
        LEFT JOIN room_sales_limits rsl ON r.id = rsl.room_id
        LEFT JOIN room_rates rr ON r.id = rr.room_id
        WHERE r.number = ${number}
      `;

      await sql`COMMIT`;

      const processedRoom = {
        id: rows[0].id,
        number: rows[0].number,
        floor: rows[0].floor,
        building: rows[0].building,
        name: rows[0].name,
        type: rows[0].type,
        status: status,
        display: {
          show_floor: rows[0].show_floor || false,
          show_building: rows[0].show_building || false,
          show_name: rows[0].show_name || false,
          show_type: rows[0].show_type || false
        }
      };

      res.status(200).json(processedRoom);  // formattedRooms 대신 단일 객체 반환
    } catch (error) {
      await sql`ROLLBACK`;
      res.status(500).json({ message: '상태 업데이트에 실패했습니다.' });
    }
  }
}
