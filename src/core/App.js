"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'styled-components';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import StyledComponentsRegistry from '../lib/registry';
import theme from '../styles/theme';
import ReservationModal from '../components/reservations/ReservationModal';

export default function RootLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkLoginStatus = () => {
      const storedToken = localStorage.getItem('token');
      console.log('Token:', storedToken); // 디버깅용
      const loggedIn = !!storedToken;
      setIsLoggedIn(loggedIn);

      if (!loggedIn && router.pathname !== '/login') {
        console.log('Not logged in, redirecting to login');
        router.push('/login');
      } else if (loggedIn && router.pathname === '/login') {
        console.log('Already logged in, redirecting to rooms');
        router.push('/rooms');
      }
    };

    checkLoginStatus();
  }, [router.pathname]);

  const toggleSidebar = () => {
    console.log('toggleSidebar called');
    setIsSidebarOpen(prevState => !prevState);
  };

  const handleLogout = () => {
    console.log('로그아웃');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/login');
  };

  const handleOpenReservationModal = () => {
    setIsReservationModalOpen(true);
  };

  const handleCloseReservationModal = () => {
    setIsReservationModalOpen(false);
  };

  const handleSaveReservation = (formData) => {
    // 여기에 예약 저장 로직 추가
    console.log('Saving reservation:', formData);
    setIsReservationModalOpen(false);
  };

  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        {isLoggedIn && router.pathname !== '/login' && (
          <>
            <Header 
              toggleSidebar={toggleSidebar} 
              onOpenReservationModal={handleOpenReservationModal}
            />
            <Sidebar 
              isOpen={isSidebarOpen} 
              toggleSidebar={toggleSidebar}
              handleLogout={handleLogout}
            />
            {isReservationModalOpen && (
              <ReservationModal 
                onClose={handleCloseReservationModal} 
                onSave={handleSaveReservation}
              />
            )}
          </>
        )}
        <main style={{ marginTop: isLoggedIn && router.pathname !== '/login' ? '80px' : '0' }}>
          {children}
        </main>
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
}
