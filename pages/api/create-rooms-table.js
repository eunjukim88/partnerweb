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
     * 객실 상태 설정 테이블 (room_status_settings)
     * 
     * 용도:
     * - 숙박 타입별(hourly/nightly/long_term) 기본 설정
     * - 예약 가능 요일 설정 (비트마스크)
     * - 요일별 기본 요금 설정
     * - 체크인/아웃 시간 설정
     * 
     * 연관 테이블:
     * - rooms: status_type 필드로 참조
     * - reservations: stay_type 필드로 참조
     */
    await sql`
      CREATE TABLE IF NOT EXISTS room_status_settings (
        setting_id SERIAL PRIMARY KEY,
        status_type VARCHAR(50) NOT NULL CHECK (status_type IN ('hourly', 'nightly', 'long_term')),
        available_days BIT(7) DEFAULT B'1111111',  -- 월화수목금토일, 1=가능, 0=불가능
        rate_weekday INTEGER DEFAULT 0,            -- 평일 요금
        rate_weekend INTEGER DEFAULT 0,            -- 주말 요금
        rate_friday INTEGER DEFAULT 0,             -- 금요일 요금
        check_in_time TIME DEFAULT '15:00',        -- 체크인 가능 시간
        check_out_time TIME DEFAULT '11:00',       -- 체크아웃 시간
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(status_type)
      )
    `;

    /**
     * 객실 테이블 (rooms)
     * 
     * 용도:
     * - 객실 기본 정보 관리
     * - 객실 상태 관리
     * - 표시 설정 관리
     * - 판매 유형 관리
     * 
     * 연관 테이블:
     * - room_status_settings: status_type 필드로 연결
     * - room_rates: room_id로 연결
     * - reservations: room_id로 연결
     */
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        room_id SERIAL PRIMARY KEY,
        room_number VARCHAR(10) UNIQUE NOT NULL,
        room_floor INTEGER NULL,
        room_building VARCHAR(50) NULL,
        room_name VARCHAR(100) NULL,
        room_type VARCHAR(50) NULL,
        reservation_status VARCHAR(50) NOT NULL DEFAULT 'vacant',
        room_status VARCHAR(50) NULL,
        show_floor BOOLEAN DEFAULT false,
        show_building BOOLEAN DEFAULT false,
        show_name BOOLEAN DEFAULT false,
        show_type BOOLEAN DEFAULT false,
        hourly BOOLEAN DEFAULT false,
        nightly BOOLEAN DEFAULT false,
        long_term BOOLEAN DEFAULT false,
        memo TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;

    /**
     * 객실 요금 테이블 (room_rates)
     * 
     * 용도:
     * - 객실별 개별 요금 설정 (room_status_settings 요금보다 우선 적용)
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
     * - 숙박 타입별(hourly/nightly/long_term) 기본 설정
     * - 예약 가능 요일 설정 (비트마스크)
     * - 요일별 기본 요금 설정
     * - 체크인/아웃 시간 설정
     * 
     * 특징:
     * - stay_type이 PK (3개 고정값: hourly/nightly/long_term)
     * - 생성/삭제 없이 수정만 가능
     * - available_days: room_status_settings와 동일한 비트마스크 사용
     * 
     * 연관 테이블:
     * - reservations: stay_type 필드로 참조
     * - room_status_settings: 상위 설정으로 참조
     */
    await sql`
      CREATE TABLE IF NOT EXISTS reservation_settings (
        stay_type VARCHAR(10) PRIMARY KEY CHECK (stay_type IN ('hourly', 'nightly', 'long_term')),
        available_days BIT(7) DEFAULT B'1111111',  -- 월화수목금토일, 1=가능, 0=불가능
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
     * - check_in/out: 한국 날짜 (YYYY-MM-DD)
     * - check_in/out_time: room_status_settings 참조
     * - price: room_rates 우선, 없으면 room_status_settings 참조
     * 
     * 연관 테이블:
     * - rooms: room_id로 연결
     * - room_status_settings: stay_type으로 연결
     */
    await sql`
      CREATE TABLE IF NOT EXISTS reservations (
        reservation_id SERIAL PRIMARY KEY,
        reservation_number VARCHAR(255) NOT NULL UNIQUE,
        room_id INTEGER REFERENCES rooms(room_id),
        guest_name VARCHAR(255) NOT NULL,
        phone VARCHAR(255) NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        check_in_time TIME NOT NULL,
        check_out_time TIME NOT NULL,
        booking_source VARCHAR(50),
        stay_type VARCHAR(50) CHECK (stay_type IN ('hourly', 'nightly', 'long_term')),
        price INTEGER DEFAULT 0,
        memo TEXT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
      CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(reservation_status, room_status);
      CREATE INDEX IF NOT EXISTS idx_room_rates_room_id ON room_rates(room_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_room_id ON reservations(room_id);
      CREATE INDEX IF NOT EXISTS idx_reservations_dates ON reservations(check_in, check_out);
      CREATE INDEX IF NOT EXISTS idx_reservations_stay_type ON reservations(stay_type);
      CREATE INDEX IF NOT EXISTS idx_reservation_settings_stay_type ON reservation_settings(stay_type);
    `;

    await sql`COMMIT`;
    res.status(200).json({ message: '테이블이 성공적으로 생성되었습니다.' });
  } catch (error) {
    await sql`ROLLBACK`;
    console.error('테이블 생성 오류:', error);
    res.status(500).json({ error: '테이블 생성에 실패했습니다.' });
  }
}