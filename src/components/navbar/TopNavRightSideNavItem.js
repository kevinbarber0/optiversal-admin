import React from 'react';
import { Nav } from 'reactstrap';
import ProfileDropdown from './ProfileDropdown';
import { useAuth } from '@util/auth.js';

const TopNavRightSideNavItem = () => {
  const auth = useAuth();
  return (
    <Nav
      navbar
      className="navbar-nav-icons ml-auto flex-row align-items-center"
    >
      <ProfileDropdown
        user={auth.user}
        organization={auth.getSelectedOrganization()}
        selectOrganization={auth.selectOrganization}
      />
    </Nav>
  );
};

export default TopNavRightSideNavItem;
