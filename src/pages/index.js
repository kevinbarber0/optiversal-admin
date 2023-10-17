import React, { useEffect } from 'react';

import { useAuth } from '@util/auth.js';
import PageLoader from '@components/PageLoader';
import { useRouter } from 'next/router';
// https://stg-app.optiversal.com/?message=Access%20expired.&success=false

function IndexPage() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    const { query } = router;
    if (query?.message && query.message === 'Access expired.') {
      router.push('/verify-email?expired=true');
    }
  }, [router]);

  useEffect(() => {
    if (!auth.user) router.push('/api/auth/login');
    else if (
      (auth.user && auth.user.email_verified) ||
      (auth.user && auth.user.providers.includes('oidc'))
    ) {
      router.push('/pages');
    } else if (auth.user && !auth.user.email_verified) {
      router.push('/verify-email');
    }
  }, []);

  return <>{auth.isLoading && <PageLoader />}</>;
}

export default IndexPage;
