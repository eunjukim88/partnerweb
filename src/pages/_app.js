import RootLayout from '../core/App';
import GlobalStyles from '../styles/golbalStyles';

function MyApp({ Component, pageProps }) {
  return (
    <RootLayout>
      <GlobalStyles />
      <Component {...pageProps} />
    </RootLayout>
  );
}

export default MyApp;