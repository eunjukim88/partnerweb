import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from 'styled-components';
import theme from '../../src/styles/theme';

import UserGuide from '../../src/components/mypage/UserGuide';
import RightSectionContent from '../../src/components/mypage/MyPage';

const MyPage = () => {
  const router = useRouter();
  const { section = 'user-guide' } = router.query;

  const menuItems = [
    { id: 'user-guide', name: '사용자 안내 설정' },
    { id: 'room-settings', name: '객실 설정' },
    { id: 'reservation-settings', name: '기본 예약 설정' },
  ];

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
        <RightSection>
          <RightSectionContent />
        </RightSection>
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
  background-color: #E6F0FF;
  display: flex;
  flex-direction: column;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 40px 0 40px 0;
  color: #333;
  font-weight: 800;
  text-align: center;
  color: #171f26;
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
    color: ${props => props.isSelected ? '#3395FF' : '#171f26'};
    background-color: ${props => props.isSelected ? '#FFFFFF' : 'transparent'};
    border-radius: 20px 0px 0px 20px;
    border-left: ${props => props.isSelected ? '2px solid #3395FF' : 'none'};
    border-top: ${props => props.isSelected ? '2px solid #3395FF' : 'none'};
    border-bottom: ${props => props.isSelected ? '2px solid #3395FF' : 'none'};
    font-weight: ${props => props.isSelected ? '700' : '400'};
    height: 60px;
    width: 180px;
    margin: 10px 0;
    display: flex;
    justify-content: center;
    align-items: center;

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
