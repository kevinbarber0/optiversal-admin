import React, { useEffect } from 'react';
import Router from 'next/router';
import { createCookie } from '@helpers/utils';

function Logout() {
  useEffect(() => {
    createCookie('orgId', '');
    Router.push('/api/auth/login');
  }, []);

  return <></>;
}

Logout.showNav = false;

export default Logout;
