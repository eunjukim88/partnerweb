import { sql } from '@vercel/postgres';

// 객실 상태 상수
const ROOM_STATUS = {
  VACANT: 'vacant',
  HOURLY_STAY: 'hourlyStay',
  OVERNIGHT_STAY: 'overnightStay',
  LONG_STAY: 'longStay',
  CLEANING_REQUESTED: 'cleaningRequested',
  CLEANING_IN_PROGRESS: 'cleaningInProgress',
  CLEANING_COMPLETE: 'cleaningComplete',
  INSPECTION_REQUESTED: 'inspectionRequested',
  UNDER_INSPECTION: 'underInspection',
  INSPECTION_COMPLETE: 'inspectionComplete',
  SALES_STOPPED: 'salesStopped',
  RESERVATION_COMPLETE: 'reservationComplete'
};

// 현재 시간에 해당하는 예약 상태 조회
async function getCurrentRoomStatus() {
  const now = new Date().toISOString();
  
  try {
    const { rows } = await sql`
      WITH current_reservations AS (
        SELECT 
          r.room_number,
          CASE 
            WHEN r.check_in <= ${now} AND r.check_out >= ${now} THEN
              CASE 
                WHEN r.stay_type = '대실' THEN ${ROOM_STATUS.HOURLY_STAY}
                WHEN r.stay_type = '숙박' THEN ${ROOM_STATUS.OVERNIGHT_STAY}
                WHEN r.stay_type = '장기' THEN ${ROOM_STATUS.LONG_STAY}
              END
            ELSE NULL
          END as status
        FROM reservations r
        WHERE r.check_in <= ${now} AND r.check_out >= ${now}
      )
      SELECT 
        r.*,
        COALESCE(cr.status, ${ROOM_STATUS.VACANT}) as current_status
      FROM rooms r
      LEFT JOIN current_reservations cr ON r.number = cr.room_number
      ORDER BY r.number;
    `;
    
    return rows;
  } catch (error) {
    console.error('Error fetching room status:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        WITH current_reservations AS (
          SELECT 
            r.room_number,
            r.check_in,
            r.check_out,
            r.stay_type,
            r.guest_name,
            r.memo
          FROM reservations r
          WHERE 
            CURRENT_TIMESTAMP BETWEEN r.check_in AND r.check_out
            AND r.status != 'cancelled'
        )
        SELECT 
          rooms.*,
          cr.stay_type as reservation_type,
          cr.check_in,
          cr.check_out,
          cr.guest_name,
          cr.memo as reservation_memo
        FROM rooms
        LEFT JOIN current_reservations cr ON rooms.number = cr.room_number
        ORDER BY rooms.number;
      `;

      const formattedRooms = rows.map(room => ({
        ...room,
        status: room.reservation_type ? 
                (room.reservation_type === '대실' ? 'hourlyStay' :
                 room.reservation_type === '숙박' ? 'overnightStay' : 'longStay')
                : (room.status || 'vacant'),
        checkIn: room.check_in ? new Date(room.check_in).toLocaleTimeString('ko-KR') : null,
        checkOut: room.check_out ? new Date(room.check_out).toLocaleTimeString('ko-KR') : null,
        display: room.display || {}
      }));

      res.status(200).json(formattedRooms);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: '서버 오류가 발생했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
