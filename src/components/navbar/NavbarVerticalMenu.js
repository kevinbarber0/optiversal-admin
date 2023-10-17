import React, { useContext } from 'react';
import { Nav, NavItem, NavLink } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppContext from '../../context/Context';
import Flex from '../common/Flex';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth, rolesMatch } from '@util/auth';
import { routes } from 'routes';

const renderRoute = (route, isActive, clickHandler) => (
  <NavItem className="p-2" key={route.href} active={isActive} onClick={clickHandler}>
    <NavLink className="nav-link" href={route.href}>
      <Flex align="center">
        <span className="nav-link-icon" style={{ marginRight: 10 }}>
          <FontAwesomeIcon icon={route.icon} />
        </span>
        <Link href={route.href}>
          <span className="nav-link-text">{route.title}</span>
        </Link>
      </Flex>
    </NavLink>
  </NavItem>
);

const NavbarVerticalMenu = () => {
  const auth = useAuth();
  const { asPath } = useRouter();
  const { setShowBurgerMenu } = useContext(AppContext);

  const clickHandler = () => setShowBurgerMenu(false);

  return (
    <>
      <Nav navbar vertical>
        {routes
          .filter(
            (route) =>
              route.roles === undefined ||
              (auth.user.roles && rolesMatch(route.roles, auth.user.roles)),
          )
          .map((route) => renderRoute(route, asPath.startsWith(route.href), clickHandler))}
      </Nav>
    </>
  );
};

export default NavbarVerticalMenu;
