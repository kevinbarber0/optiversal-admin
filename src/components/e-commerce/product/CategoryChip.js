import React from 'react';
import { Badge, Button } from 'reactstrap';
import ButtonIcon from '../../common/ButtonIcon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CategoryChip = ({ color, text, handleClick }) => {
  return (
    <>
      {text}&nbsp;
      <ButtonIcon
        color={color}
        icon="times"
        iconAlign="right"
        transform="shrink-3"
        size="sm"
        style={{ padding: 4, paddingTop: 0, paddingBottom: 0 }}
        className="rounded-capsule fs--2"
        onClick={(e) => handleClick(text)}
      >
      </ButtonIcon>
    </>
  );
};

export default CategoryChip;
