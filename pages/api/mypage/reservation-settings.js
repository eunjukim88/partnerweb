import { sql } from '@vercel/postgres';

// 전체 예약 설정 조회
async function getSettings() {
  const { rows } = await sql`
    SELECT * FROM reservation_settings
    ORDER BY created_at DESC
  `;
  return rows;
}

// GET 요청에서의 시간 변환 (DB -> 프론트엔드)
const formatTimeToAmPm = (timeStr) => {
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);
  const period = hour >= 12 ? '오후' : '오전';
  
  if (hour > 12) {
    hour -= 12;
  } else if (hour === 0) {
    hour = 12;
  }
  
  return `${period}:${hour.toString().padStart(2, '0')}:${minutes}`;
};

// PUT 요청에서의 시간 변환 (프론트엔드 -> DB)
const formatTime = (timeStr) => {
  try {
    console.log('Converting time:', timeStr);
    const [period, timeValue] = timeStr.split(':');
    const [hours] = timeValue.split(':');
    let hour = parseInt(hours);

    // 24시간 형식으로 변환
    if (period === '오후' && hour !== 12) {
      hour += 12;
    } else if (period === '오전' && hour === 12) {
      hour = 0;
    }

    const formattedTime = `${hour.toString().padStart(2, '0')}:00:00`;
    console.log('Formatted time result:', formattedTime);
    return formattedTime;
  } catch (error) {
    console.error('Time formatting error:', {
      input: timeStr,
      error: error.message
    });
    throw new Error(`Invalid time format: ${timeStr}`);
  }
};

// TimeSelector 컴포넌트에서 시간 형식을 맞추기 위한 함수
const formatTimeForDB = (period, hour, minute) => {
  return `${period}:${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

export default async function handler(req, res) {
  // GET 메소드 처리 추가
  if (req.method === 'GET') {
    try {
      const result = await sql`
        SELECT * FROM reservation_settings
        ORDER BY stay_type
      `;
      
      res.status(200).json(result);
    } catch (error) {
      console.error('GET request error:', error);
      res.status(500).json({ message: '설정을 불러오는데 실패했습니다.' });
    }
  }
  // PUT 메소드 처리
  else if (req.method === 'PUT') {
    try {
      console.log('Received PUT request body:', req.body);
      const { stayType, settings } = req.body;

      if (!stayType || !settings) {
        return res.status(400).json({ message: '필수 데이터가 누락되었습니다.' });
      }

      // 요일 변환
      const dayMap = { '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6, '일': 7 };
      const availableDays = settings.selectedDays.map(day => dayMap[day]);

      // 시간 형식 변환
      const checkInTime = formatTime(settings.checkInTime);
      const checkOutTime = formatTime(settings.checkOutTime);

      console.log('Formatted data for update:', {
        stayType,
        availableDays,
        checkInTime,
        checkOutTime,
        baseRate: settings.base_rate
      });

      // DB 업데이트
      await sql`
        UPDATE reservation_settings 
        SET 
          available_days = ${availableDays}::integer[],
          check_in_time = ${checkInTime}::time,
          check_out_time = ${checkOutTime}::time,
          base_rate = ${JSON.stringify(settings.base_rate)}::jsonb,
          updated_at = CURRENT_TIMESTAMP
        WHERE stay_type = ${stayType}
      `;

      res.status(200).json({ message: '설정이 저장되었습니다.' });
    } catch (error) {
      console.error('PUT request error:', error);
      res.status(500).json({ 
        message: '설정 저장에 실패했습니다.',
        error: error.message 
      });
    }
  } 
  // 허용되지 않는 메소드
  else {
    res.status(405).json({ message: '허용되지 않는 메소드입니다.' });
  }
}

// API 라우트가 종료될 때 Prisma 연결 해제
export const config = {
  api: {
    bodyParser: true,
  },
};
