import React from 'react'; // React 라이브러리 임포트
import { BiWifi, BiWifi2, BiWifi1, BiWifiOff } from 'react-icons/bi'; // Wi-Fi 아이콘 임포트
import styled from 'styled-components'; // styled-components 임포트

const WifiIcon = ({ strength }) => { // WifiIcon 컴포넌트 정의, strength를 props로 받음
  let Icon; // 사용할 아이콘을 저장할 변수
  let status; // Wi-Fi 상태 텍스트를 저장할 변수

  if (strength === 4) { // strength가 4인 경우
    Icon = BiWifi; // BiWifi 아이콘 사용
    status = '양호'; // 상태 텍스트 설정
  } else if (strength === 3) { // strength가 3인 경우
    Icon = BiWifi2; // BiWifi2 아이콘 사용
    status = '양호'; // 상태 텍스트 설정
  } else if (strength === 2) { // strength가 2인 경우
    Icon = BiWifi1; // BiWifi1 아이콘 사용
    status = '약함'; // 상태 텍스트 설정
  } else { // 그 외의 경우
    Icon = BiWifiOff; // BiWifiOff 아이콘 사용
    status = '끊김'; // 상태 텍스트 설정
  }

  return (
    <WifiIconWrapper> {/* Wi-Fi 아이콘과 상태를 감싸는 래퍼 */}
      <StyledWifiIcon as={Icon} /> {/* 선택된 아이콘을 스타일링하여 렌더링 */}
      <WifiStatus>{status}</WifiStatus> {/* Wi-Fi 상태 텍스트 표시 */}
    </WifiIconWrapper>
  );
};

// Wi-Fi 아이콘과 상태 텍스트를 세로로 정렬하는 래퍼 스타일링
const WifiIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

// Wi-Fi 아이콘 스타일링
const StyledWifiIcon = styled.svg`
  font-size: 24px; // 아이콘 크기 설정
`;

// Wi-Fi 상태 텍스트 스타일링
const WifiStatus = styled.span`
  font-size: 12px; // 텍스트 크기 설정
  margin-top: 2px; // 상단 여백 설정
`;

export default WifiIcon; // WifiIcon 컴포넌트를 기본 내보내기
