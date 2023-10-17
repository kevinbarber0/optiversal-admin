import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Link from 'next/link';

function SettingsNav(props) {
  return (
    <Nav variant="pills" {...props}>
      <Nav.Item>
        <Link href="/settings/general" passHref>
          <Nav.Link eventKey="general">General</Nav.Link>
        </Link>
      </Nav.Item>
      <Nav.Item>
        <Link href="/settings/password" passHref>
          <Nav.Link eventKey="password">Password</Nav.Link>
        </Link>
      </Nav.Item>
      <Nav.Item>
        <Link href="/settings/billing" passHref>
          <Nav.Link eventKey="billing">Billing</Nav.Link>
        </Link>
      </Nav.Item>
    </Nav>
  );
}

export default SettingsNav;
