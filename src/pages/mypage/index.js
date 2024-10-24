import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from 'styled-components';
import theme from '../../styles/theme';
// 각 페이지 컴포넌트를 import합니다
import UserGuide from '../../components/mypage/UserGuide';
import RoomSettings from '../../components/mypage/RoomSettings';
import ReservationSettings from '../../components/mypage/ReservationSettings';

const MyPage = () => {
  const router = useRouter();
  const { section = 'user-guide' } = router.query;

  const menuItems = [
    { id: 'user-guide', name: '사용자 안내 설정' },
    { id: 'room-settings', name: '객실 설정' },
    { id: 'reservation-settings', name: '기본 예약 설정' },
    { id: 'special-date-settings', name: '특정 예약 날짜 설정' },
  ];

  const renderContent = () => {
    switch (section) {
      case 'user-guide':
        return <UserGuide />;
      case 'room-settings':
        return <RoomSettings />;
      case 'reservation-settings':
        return <ReservationSettings />;
      case 'special-date-settings':
        return <div>특정 예약 날짜 설정</div>;
      default:
        return <div>잘못된 섹션입니다.</div>;
    }
  };

  return (
    <PageWrapper>
      <PageContainer>
        <LeftSection>
          <Title>마이페이지</Title>
          <MenuList>
            {menuItems.map((item) => (
              <MenuItem key={item.id} isSelected={section === item.id}>
                <Link href={`/mypage?section=${item.id}`}>
                  {item.name}
                </Link>
              </MenuItem>
            ))}
          </MenuList>
        </LeftSection>
        <RightSection>{renderContent()}</RightSection>
      </PageContainer>
    </PageWrapper>
  );
};

export default MyPage;

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
  overflow: hidden;
`;

const PageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70vw;
  height: 80vh;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const LeftSection = styled.div`
  width: 200px;
  height: 100%;
  padding: 15px 0px 15px 15px;
  background-color: #3395FF;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 40px 0 40px 0;
  color: #333;
  font-weight: 700;
  text-align: center;
  color: #FFFFFF;
`;

const MenuList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const MenuItem = styled.li`
  margin-bottom: 10px;
  display: flex;
  justify-content: flex-end;
  align-items: center;

  a {
    display: block;
    padding: 10px 10px;
    text-decoration: none;
    color: ${props => props.isSelected ? '#3395FF' : '#FFFFFF'};
    background-color: ${props => props.isSelected ? '#FFFFFF' : 'transparent'};
    border-radius: 20px 0px 0px 20px;
    font-weight: ${props => props.isSelected ? '700' : '400'};
    height: 60px;
    width: 180px;
    margin: 10px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.3s ease;

    &:hover {
      background-color: ${props => props.isSelected ? theme.colors.buttonPrimary.hover : 'rgba(0, 0, 0, 0.1)'};
    }
  }
`;

const RightSection = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  height: 100%;
`;
