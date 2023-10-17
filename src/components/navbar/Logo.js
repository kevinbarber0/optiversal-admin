/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Link from 'next/link';
import Image from 'next/image';
import logo from '../../assets/img/logo.png';

const Logo = ({ at, width, className, ...rest }) => {
  return (
    <Link href="/" legacyBehavior>
      <a
        className={classNames(
          'text-decoration-none',
          { 'navbar-brand text-left': at === 'navbar-vertical' },
          { 'navbar-brand text-left': at === 'navbar-top' },
        )}
      >
        <div
          className={classNames(
            'd-flex',
            {
              'align-items-center py-3': at === 'navbar-vertical',
              'align-items-center': at === 'navbar-top',
              'flex-center font-weight-extra-bold fs-5 mb-4': at === 'auth',
            },
            className,
          )}
        >
          <Image
            className="mr-2"
            src={logo}
            alt="Logo"
            width={190}
            height={42}
          />
        </div>
      </a>
    </Link>
  );
};

Logo.propTypes = {
  at: PropTypes.oneOf(['navbar-vertical', 'navbar-top', 'auth']),
  width: PropTypes.number,
  className: PropTypes.string,
};

Logo.defaultProps = { at: 'auth', width: 258 };

export default Logo;
