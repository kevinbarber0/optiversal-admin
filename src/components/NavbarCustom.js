import React from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import Link from 'next/link';
import Nav from 'react-bootstrap/Nav';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Dropdown from 'react-bootstrap/Dropdown';
import Image from 'next/image';
import { useAuth } from 'util/auth.js';

function NavbarCustom(props) {
  const auth = useAuth();

  return (
    <Navbar bg={props.bg} variant={props.variant} expand={props.expand}>
      <Container>
        <Link href="/" passHref>
          <Navbar.Brand>
            <Image
              className="d-inline-block align-top"
              src={props.logo}
              alt="Logo"
              height="30"
            ></Image>
          </Navbar.Brand>
        </Link>

        <Navbar.Toggle
          aria-controls="navbar-nav"
          className="border-0"
        ></Navbar.Toggle>
        <Navbar.Collapse id="navbar-nav" className="justify-content-end">
          <Nav>
            {auth.user && (
              <NavDropdown id="dropdown" title="Account" alignRight={true}>
                <Link href="/dashboard" passHref>
                  <NavDropdown.Item active={false}>Dashboard</NavDropdown.Item>
                </Link>

                <Link href="/settings/general" passHref>
                  <NavDropdown.Item active={false}>Settings</NavDropdown.Item>
                </Link>

                <Dropdown.Divider></Dropdown.Divider>

                <Link href="/api/auth/logout" passHref>
                  <NavDropdown.Item active={false}>Sign out</NavDropdown.Item>
                </Link>
              </NavDropdown>
            )}

            {!auth.user && (
              <Nav.Item>
                <Link href="/api/auth/login" legacyBehavior>
                  <a>Sign In</a>
                </Link>
              </Nav.Item>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarCustom;
