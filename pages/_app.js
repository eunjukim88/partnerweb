import { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../src/styles/golbalStyles';
import theme from '../src/styles/theme';
import RootLayout from '../src/core/App';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // 클라이언트 사이드에서만 실행되도록 합니다.
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      // 여기에 토큰 유효성 검사 로직을 추가할 수 있습니다.
    }
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <RootLayout>
        <Component {...pageProps} />
      </RootLayout>
    </ThemeProvider>
  );
}

export default MyApp;
