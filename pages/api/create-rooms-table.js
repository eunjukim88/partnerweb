import { sql } from '@vercel/postgres';

/**
 * 데이터베이스 테이블 생성 API
 * 
 * 목적:
 * - 객실 관리 시스템의 기본 테이블 구조 생성
 * - 테이블 간 관계 설정
 * - 인덱스 생성으로 조회 성능 최적화
 */
export default async function handler(req, res) {
  try {
    await sql`BEGIN`;

    /**
     * 객실 테이블 (rooms)
     * 
     * 용도:
     * - 객실 기본 정보 관리
     * - 객실 상태 관리
     * - 표시 설정 관리
     * - 판매 유형 관리
     */
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id SERIAL PRIMARY KEY,
        room_number VARCHAR(10) NOT NULL,
        room_floor TEXT,
        room_building VARCHAR(50) NULL,
        room_name VARCHAR(100) NULL,
        room_type TEXT,
        stay_type VARCHAR(10) CHECK (stay_type IN ('대실', '숙박', '장기', NULL)),
        room_status VARCHAR(50),
        show_floor BOOLEAN DEFAULT false,
        show_building BOOLEAN DEFAULT false,
        show_name BOOLEAN DEFAULT false,
        show_type BOOLEAN DEFAULT false,
        hourly BOOLEAN DEFAULT false,
        nightly BOOLEAN DEFAULT false,
        long_term BOOLEAN DEFAULT false,
        memo TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    /**
     * 객실 요금 테이블 (room_rates)
     * 
     * 용도:
     * - 객실별 개별 요금 설정
     * - 요일별/숙박타입별 요금 관리
     * 
     * 연관 테이블:
     * - rooms: room_id로 연결 (CASCADE 삭제)
     */
    await sql`
      CREATE TABLE IF NOT EXISTS room_rates (
        room_id INTEGER REFERENCES rooms(room_id) ON DELETE CASCADE,
        rate_hourly_weekday INTEGER DEFAULT 0,
        rate_hourly_friday INTEGER DEFAULT 0,
        rate_hourly_weekend INTEGER DEFAULT 0,
        rate_nightly_weekday INTEGER DEFAULT 0,
        rate_nightly_friday INTEGER DEFAULT 0,
        rate_nightly_weekend INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id)
      )
    `;

    /**
     * 예약 설정 테이블 (reservation_settings)
     * 
     * 용도:
     * - 숙박 타입별(대실/숙박/장기) 기본 설정
     * - 예약 가능 요일 설정 (비트마스크)
     * - 요일별 기본 요금 설정
     * - 체크인/아웃 시간 설정
     * 
     * 특징:
     * - stay_type이 PK (3개 고정값: 대실/숙박/장기)
     * - 생성/삭제 없이 수정만 가능
     * - available_days: 예약 가능 요일 설정
     */
    await sql`
      CREATE TABLE IF NOT EXISTS reservation_settings (
        stay_type VARCHAR(10) PRIMARY KEY CHECK (stay_type IN ('대실', '숙박', '장기')),
        available_days BIT(7) DEFAULT B'1111111',
        check_in_time TIME NOT NULL DEFAULT '15:00',
        check_out_time TIME NOT NULL DEFAULT '11:00',
        weekday_rate INTEGER NOT NULL DEFAULT 0,
        friday_rate INTEGER NOT NULL DEFAULT 0,
        weekend_rate INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    /**
     * 예약 테이블 (reservations)
     * 
     * 용도:
     * - 예약 정보 관리
     * - 투숙객 정보 관리
     * - 체크인/아웃 관리
     * 
     * 특징:
     * - reservation_number: 고유한 예약 번호
     * - check_in/out_date: 체크인/아웃 날짜
     * - check_in/out_time: reservation_settings의 시간 값 사용
     * - stay_type_rate: 예약 당시의 적용 요금
     * - booking_source: 예약 경로 (DIRECT, AIRBNB 등)
     */
    await sql`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id SERIAL PRIMARY KEY,
        reservation_number VARCHAR(50) NOT NULL,
        room_id INTEGER NOT NULL REFERENCES rooms(room_id),
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        check_in_time TIME NOT NULL,
        check_out_time TIME NOT NULL,
        stay_type VARCHAR(20) CHECK (stay_type IN ('대실', '숙박', '장기', NULL)),
        booking_source VARCHAR(20) NOT NULL CHECK (
          booking_source IN ('DIRECT', 'AIRBNB', 'YANOLJA', 'YEOGI', 'BOOKING', 'AGODA', 'OTHER')
        ),
        rate_amount INTEGER NOT NULL,
        memo TEXT,
        phone VARCHAR(20) NOT NULL,
        guest_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT fk_room
          FOREIGN KEY(room_id)
          REFERENCES rooms(room_id)
          ON DELETE RESTRICT
      )
    `;

    /**
     * 인덱스 생성
     * 
     * 목적:
     * - 조회 성능 최적화
     * - 자주 사용되는 필드 검색 속도 향상
     */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_rooms_number ON rooms(room_number);
      
      CREATE INDEX IF NOT EXISTS idx_room_rates_room_id ON room_rates(room_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in_date, check_out_date);
      CREATE INDEX IF NOT EXISTS idx_reservations_stay_type ON reservations(stay_type);
      CREATE INDEX IF NOT EXISTS idx_reservation_settings_stay_type ON reservation_settings(stay_type);
      CREATE INDEX IF NOT EXISTS idx_reservations_number ON reservations(reservation_number);
      CREATE INDEX IF NOT EXISTS idx_reservations_booking_source ON reservations(booking_source);
      CREATE INDEX IF NOT EXISTS idx_reservations_phone ON reservations(phone);
      CREATE INDEX IF NOT EXISTS idx_reservations_guest ON reservations(guest_name);
    `;

    await sql`COMMIT`;
    res.status(200).json({ message: '테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('테이블 생성 오류:', error);
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}
