import React, { useEffect, useCallback } from 'react';
import { sendVerificationEmail } from '@util/api';
import { Alert, Button } from 'reactstrap';
import { toast } from 'react-toastify';
import PageLoader from '@components/PageLoader';
import { useAuth } from '@util/auth';
import SetPasswordForm from '@components/SetPasswordForm';

const AccountService = require('@services/accountService');

let isCalled = false;
let email_verified = null;

function EmailVerification({ token, tokenInfo }) {
  const auth = useAuth();

  const resendEmail = useCallback(async () => {
    const res = await sendVerificationEmail(token);
    if (res.success) {
      toast.success('An email has been sent to your email address');
    } else {
      toast.error(res.message);
    }
  }, [token]);

  useEffect(() => {
    if (isCalled) return;
    isCalled = true;

    if (tokenInfo && tokenInfo.success) {
      (async () => {
        await auth.signinWithToken(tokenInfo.token);
        toast.success('Your email has been verified');

        email_verified = true;
      })();
    } else {
      email_verified = false;
    }
  }, [tokenInfo, auth]);

  if (!tokenInfo || email_verified === null) {
    return <PageLoader />;
  }

  return email_verified ? (
    <SetPasswordForm auth={auth} />
  ) : (
    <Alert color="warning">
      <p>{tokenInfo.message}</p>
      {tokenInfo.expired && (
        <p className="mb-0">
          Click here to{' '}
          <Button color="link" className="p-0" onClick={resendEmail}>
            re-send
          </Button>{' '}
          the verification email.
        </p>
      )}
    </Alert>
  );
}

EmailVerification.showNav = false;

export async function getServerSideProps(context) {
  const { token } = context.params;
  const res = await AccountService.checkEmailToken(token);

  return {
    props: {
      token,
      tokenInfo: res,
    },
  };
}

export default EmailVerification;
