import { useCallback, useState } from 'react';
import useScript from '../hooks/useScript';
import { Button } from 'reactstrap';

function CustomGoogleSignIn({ onSingInSuccess }) {
  const text = 'Connect with Google';
  const [client, setClient] = useState();

  const onResponse = (response) => {
    onSingInSuccess(response);
  };

  const getAuthCode = useCallback(() => {
    if (!client) return;
    client.requestCode();
  }, [client]);

  useScript('https://accounts.google.com/gsi/client', () => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      ux_mode: 'popup',
      callback: onResponse,
    });

    setClient(client);
  });

  return (
    <Button color="primary" className="google_signin" onClick={getAuthCode}>
      {text}
    </Button>
  );
}

function CustomGoogleSignOut({ onSingOut }) {
  const text = 'Disconnect Google';
  return (
    <Button color="danger" onClick={onSingOut}>
      {text}
    </Button>
  );
}

export { CustomGoogleSignIn, CustomGoogleSignOut };
