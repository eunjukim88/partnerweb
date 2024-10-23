import styled from 'styled-components';
import { FaTools } from 'react-icons/fa';

const UserGuide = () => {
  return (
    <Container>
      <Icon>
        <FaTools size={50} />
      </Icon>
      <Message>개발 중입니다.</Message>
    </Container>
  );
};

export default UserGuide;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
`;

const Icon = styled.div`
  margin-bottom: 20px;
  color: #666;
`;

const Message = styled.h2`
  font-size: 24px;
  color: #333;
`;