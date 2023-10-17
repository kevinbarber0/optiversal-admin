import React, { useEffect, useState } from 'react';
import { requireAuth, useAuth } from '@util/auth';
import { useRouter } from 'next/router';
import { Alert, Button } from 'reactstrap';
import PageLoader from '@components/PageLoader';
import { resendVerificationEmail } from '@util/api';
import { toast } from 'react-toastify';

function VerifyEmail() {
  const auth = useAuth();
  const router = useRouter();

  const [isExpired, setIsExpired] = useState(false);
  const [working, setWorking] = useState(false);

  if (auth.user && auth.user.email_verified) {
    router.push('/pages');
  }

  useEffect(() => {
    const { query } = router;
    if (query?.expired) {
      setIsExpired(true);
    } else {
      setIsExpired(false);
    }
  }, [router]);

  const onResend = async () => {
    setWorking(true);
    const res = await resendVerificationEmail();
    if (res.success) {
      setIsExpired(false);
      router.push('/verify-email');
    } else {
      toast.error('User info could not be updated.', {
        theme: 'colored',
      });
    }
    setWorking(false);
  };

  return (
    <>
      {auth.isLoading && <PageLoader />}
      {auth.user && !isExpired && (
        <Alert color="warning">
          <p>
            An email has been sent to{' '}
            <a
              href={`mailto:${auth.user.email}`}
              target="_blank"
              rel="noreferrer"
            >
              {auth.user.email}
            </a>{' '}
            with a link to verify your account. Please follow the link in your
            email to activate your account.
          </p>
        </Alert>
      )}
      {auth.user && isExpired && (
        <Alert color="warning">
          <p>
            Your verifiction link has expired.
            <br />
            Please click below to request a new verification email.
          </p>
          <Button color="primary" onClick={onResend} disabled={working}>
            Resend
          </Button>
        </Alert>
      )}
    </>
  );
}

const Component = requireAuth(VerifyEmail, false);

Component.showNav = false;

export default Component;
