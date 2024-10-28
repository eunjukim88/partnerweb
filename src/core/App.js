"use client";

import React from 'react';
import styled from 'styled-components';
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
  const [isLoggedIn, setIsLoggedIn] = useState(null); // 초기값을 null로 설정
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return; // 라우터가 준비되지 않았으면 아무 작업도 하지 않음.

    const checkLoginStatus = () => {
      const storedToken = localStorage.getItem('token');
      const loggedIn = !!storedToken;
      setIsLoggedIn(loggedIn);

      if (!loggedIn && router.pathname !== '/login') {
        router.push('/login');
      }
    };

    checkLoginStatus();
  }, [router.isReady, router.pathname]);

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

  if (isLoggedIn === null || !router.isReady) {
    return null; // 로딩 중일 때는 아무것도 렌더링하지 않음.
  }

  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        {isLoggedIn && router.pathname !== '/' && router.pathname !== '/login' && (
          <Header 
            toggleSidebar={toggleSidebar} 
            onOpenReservationModal={handleOpenReservationModal}
            isLoggedIn={isLoggedIn}
          />
        )}
        {isLoggedIn && router.pathname !== '/' && router.pathname !== '/login' && (
          <Sidebar 
            isOpen={isSidebarOpen} 
            toggleSidebar={toggleSidebar}
            handleLogout={handleLogout}
          />
        )}
        {isReservationModalOpen && (
          <ReservationModal 
            onClose={handleCloseReservationModal} 
            onSave={handleSaveReservation}
          />
        )}
        <main style={{ marginTop: (isLoggedIn && router.pathname !== '/' && router.pathname !== '/login') ? '80px' : '0' }}>
          {children}
        </main>
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
}
