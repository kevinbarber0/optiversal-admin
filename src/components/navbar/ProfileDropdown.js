import React, { useState } from 'react';
import Link from 'next/link';
import {
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Dropdown,
} from 'reactstrap';

import team3 from '../../assets/img/team/avatar.png';
import Avatar from '../common/Avatar';
import Select from '@components/common/Select';

const ProfileDropdown = (props) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toggle = () => setDropdownOpen((prevState) => !prevState);
  let email = props.user ? props.user.email : '';
  const organizationOptions = (props.user?.organizations || []).map((org) => ({
    label: org.name,
    value: org.organizationId,
  }));

  const selectedOption = organizationOptions.find(
    ({ value }) => value === props.organization,
  );

  if (
    !email &&
    props.user &&
    props.user.providerData &&
    props.user.providerData.length > 0
  ) {
    email = props.user.providerData[0].email;
  }
  return (
    <Dropdown
      nav
      inNavbar
      isOpen={dropdownOpen}
      toggle={toggle}
      onMouseOver={() => {
        let windowWidth = window.innerWidth;
        windowWidth > 992 && setDropdownOpen(true);
      }}
      onMouseLeave={() => {
        let windowWidth = window.innerWidth;
        windowWidth > 992 && setDropdownOpen(false);
      }}
    >
      <DropdownToggle nav className="pr-0">
        <Avatar src={props.user?.picture ? props.user.picture : team3} />
      </DropdownToggle>
      <DropdownMenu right className="dropdown-menu-card">
        {props.user && (
          <div
            className="bg-white rounded-soft py-2"
            style={{ cursor: 'pointer' }}
          >
            <DropdownItem>Logged in as {props.user ? email : ''}</DropdownItem>
            {/* <DropdownItem> */}
            <Select
              isAsync={false}
              options={organizationOptions}
              value={selectedOption}
              onChange={({ value }) => props.selectOrganization(value)}
            />
            <DropdownItem>
              <Link href="/profile/" legacyBehavior>
                <a>Profile</a>
              </Link>
            </DropdownItem>
            <DropdownItem>
              <Link href="/api/auth/logout" legacyBehavior>
                <a>Sign Out</a>
              </Link>
            </DropdownItem>
          </div>
        )}
        {!props.user && (
          <div
            className="bg-white rounded-soft py-2"
            style={{ cursor: 'pointer' }}
          >
            <DropdownItem>
              <Link href="/api/auth/login" legacyBehavior>
                <a>Sign In</a>
              </Link>
            </DropdownItem>
          </div>
        )}
      </DropdownMenu>
    </Dropdown>
  );
};

export default ProfileDropdown;
