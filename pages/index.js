import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      // 토큰이 없으면 로그인 페이지로
      router.push('/login');
    } else {
      // 토큰이 있으면 예약 관리 페이지로
      router.push('/reservations');
    }
  }, [router]);

  return null;
}