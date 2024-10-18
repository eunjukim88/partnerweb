// styles/GlobalStyles.js
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
  }

  html, body {
    height: 100%;
  }

  body {
    line-height: 1;
    background-color: ${({ theme }) => theme.colors.background};
    font-family: prentendard;
    color: #03222a;
  }

  ol, ul {
    list-style: none;
  }

  blockquote, q {
    quotes: none;
  }

  blockquote::before, blockquote::after,
  q::before, q::after {
    content: '';
  }

  table {
    border-collapse: collapse;
    border-spacing: 0;
  }

  button {
    border-radius: ${({ theme }) => theme.button.borderRadius};
    cursor: pointer;
  }`;

export default GlobalStyles;