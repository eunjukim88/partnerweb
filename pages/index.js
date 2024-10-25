import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // 페이지 로드 시 로그인 페이지로 리다이렉트
    router.push('/login');
  }, []);

  // 리다이렉트 중에는 아무것도 렌더링하지 않음
  return null;
}