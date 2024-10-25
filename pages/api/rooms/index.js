// 객실 정보를 생성하는 함수입니다.
const generateRooms = () => {
    // 객실 상태를 나타내는 문자열 배열입니다.
    const statuses = [
      'longStay',              // 장기 투숙
      'overnightStay',         // 1박 투숙
      'salesStopped',          // 판매 중지
      'cleaningComplete',      // 청소 완료
      'underInspection',       // 점검 중
      'inspectionComplete',    // 점검 완료
      'cleaningRequested',     // 청소 요청됨
      'hourlyStay',            // 시간제 투숙
      'cleaningInProgress',    // 청소 중
      'vacant',                // 빈 방
      'reservationComplete',   // 예약 완료
      'inspectionRequested'    // 점검 요청됨
    ];
  
    // 객실 타입을 나타내는 문자열 배열입니다.
    const roomTypes = ['스탠다드', '디럭스', '스위트'];
  
    // 메모로 사용할 문자열 배열입니다.
    const memos = [
      '청소 필요',
      '타올 추가 요청',
      'VIP 고객',
      '늦은 체크아웃',
      '조용한 객실 요청',
      '알러지 주의',
      '생일 축하 이벤트',
      '장기 투숙객',
      '조식 룸서비스 요청',
      '반려동물 동반',
      '금연 객실 요청',
      '엑스트라 베드 필요',
      '창문 쪽 객실 선호',
      '커플 기념일',
      '비즈니스 고객',
      '어린이 동반',
      '휠체어 접근성 필요',
      '특별 청소 요청',
      '미니바 리필 필요',
      '조기 체크인'
    ];
  
    // 28개의 객실 정보를 생성하여 배열로 반환합니다.
    return Array.from({ length: 28 }, (_, index) => {
      // 객실 상태를 랜덤하게 선택합니다.
      const status = statuses[Math.floor(Math.random() * statuses.length)];
  
      // 활성화된 상태인지 확인합니다.
      const isActiveStatus = [
        'longStay',
        'overnightStay',
        'hourlyStay',
        'reservationComplete',
        'cleaningRequested'
      ].includes(status);
      
      // 체크인 상태와 체크아웃 상태를 초기화합니다.
      let checkInStatus = null;
      let checkOutStatus = null;
      let delay = null;
  
      if (isActiveStatus) {
        if (Math.random() > 0.5) { // 50% 확률로 체크인 상태
          // 60% 확률로 '외출중', 그렇지 않으면 '입실중'
          checkInStatus = Math.random() > 0.6 ? '외출중' : '입실중';
  
          // 20% 확률로 지연 시간 설정
          if (Math.random() > 0.8) {
            delay = Math.floor(Math.random() * 120); // 최대 2시간 지연
          }
        } else { // 나머지 50%는 체크아웃 상태
          checkOutStatus = '체크아웃';
  
          // 20% 확률로 지연 시간 설정
          if (Math.random() > 0.8) {
            delay = Math.floor(Math.random() * 120); // 최대 2시간 지연
          }
        }
      }
  
      return {
        id: index + 1, // 객실 ID (1부터 시작)
        number: `${Math.floor(index / 7) + 1}0${(index % 7) + 1}`, // 객실 번호 (예: 101, 202)
        name: `${roomTypes[index % 3]}`, // 객실 타입 ('스탠다드', '디럭스', '스위트')
        status: status, // 객실 상태
        checkIn: '14:00', // 기본 체크인 시간
        checkOut: '11:00', // 기본 체크아웃 시간
        memo: Math.random() > 0.3 ? memos[Math.floor(Math.random() * memos.length)] : '', // 70% 확률로 메모 추가
        mainCard: Math.random() > 0.5, // 메인 카드 보유 여부 (50% 확률)
        subCard: Math.random() > 0.5, // 서브 카드 보유 여부 (50% 확률)
        hasWifi: Math.random() > 0.2, // Wi-Fi 사용 가능 여부 (80% 확률로 사용 가능)
        checkInStatus: checkInStatus, // 체크인 상태 ('외출중', '입실중' 또는 null)
        checkOutStatus: checkOutStatus, // 체크아웃 상태 ('체크아웃' 또는 null)
        delay: delay, // 지연 시간 (분 단위) 또는 null
      };
    });
  };
  
  // 가상의 Wi-Fi 신호 강도를 생성하는 함수입니다.
  const generateWifiStrength = () => Math.floor(Math.random() * 5); // 0부터 4까지의 정수 반환
  
  // 특정 객실의 Wi-Fi 신호 강도를 비동기적으로 가져오는 함수입니다.
  export const fetchWifiStrength = async (roomId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Wi-Fi 신호 강도를 생성하여 반환합니다.
        resolve(generateWifiStrength());
      }, 500); // 0.5초 지연 후 실행
    });
  };
  
  // 모든 객실 정보를 비동기적으로 가져오는 함수입니다.
  export const fetchRooms = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 객실 정보를 생성합니다.
        const rooms = generateRooms();
        // 생성된 객실 정보를 반환합니다.
        resolve(rooms);
      }, 1000); // 1초 지연 후 실행
    });
  };
  
  // API 라우트 핸들러를 추가합니다
  export default async function handler(req, res) {
    if (req.method === 'GET') {
      try {
        const rooms = await fetchRooms();
        res.status(200).json(rooms);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Error fetching rooms' });
      }
    } else {
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
