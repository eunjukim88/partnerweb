"use client";
import styled from 'styled-components';
import Image from 'next/image';
import { IoMenuOutline } from "react-icons/io5";

const Header = ({ toggleSidebar, onOpenReservationModal, isLoggedIn }) => {
  const handleReservationClick = () => {
    if (onOpenReservationModal) {
      onOpenReservationModal();
    } else {
      console.warn('onOpenReservationModal function is not provided');
    }
  };

  return (
    <StyledHeader>
      {isLoggedIn && (
        <MenuIcon onClick={toggleSidebar}>
          <IoMenuOutline size={35} />
        </MenuIcon>
      )}
      <Logo src="/logo.svg" alt="Logo" width={100} height={60} />
      {isLoggedIn && (
        <ButtonContainer>
          <HeaderButton>공지사항</HeaderButton>
          <HeaderButton>매출</HeaderButton>
          <HeaderButton onClick={handleReservationClick}>예약등록</HeaderButton>
        </ButtonContainer>
      )}
    </StyledHeader>
  );
};

const MenuIcon = styled.div`
  cursor: pointer;
  z-index: 1001;
`;

const StyledHeader = styled.header`
  background-color: ${({ theme }) => theme.colors.navbar};
  padding: 5px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  z-index: 1000;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Logo = styled(Image)`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const HeaderButton = styled.button`
  padding: 10px 20px;
  background-color: ${({ theme }) => theme.colors.buttonQuaternary.background};
  color: ${({ theme }) => theme.colors.buttonPrimary.text};
  border: none;
  border-radius: ${({ theme }) => theme.button.borderRadius};
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 14px;

  &:hover {
    background-color: ${({ theme }) => theme.colors.buttonTertiary.background};
  }
`;

export default Header;
