import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrashAlt,
  faCheck,
  faUndo,
} from '@fortawesome/free-solid-svg-icons';
import { Input } from 'reactstrap';

function ContentSection(props) {
  const [editedCopy, setEditedCopy] = useState(props.copy || '');
  const [isEditing, setIsEditing] = useState(props.copy === '[BLANK]');

  return (
    <>
      {isEditing ? (
        <>
          <Input
            type="textarea"
            rows={2}
            defaultValue={props.copy === '[BLANK]' ? '' : props.copy}
            onChange={({ target }) => setEditedCopy(target.value)}
          />{' '}
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              props.setData(props.index, editedCopy);
              setIsEditing(false);
            }}
          />{' '}
          &nbsp;{' '}
          <FontAwesomeIcon
            icon={faUndo}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(false);
            }}
          />
        </>
      ) : (
        <>
          <span dangerouslySetInnerHTML={{ __html: props.copy }}></span>{' '}
          <FontAwesomeIcon
            icon={faEdit}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
          />{' '}
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              props.deleteData(props.index);
              setIsEditing(false);
            }}
          />
        </>
      )}
      <br />
    </>
  );
}

export default ContentSection;
