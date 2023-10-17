import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Collapse,
  Navbar,
  Popover,
  PopoverBody,
  ListGroup,
  ListGroupItem,
} from 'reactstrap';
import is from 'is_js';
import classNames from 'classnames';
import Logo from './Logo';
import NavbarVerticalMenu from './NavbarVerticalMenu';
import AppContext from '../../context/Context';
import Flex from '../common/Flex';
import { navbarBreakPoint } from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFeatherAlt,
  faGifts,
  faFileAlt,
  faPencilAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useGetContentTemplates } from '@util/api';
import Router from 'next/router';

import bgNavbarImg from '../../assets/img/generic/bg-navbar.png';
import { rolesMatch, useAuth } from '@util/auth';
import { UserRole } from '@util/enum';
import { isUserLoaded } from '@helpers/auth';

const NavbarVertical = ({ navbarStyle }) => {
  const navBarRef = useRef(null);

  const {
    status,
    isLoading: contentTemplatesLoading,
    data: contentTemplatesResult,
  } = useGetContentTemplates(0, 1000);

  const {
    showBurgerMenu,
    isNavbarVerticalCollapsed,
    setIsNavbarVerticalCollapsed,
  } = useContext(AppContext);
  const [selectPageTypeOpen, setSelectPageTypeOpen] = useState(false);
  const togglePageType = () => setSelectPageTypeOpen(!selectPageTypeOpen);
  const auth = useAuth();

  const canCreatePage = useMemo(() => {
    return (
      isUserLoaded(auth) && rolesMatch([UserRole.EditPages], auth.user?.roles)
    );
  }, [auth]);

  let HTMLClassList = null;
  if (typeof window !== 'undefined') {
    HTMLClassList = document.getElementsByTagName('html')[0].classList;
  }
  //Control Component did mount and unmounted of hover effect
  if (isNavbarVerticalCollapsed) {
    HTMLClassList.add('navbar-vertical-collapsed');
  }

  useEffect(() => {
    if (is.windows()) {
      HTMLClassList.add('windows');
    }
    if (is.chrome()) {
      HTMLClassList.add('chrome');
    }
    if (is.firefox()) {
      HTMLClassList.add('firefox');
    }
    return () => {
      HTMLClassList.remove('navbar-vertical-collapsed-hover');
    };
  }, [isNavbarVerticalCollapsed, HTMLClassList]);

  //Control mouseEnter event
  let time = null;
  const handleMouseEnter = () => {
    if (isNavbarVerticalCollapsed) {
      time = setTimeout(() => {
        HTMLClassList.add('navbar-vertical-collapsed-hover');
      }, 100);
    }
  };

  const handleAddPageNav = (e, contentTemplateId) => {
    if (e) {
      e.preventDefault();
    }
    setSelectPageTypeOpen(false);
    Router.push('/page/add?ct=' + contentTemplateId);
  };

  return (
    <Navbar
      expand={navbarBreakPoint}
      className={classNames('navbar-vertical navbar-glass', {
        [`navbar-${navbarStyle}`]: navbarStyle !== 'transparent',
      })}
      light>
      <Flex align='center'>
        <Logo at='navbar-vertical' width={200} />
      </Flex>

      <Collapse
        navbar
        isOpen={showBurgerMenu}
        className='scrollbar'
        innerRef={navBarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => {
          clearTimeout(time);
          HTMLClassList.remove('navbar-vertical-collapsed-hover');
        }}
        style={
          navbarStyle === 'vibrant' && {
            backgroundImage: `linear-gradient(-45deg, rgba(0, 160, 255, 0.86), #0048a2),url(${bgNavbarImg})`,
          }
        }>
        <NavbarVerticalMenu />

        {canCreatePage && (
          <div className='settings px-3 px-xl-0'>
            <div className='navbar-vertical-divider'>
              <hr className='navbar-vertical-hr my-2' />
            </div>
            <Button
              color='primary'
              block
              id='openPageTypes'
              className='my-3 btn-purchase'>
              <FontAwesomeIcon icon={faFeatherAlt} />
              &nbsp;Create a Page
            </Button>
            <Popover
              placement='bottom'
              isOpen={selectPageTypeOpen}
              target='openPageTypes'
              toggle={togglePageType}
              trigger='legacy'>
              <PopoverBody>
                {contentTemplatesResult &&
                  contentTemplatesResult.contentTemplates && (
                    <>
                      <ListGroup>
                        {contentTemplatesResult.contentTemplates.map((ct) => (
                          <ListGroupItem
                            key={ct.contentTemplateId}
                            size='sm'
                            tag='button'
                            action
                            onClick={(e) =>
                              handleAddPageNav(e, ct.contentTemplateId)
                            }>
                            <FontAwesomeIcon
                              icon={
                                ct.name === 'Product Assortment'
                                  ? faGifts
                                  : faFileAlt
                              }></FontAwesomeIcon>{' '}
                            {ct.name}
                          </ListGroupItem>
                        ))}
                        <ListGroupItem
                          size='sm'
                          tag='button'
                          action
                          onClick={(e) => handleAddPageNav(e, '')}>
                          <FontAwesomeIcon icon={faPencilAlt}></FontAwesomeIcon>{' '}
                          Free-Form Page
                        </ListGroupItem>
                      </ListGroup>
                    </>
                  )}
              </PopoverBody>
            </Popover>
          </div>
        )}

        {/* </Scrollbar> */}
      </Collapse>
    </Navbar>
  );
};

NavbarVertical.protoTypes = {
  navbarStyle: PropTypes.string,
};

NavbarVertical.defaultProps = {
  navbarStyle: 'transparent',
};

export default NavbarVertical;
