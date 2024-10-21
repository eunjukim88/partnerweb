import styled from 'styled-components';
import theme from '../../styles/theme';

export const Button = styled.button`
  background-color: ${theme.colors.buttonPrimary.background};
  color: ${theme.colors.buttonPrimary.text};
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonPrimary.hover};
  }
`;

export const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

export const Input = styled.input`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
`;

export const PaginationButtons = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 20px;
`;

export const PaginationButton = styled.button`
  background-color: ${props => props.active ? theme.colors.buttonPrimary.background : 'white'};
  color: ${props => props.active ? theme.colors.buttonPrimary.text : theme.colors.buttonSecondary.text};
  border: 1px solid ${theme.colors.buttonSecondary.border};
  padding: 5px 10px;
  margin: 0 5px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: ${theme.colors.buttonSecondary.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <PaginationButtons>
      <PaginationButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        &lt;
      </PaginationButton>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
        <PaginationButton
          key={page}
          onClick={() => onPageChange(page)}
          active={currentPage === page}
        >
          {page}
        </PaginationButton>
      ))}
      <PaginationButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        &gt;
      </PaginationButton>
    </PaginationButtons>
  );
};
