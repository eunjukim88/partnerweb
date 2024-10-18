import styled from 'styled-components';
import Link from 'next/link';
import { IoMdLogOut } from 'react-icons/io';  

const Sidebar = ({ isOpen, toggleSidebar, handleLogout }) => {

  return (
    <>
      <Overlay isOpen={isOpen} onClick={toggleSidebar} />
      <SidebarContainer isOpen={isOpen}>
      <CloseButton onClick={toggleSidebar}>&times;</CloseButton>
        <MenuSection>
          <SidebarMenu>
            <li><Link href="/rooms" passHref legacyBehavior><MenuItem>객실현황</MenuItem></Link></li>
            <li><Link href="/reservations" passHref legacyBehavior><MenuItem>예약관리</MenuItem></Link></li>
            <li><Link href="/messages" passHref legacyBehavior><MenuItem>문자관리</MenuItem></Link></li>
            <li><Link href="/managers" passHref legacyBehavior><MenuItem>담당자 관리</MenuItem></Link></li>
            <li><Link href="/mypage" passHref legacyBehavior><MenuItem>마이페이지</MenuItem></Link></li>
          </SidebarMenu>
        </MenuSection>
        <LogoutSection>
          <LogoutButton onClick={handleLogout}>
            <IoMdLogOut />
            로그아웃
          </LogoutButton>
        </LogoutSection>
      </SidebarContainer>
    </>
  );
};

const Overlay = styled.div`
  position: fixed; // 고정 위치 설정
  top: 0; // 상단 고정
  left: 0; // 왼쪽 고정
  right: 0; // 오른쪽 고정
  bottom: 0; // 하단 고정
  background-color: rgba(0, 0, 0, 0.5); // 반투명 검은색 배경
  z-index: 1000; // z-index 설정으로 사이드바 아래에 위치
  opacity: ${props => props.isOpen ? 1 : 0}; // isOpen 상태에 따라 불투명도 설정
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'}; // isOpen 상태에 따라 가시성 설정
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); // 애니메이션 전환 설정
`;
const SidebarContainer = styled.nav`
  background-color: ${({ theme }) => theme.colors.sidebar}; // 테마의 사이드바 배경색 사용
  color: white; // 텍스트 색상을 흰색으로 설정
  width: 250px; // 사이드바 너비 설정
  height: 100vh; // 사이드바 높이를 전체 뷰포트 높이로 설정
  padding: 1rem; // 내부 여백 설정
  position: fixed; // 고정 위치 설정
  top: 0; // 상단 고정
  left: ${props => props.isOpen ? '0' : '-100%'}; // isOpen 상태에 따라 왼쪽 위치 조정
  z-index: 1001; // z-index 설정으로 다른 요소 위에 표시
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); // 애니메이션 전환 설정
  overflow-y: auto; // 세로 스크롤 허용
  display: flex; // 플렉스 박스 레이아웃 사용
  flex-direction: column; // 아이템들을 세로 방향으로 배치
  justify-content: space-between; // 아이템들을 위아래로 분산
  box-shadow: ${props => props.isOpen ? '2px 0 5px rgba(0,0,0,0.3)' : 'none'}; // isOpen 상태에 따라 그림자 효과 추가
`;

const CloseButton = styled.button`
  position: absolute; // 절대 위치 설정
  top: 10px; // 상단에서 10px 떨어짐
  right: 10px; // 오른쪽에서 10px 떨어짐
  background: none; // 배경 없음
  border: none; // 테두리 없음
  color: #535353; // 텍스트 색상 흰색
  font-size: 24px; // 폰트 크기 설정
  cursor: pointer; // 마우스 커서를 포인터로 변경
  transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); // 애니메이션 전환 설정
`;

const MenuSection = styled.div`
  padding: 20px;
`;

const SidebarMenu = styled.ul`
  margin-top: 60px; // 상단 여백 설정
  list-style: none; // 리스트 스타일 제거
  padding: 0; // 패딩 제거
  width: 100%; // 너비 100% 설정
`;

const MenuItem = styled.li`
  color: ${({ theme }) => theme.colors.buttonPrimary.background};
  margin-bottom: 20px;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
  position: relative;
  padding: 20px 0; // 좌우 패딩을 제거하고 상하 패딩만 유지
  transition: all 0.3s ease-in-out;
  overflow: hidden;
  text-align: center;
  width: 100%;
  display: flex; // Flexbox를 사용하여 내용을 중앙에 배치
  justify-content: center; // 가로 중앙 정렬
  align-items: center; // 세로 중앙 정렬

  &:hover {
    color: ${({ theme }) => theme.colors.buttonPrimary.background};
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%; // 왼쪽에서 10% 떨어진 위치에서 시작
    width: 80%; // 너비를 80%로 설정하여 양쪽에 여백 생성
    height: 100%;
    background-color: rgba(0, 0, 0, 0.1);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.4s ease-in-out;
    z-index: -1;
  }

  &:hover::before {
    transform: scaleX(1);
  }
`;


const LogoutSection = styled.div`
  position: absolute;
  bottom: 100px;
  left: 20px;
  right: 20px;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 10px;
  background-color: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  color: #333;
  font-size: 16px;
  font-weight : 800;
  cursor: pointer;
  transition: all 0.3s ease-in-out; // 애니메이션 전환 설정
  &:hover { // 호버 상태 스타일
    background-color: rgba(255, 255, 255, 0.1); // 배경색 반투명 흰색으로 변경
    color: ${({ theme }) => theme.colors.buttonQuaternary.background}; // 텍스트 색상 테마의 4차 버튼 배경색으로 변경
  }
`;

export default Sidebar;