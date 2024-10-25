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
  flex-end: 1;
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

export const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 60px;
  height: 34px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: .4s;
    border-radius: 34px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 5px;
    font-size: 12px;
    color: white;

    &:before {
      content: "";
      position: absolute;
      height: 26px;
      width: 26px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
      z-index: 2;
    }

    &:after {
      content: 'OFF';
      position: absolute;
      right: 8px;
    }
  }

  input:checked + span {
    background-color: #3395FF;

    &:after {
      content: 'ON';
      left: 8px;
    }
  }

  input:checked + span:before {
    transform: translateX(26px);
  }
`;

export const Checkbox = styled.label`
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  margin-right: 10px;

  input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  span {
    position: relative;
    display: inline-block;
    width: 18px;
    height: 18px;
    margin-right: 8px;
    border: 2px solid ${theme.colors.buttonPrimary.background};
    border-radius: 3px;
    transition: all 0.3s ease;

    &:after {
      content: '';
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }

  input:checked + span {
    background-color: ${theme.colors.buttonPrimary.background};
    border-color: ${theme.colors.buttonPrimary.background};

    &:after {
      display: block;
    }
  }
`;
