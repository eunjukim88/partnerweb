'use client';

import { useEffect } from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyles from '../src/styles/golbalStyles';
import theme from '../src/styles/theme';
import RootLayout from '../src/core/App';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
    }
  }, []);

  const isLoginPage = Component.name === 'LoginPage';

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      {isLoginPage ? (
        <Component {...pageProps} />
      ) : (
        <RootLayout>
          <Component {...pageProps} />
        </RootLayout>
      )}
    </ThemeProvider>
  );
}

export default MyApp;
