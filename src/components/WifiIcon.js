import React, { useState, useEffect } from 'react';
import { BiWifi, BiWifi2, BiWifi1, BiWifiOff } from 'react-icons/bi';
import styled from 'styled-components';

const WifiIcon = () => {
  const [wifiStrength, setWifiStrength] = useState(4);

  // 3초마다 Wi-Fi 강도 변경
  useEffect(() => {
    const interval = setInterval(() => {
      // 3과 4 사이의 랜덤값만 생성 (강한 신호만 표시)
      const newStrength = Math.random() > 0.5 ? 3 : 4;
      setWifiStrength(newStrength);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  let Icon;
  let status;

  if (wifiStrength === 4) {
    Icon = BiWifi;
    status = '양호';
  } else {
    Icon = BiWifi2;
    status = '양호';
  }

  return (
    <WifiIconWrapper>
      <StyledWifiIcon as={Icon} />
      <WifiStatus>{status}</WifiStatus>
    </WifiIconWrapper>
  );
};

const WifiIconWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const StyledWifiIcon = styled.svg`
  font-size: 24px;
  color: inherit;
`;

const WifiStatus = styled.span`
  font-size: 12px;
  margin-top: 2px;
  color: inherit;
`;

export default WifiIcon;
