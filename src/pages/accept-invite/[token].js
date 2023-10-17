import React, { useCallback, useEffect } from 'react';
import { Alert, Button } from 'reactstrap';
import { toast } from 'react-toastify';

import PageLoader from '@components/PageLoader';
import { useAuth } from '@util/auth';
import { sendVerificationEmail } from '@util/api';
import SetPasswordForm from '@components/SetPasswordForm';

const AccountService = require('@services/accountService');

function AcceptInvite({ token, tokenInfo }) {
  const auth = useAuth();

  const resendEmail = useCallback(async () => {
    await sendVerificationEmail(token);
    toast.success('An email has been sent to your email address');
  }, [token]);

  useEffect(() => {
    if (tokenInfo && tokenInfo.success) {
      (async () => {
        await auth.signinWithToken(tokenInfo.token);
      })();
    }
  }, [tokenInfo, auth]);

  if (!tokenInfo) {
    return <PageLoader />;
  }

  if (!tokenInfo.success) {
    return (
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
  } else if (auth.user) {
    return <SetPasswordForm auth={auth} />;
  } else {
    return <PageLoader />;
  }
}

AcceptInvite.showNav = false;

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

export default AcceptInvite;
