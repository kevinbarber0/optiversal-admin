import React from 'react';
import 'components/BackgroundImage.module.scss';

function BackgroundImage(props) {
  return (
    <div
      className={'BackgroundImage' + (props.repeat ? ' repeat' : '')}
      style={{
        '--image': `url(${props.image})`,
        '--opacity': props.opacity,
      }}
    ></div>
  );
}

export default BackgroundImage;
