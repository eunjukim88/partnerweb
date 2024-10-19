import styled from 'styled-components';
import theme from '../../styles/theme';

export const TabMenu = styled.div`
  display: flex;
  margin-bottom: 20px;
`;

export const TabButton = styled.button`
  background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'transparent'};
  color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.buttonSecondary.text};
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 16px;
  font-weight: bold;

  &:hover {
    background-color: ${props => props.active ? theme.colors.buttonPrimary.hover : theme.colors.buttonSecondary.hover};
  }
`;