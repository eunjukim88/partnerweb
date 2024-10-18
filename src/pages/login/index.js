"use client"; // Next.js 13에서 클라이언트 컴포넌트임을 명시합니다.

import { useState, useEffect } from 'react'; // React 훅을 임포트합니다.
import styled, { ThemeProvider } from 'styled-components'; // 스타일링을 위한 styled-components를 임포트합니다.
import { useRouter } from 'next/navigation'; // Next.js의 라우터 훅을 사용합니다.
import Image from 'next/image'; // 이미지 최적화를 위한 Image 컴포넌트를 임포트합니다.
import logo from '@/public/logo.svg';
import theme from '../../styles/theme';

// 로그인 페이지 컴포넌트입니다.
const LoginPage = () => {
  // 상태 변수를 선언합니다.
  const [phoneNumber, setPhoneNumber] = useState(''); // 전화번호 입력값을 저장합니다.
  const [verificationCode, setVerificationCode] = useState(''); // 인증번호 입력값을 저장합니다.
  const [error, setError] = useState(null); // 에러 메시지를 저장합니다.
  const [step, setStep] = useState('phone'); // 현재 단계를 저장합니다 ('phone' 또는 'verification').
  const [timeLeft, setTimeLeft] = useState(180); // 남은 시간을 저장합니다 (3분 = 180초).
  const router = useRouter(); // 페이지 이동을 위한 라우터 훅을 사용합니다.

  // 인증번호 입력 제한 시간을 관리하는 useEffect 훅입니다.
  useEffect(() => {
    if (step === 'verification' && timeLeft > 0) {
      // 타이머를 설정하여 1초마다 timeLeft를 감소시킵니다.
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머를 정리합니다.
    } else if (timeLeft === 0) {
      // 시간이 만료되면 에러 메시지를 설정합니다.
      setError('인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.');
    }
  }, [step, timeLeft]); // step이나 timeLeft가 변경될 때마다 실행됩니다.

  // 전화번호를 형식에 맞게 포맷팅하는 함수입니다.
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, ''); // 숫자만 추출합니다.
    if (numbers.length <= 3) return numbers; // 3자리 이하일 때
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`; // 4~7자리일 때
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`; // 8자리 이상일 때
  };

  // 전화번호 입력값이 변경될 때 호출되는 함수입니다.
  const handlePhoneNumberChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value); // 입력값을 포맷팅합니다.
    setPhoneNumber(formattedNumber); // 포맷팅된 번호를 상태에 저장합니다.
  };

  // 폼 제출 시 호출되는 함수입니다.
  const handleSubmit = async (e) => {
    e.preventDefault(); // 기본 폼 제출 동작을 방지합니다.
    if (step === 'phone') {
      // 현재 단계가 'phone'이면 인증번호 전송 함수 호출
      await handleSendVerification();
    } else {
      // 현재 단계가 'verification'이면 인증번호 검증 함수 호출
      await handleVerify();
    }
  };

  // 인증번호를 전송하는 함수입니다.
  const handleSendVerification = async () => {
    setError(null); // 에러 메시지를 초기화합니다.
    const cleanNumber = phoneNumber.replace(/-/g, ''); // 하이픈을 제거하여 숫자만 남깁니다.
    if (cleanNumber.length !== 11) {
      // 전화번호가 11자리가 아니면 에러 메시지를 설정합니다.
      setError('올바른 전화번호를 입력해주세요.');
      return;
    }

    try {
      // 서버에 인증번호 전송 요청을 보냅니다.
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanNumber }),
      });
      const data = await response.json();
      if (response.ok) {
        // 인증번호 전송에 성공하면 단계와 타이머를 업데이트합니다.
        console.log('인증번호:', data.verificationCode); // 디버깅용 (실제 서비스에서는 제거해야 함)
        setStep('verification'); // 단계 변경
        setTimeLeft(180); // 타이머 초기화
      } else {
        // 서버에서 에러 메시지를 받으면 설정합니다.
        setError(data.message || '인증번호 발송에 실패했습니다.');
      }
    } catch (error) {
      // 요청 중 에러가 발생하면 에러 메시지를 설정합니다.
      console.error('Send verification error:', error);
      setError('서버 오류가 발생했습니다.');
    }
  };

  // 인증번호를 검증하는 함수입니다.
  const handleVerify = async () => {
    setError(null); // 에러 메시지를 초기화합니다.
    if (verificationCode.length !== 6) {
      // 인증번호가 6자리가 아니면 에러 메시지를 설정합니다.
      setError('올바른 인증번호를 입력해주세요.');
      return;
    }
  
    try {
      const cleanNumber = phoneNumber.replace(/-/g, ''); // 전화번호에서 하이픈 제거
      // 서버에 인증번호 검증 요청을 보냅니다.
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanNumber, verificationCode }),
      });
      const data = await response.json();
      if (response.ok) {
        // 인증에 성공하면 토큰을 저장하고 페이지를 이동합니다.
        localStorage.setItem('token', data.token); // 토큰을 로컬 스토리지에 저장
        router.push('/rooms'); // '/rooms' 페이지로 이동
      } else {
        // 인증에 실패하면 에러 메시지를 설정합니다.
        setError(data.message || '인증에 실패했습니다.');
      }
    } catch (error) {
      // 요청 중 에러가 발생하면 에러 메시지를 설정합니다.
      console.error('Verification error:', error);
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <LoginContainer>
        <LoginBox>
          <LogoWrapper>
            <Logo src={logo} alt="Logo" width={100} height={60} /> {/* 로고 이미지 */}
          </LogoWrapper>
          <Title>{step === 'phone' ? '전화번호 입력' : '인증번호 입력'}</Title>
          <Form onSubmit={handleSubmit}>
            {step === 'phone' ? ( // 현재 단계에 따라 다른 폼을 렌더링합니다.
              <>
                <InputLabel htmlFor="phoneNumber">휴대폰 번호</InputLabel>
                <InputField
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneNumberChange}
                  placeholder="전화번호 입력"
                  maxLength={13} // 전화번호 최대 길이 설정
                />
                <Button type="submit">인증번호 받기</Button>
              </>
            ) : (
              <>
                <InputLabel htmlFor="verificationCode">인증번호</InputLabel>
                <InputWrapper>
                  <InputField
                    id="verificationCode"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="인증번호 6자리 입력"
                    maxLength={6} // 인증번호 최대 길이 설정
                  />
                  <Timer>
                    {/* 남은 시간을 분:초 형식으로 표시합니다. */}
                    {`${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`}
                  </Timer>
                </InputWrapper>
                <Button type="submit">인증하기</Button>
                <ResendButton type="button" onClick={handleSendVerification}>인증번호 재발송</ResendButton>
              </>
            )}
          </Form>
          {error && <ErrorMessage>{error}</ErrorMessage>} {/* 에러 메시지를 표시합니다. */}
        </LoginBox>
      </LoginContainer>
    </ThemeProvider>
  );
};

// 스타일 컴포넌트를 정의합니다.
const LoginContainer = styled.div`
  display: flex;
  justify-content: center; // 수평 가운데 정렬
  align-items: center; // 수직 가운데 정렬
  height: 100vh; // 뷰포트 높이에 맞춤
  background-color: #f5f5f5; // 배경색 설정
`;

const LoginBox = styled.div`
  background-color: white; // 배경색 흰색
  padding: 2rem; // 패딩 설정
  border-radius: 8px; // 모서리를 둥글게
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); // 그림자 효과
  width: 350px; // 너비 설정
`;

const Form = styled.form`
  display: flex;
  flex-direction: column; // 세로로 정렬
`;

const InputWrapper = styled.div`
  width: 100%;
  position: relative; // 자식 요소의 절대 위치를 위해 필요
  margin-bottom: 1rem;
`;

const InputField = styled.input`
  padding: 0.75rem; // 내부 여백
  margin-bottom: 1rem;
  border: 1px solid #ddd; // 테두리 설정
  border-radius: 4px; // 모서리를 둥글게
  font-size: 1rem; // 글꼴 크기
  width: 324px; // 너비 100%

  &:focus {
    outline: none; // 포커스 시 기본 아웃라인 제거
    border-color: #4a90e2; // 포커스 시 테두리 색상 변경
  }
`;

const Timer = styled.span`
  position: absolute; // 부모 요소에 상대적인 위치
  right: 10px;
  top: 50%;
  transform: translateY(-50%); // 수직 가운데 정렬
  color: #4a90e2; // 글자 색상
  font-size: 0.9rem; // 글꼴 크기
`;

const Button = styled.button`
  width: 100%; // 너비 100%
  padding: 0.75rem; // 내부 여백
  background-color: #4a90e2; // 배경색
  color: white; // 글자색
  border: none; // 테두리 없음
  border-radius: 4px; // 모서리를 둥글게
  cursor: pointer; // 마우스 커서 변경
  font-size: 1rem; // 글꼴 크기
  transition: background-color 0.3s; // 배경색 전환 효과

  &:hover {
    background-color: #357ae8; // 호버 시 배경색 변경
  }
`;

const ResendButton = styled.button`
  width: 100%; // 너비 100%
  padding: 0.75rem;
  background-color: transparent; // 배경색 없음
  color: #4a90e2; // 글자색
  border: 1px solid #4a90e2; // 테두리 설정
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 0.5rem;
  transition: background-color 0.3s, color 0.3s; // 전환 효과

  &:hover {
    background-color: #4a90e2; // 호버 시 배경색 변경
    color: white; // 호버 시 글자색 변경
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c; // 에러 메시지 색상
  margin-top: 1rem;
  text-align: center; // 가운데 정렬
  font-size: 0.9rem;
`;

const LogoWrapper = styled.div`
  text-align: center; // 가운데 정렬
  margin-bottom: 1rem;
`;

const Logo = styled(Image)`
  display: inline-block; // 인라인 블록으로 표시
`;

const Title = styled.h1`
  margin-bottom: 1.5rem;
  text-align: left; // 왼쪽 정렬
  font-size: 1.5rem;
  color: #333; // 글자 색상
`;

const InputLabel = styled.label`
  display: block; // 블록 요소로 변경
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: #666; // 글자 색상
`;

export default LoginPage; // 컴포넌트를 내보냅니다.
