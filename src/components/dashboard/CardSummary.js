import React from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Card, CardBody } from 'reactstrap';
import Link from 'next/link';
import Background from '../common/Background';
import corner1 from '../../assets/img/illustrations/corner-1.png';
import corner2 from '../../assets/img/illustrations/corner-2.png';
import corner3 from '../../assets/img/illustrations/corner-3.png';
import classNames from 'classnames';

const getImage = (color) => {
  switch (color) {
    case 'warning':
      return corner1;
    case 'info':
      return corner2;
    case 'success':
      return corner3;
    default:
      return corner1;
  }
};

const getContentClassNames = (color, size) => {
  const contentClassNames =
    'display-4 ' +
    (size && size === 'sm' ? 'fs-1' : 'fs-4') +
    ' font-weight-normal text-sans-serif';
  if (color === 'success') return contentClassNames;
  return `${contentClassNames} text-${color}`;
};

const CardSummary = ({
  title,
  rate,
  linkText,
  to,
  color,
  children,
  size,
  style,
  className,
}) => {
  const finalStyle = { ...{ mindWidth: '12rem' }, ...style };
  return (
    <Card
      className={classNames(
        className,
        className?.includes('mb') ? '' : 'mb-3',
        'overflow-hidden',
      )}
      style={finalStyle}
    >
      <Background image={getImage(color)} className="bg-card" />
      <CardBody className="position-relative d-flex flex-column justify-content-center">
        <h6>
          {title}
          <span className={`badge badge-soft-${color} rounded-capsule ml-2`}>
            {rate}
          </span>
        </h6>
        <div className={getContentClassNames(color, size)}>{children}</div>
        {linkText && (
          <Link
            className="mt-2 font-weight-semi-bold fs--1 text-nowrap"
            href={to}
            legacyBehavior
          >
            <a>
              {linkText}
              <FontAwesomeIcon
                icon="angle-right"
                transform="down-1.5"
                className="ml-1"
              />
            </a>
          </Link>
        )}
      </CardBody>
    </Card>
  );
};

CardSummary.propTypes = {
  title: PropTypes.string.isRequired,
  rate: PropTypes.string,
  linkText: PropTypes.string,
  to: PropTypes.string,
  color: PropTypes.string,
  children: PropTypes.node,
};

CardSummary.defaultProps = {
  linkText: null,
  to: '#!',
  color: 'primary',
};

export default CardSummary;
