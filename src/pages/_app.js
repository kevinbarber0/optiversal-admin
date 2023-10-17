import { useState, useRef } from 'react';
import 'styles/global.scss';
import DashboardLayout from '@components/layouts/DashboardLayout';
import 'util/analytics.js';
import { UserProvider } from '@auth0/nextjs-auth0';
import { ProvideAuth } from 'util/auth.js';
import '../helpers/initFA';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import 'tippy.js/dist/tippy.css';
import 'styles/optiversal.css';
import AppContext from '../context/Context';
import { QueryClientProvider } from 'react-query';
import { Hydrate } from 'react-query/hydration';
import { ReactQueryDevtools } from 'react-query/devtools';
import queryClient from '@util/query-client';

function MyApp({ Component, pageProps }) {
  const [isFluid, setIsFluid] = useState(false);
  const [isRTL, setIsRTL] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [isNavbarVerticalCollapsed, setIsNavbarVerticalCollapsed] =
    useState(false);
  const [currency, setCurrency] = useState('$');
  const [showBurgerMenu, setShowBurgerMenu] = useState(false);
  const [isOpenSidePanel, setIsOpenSidePanel] = useState(false);
  const [navbarStyle, setNavbarStyle] = useState('card');

  const queryClientRef = useRef();
  if (!queryClientRef.current) {
    queryClientRef.current = queryClient;
  }

  const toggleModal = () =>
    setIsOpenSidePanel((prevIsOpenSidePanel) => !prevIsOpenSidePanel);
  const value = {
    isRTL,
    isDark,
    isFluid,
    setIsRTL,
    currency,
    setIsDark,
    setIsFluid,
    toggleModal,
    navbarStyle,
    setCurrency,
    showBurgerMenu,
    setNavbarStyle,
    isOpenSidePanel,
    setShowBurgerMenu,
    setIsOpenSidePanel,
    isNavbarVerticalCollapsed,
    setIsNavbarVerticalCollapsed,
  };

  const Layout = Component.layout || DashboardLayout;
  const showNav =
    Component.showNav === null || typeof Component.showNav === 'undefined'
      ? true
      : Component.showNav;

  return (
    <QueryClientProvider client={queryClientRef.current}>
      <Hydrate state={pageProps.dehydratedState}>
        <AppContext.Provider value={value}>
          <UserProvider>
            <ProvideAuth>
              <Layout showNav={showNav}>
                <Component {...pageProps} />
                <ToastContainer pauseOnFocusLoss={false} newestOnTop={true} />
              </Layout>
            </ProvideAuth>
          </UserProvider>
        </AppContext.Provider>
      </Hydrate>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}

export default MyApp;
