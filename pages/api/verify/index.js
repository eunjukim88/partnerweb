// 전화번호와 인증 코드를 저장할 Map 객체를 생성합니다.
// 이 객체는 메모리에 저장되며, 실제 애플리케이션에서는 데이터베이스를 사용해야 합니다.
const verificationCodes = new Map();

// 임시 유저 데이터입니다.
const userData = [
  { phoneNumber: '01012345678' },
  { phoneNumber: '01087654321' },
  { phoneNumber: '01011112222' }
];

// HTTP POST 요청을 처리하는 비동기 함수입니다.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: '허용되지 않은 메서드입니다.' });
  }

  try {
    // 요청 본문에서 JSON 데이터를 파싱하여 phoneNumber와 verificationCode를 추출합니다.
    const { phoneNumber, verificationCode } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: '전화번호를 입력해주세요.' });
    }

    // 유저 데이터에서 전화번호가 존재하는지 확인합니다.
    const user = userData.find((user) => user.phoneNumber === phoneNumber);
    if (!user) {
      return res.status(400).json({ message: '등록되지 않은 전화번호입니다.' });
    }

    // 만약 verificationCode가 존재하면, 이는 인증 요청입니다.
    if (verificationCode) {
      // 디버깅을 위해 검증 요청 정보와 저장된 인증 코드를 콘솔에 출력합니다.
      console.log(`검증 요청: ${phoneNumber} - ${verificationCode}`);
      console.log(`저장된 코드: ${verificationCodes.get(phoneNumber)}`);

      // Map 객체에서 해당 전화번호로 저장된 인증 코드를 가져옵니다.
      const storedCode = verificationCodes.get(phoneNumber);

      // 저장된 인증 코드와 사용자가 입력한 인증 코드를 비교합니다.
      if (storedCode && storedCode === verificationCode) {
        // 인증에 성공하면 해당 전화번호의 인증 코드를 Map에서 삭제합니다.
        verificationCodes.delete(phoneNumber);

        // 실제로는 여기서 JWT 등의 토큰을 생성하여 반환해야 합니다.
        const token = 'dummy_token_' + Date.now();

        // 인증 성공 메시지와 토큰을 JSON 형식으로 응답합니다.
        return res.status(200).json({ message: '인증에 성공했습니다.', token });
      } else {
        // 인증 코드가 일치하지 않을 경우 에러 메시지를 응답합니다.
        return res.status(400).json({ message: '잘못된 인증번호입니다.' });
      }
    }

    // 6자리의 랜덤 인증 코드를 생성합니다.
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 생성된 인증 코드를 전화번호를 키로 하여 Map에 저장합니다.
    verificationCodes.set(phoneNumber, generatedCode);

    // 콘솔에 전화번호와 인증 코드를 출력합니다.
    // 실제 애플리케이션에서는 이 부분에서 SMS API를 사용하여 인증 코드를 전송해야 합니다.
    console.log(`전화번호: ${phoneNumber}, 인증 코드: ${generatedCode}`);

    // 클라이언트에게 인증번호 발송 완료 메시지를 JSON 형식으로 응답합니다.
    return res.status(200).json({ message: '인증번호가 발송되었습니다.' });
  } catch (error) {
    // 오류 발생 시 콘솔에 에러 메시지를 출력합니다.
    console.error('요청 처리 중 오류 발생:', error);

    // 서버 오류 메시지를 클라이언트에게 JSON 형식으로 응답하며, HTTP 상태 코드는 500으로 설정합니다.
    return res.status(500).json({ message: '서버 오류가 발생했습니다.', error: error.message });
  }
}
