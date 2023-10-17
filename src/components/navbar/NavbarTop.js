import React, { useContext } from 'react';
import { Navbar } from 'reactstrap';
import classNames from 'classnames';
import AppContext from '../../context/Context';
import Logo from './Logo';
import TopNavRightSideNavItem from './TopNavRightSideNavItem';
import { navbarBreakPoint } from '../../config';

const NavbarTop = (props) => {
  const { showBurgerMenu, setShowBurgerMenu } = useContext(AppContext);

  return (
    <Navbar
      light
      className="navbar-glass fs--1 font-weight-semi-bold row navbar-top sticky-kit"
      expand={navbarBreakPoint}
    >
      <div
        className={classNames('toggle-icon-wrapper mr-md-3 mr-2', {
          [`d-${navbarBreakPoint}-none`]: true,
        })}
      >
        <button
          className="navbar-toggler-humburger-icon btn btn-link d-flex align-item-center justify-content-center "
          onClick={() => {
            setShowBurgerMenu(!showBurgerMenu);
          }}
          id="burgerMenu"
        >
          <span className="navbar-toggle-icon">
            <span className="toggle-line" />
          </span>
        </button>
      </div>
      <Logo at="navbar-top" width={200} id="topLogo" />
      <TopNavRightSideNavItem />
    </Navbar>
  );
};

export default NavbarTop;
