import { sql } from '@vercel/postgres';

// 객실 상태 상수
export const ROOM_STATUS = {
  VACANT: 'vacant',  // available 대신 vacant 사용
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

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT 
          r.*,
          rds.show_floor, rds.show_building, rds.show_name, rds.show_type,
          rsl.hourly, rsl.nightly, rsl.long_term,
          rr.hourly_weekday, rr.hourly_friday, rr.hourly_weekend,
          rr.nightly_weekday, rr.nightly_friday, rr.nightly_weekend
        FROM rooms r
        LEFT JOIN room_display_settings rds ON r.id = rds.room_id
        LEFT JOIN room_sales_limits rsl ON r.id = rsl.room_id
        LEFT JOIN room_rates rr ON r.id = rr.room_id
        ORDER BY r.number
      `;

      const formattedRooms = rows.map(room => ({
        id: room.id,
        number: room.number,
        floor: room.floor,
        building: room.building,
        name: room.name,
        type: room.type,
        status: room.status || ROOM_STATUS.VACANT,
        display: {
          show_floor: room.show_floor || false,
          show_building: room.show_building || false,
          show_name: room.show_name || false,
          show_type: room.show_type || false
        },
        salesLimit: {
          hourly: room.hourly || false,
          nightly: room.nightly || false,
          longTerm: room.long_term || false
        },
        rates: {
          hourly: {
            weekday: room.hourly_weekday || 0,
            friday: room.hourly_friday || 0,
            weekend: room.hourly_weekend || 0
          },
          nightly: {
            weekday: room.nightly_weekday || 0,
            friday: room.nightly_friday || 0,
            weekend: room.nightly_weekend || 0
          }
        }
      }));

      res.status(200).json(formattedRooms);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ message: '객실 정보 조회에 실패했습니다.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
