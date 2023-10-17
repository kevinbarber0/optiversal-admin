import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrashAlt,
  faCheck,
  faUndo,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import { setProductContent, addProductTranslation } from '@util/api';
import { Button, Input } from 'reactstrap';
import FilterSelect from '@components/FilterSelect';
import { toast } from 'react-toastify';

function ProductCopy(props) {
  const [editedCopy, setEditedCopy] = useState(props.copy.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [working, setWorking] = useState(false);

  const editProductCopy = async (type, newCopy) => {
    const copy = props.allProductCopy[type];
    copy[props.contentId].content = newCopy;
    await setProductContent(props.sku, type, copy);
    setIsEditing(false);
  };

  const deleteProductCopy = async (type) => {
    const copy = props.allProductCopy[type];
    delete copy[props.contentId];
    await setProductContent(props.sku, type, copy);
  };

  const sendTranslationRequest = async (
    type,
    languageCode,
    language,
    content,
  ) => {
    const data = {
      contentType: props.type,
      contentId: props.contentId,
      language: language,
      languageCode: languageCode,
      type: type,
      content: content,
    };
    await addProductTranslation(props.sku, data);
    setWorking(false);
    setLanguages([]);
  };

  const handleMachineTranslateClick = () => {
    if (!languages || languages.length < 1) {
      toast.error('Please select at least one language to translate to');
    }
    setWorking(true);
    const content = props.copy.content;
    if (content && content.trim().length > 0) {
      languages.forEach((lang) => {
        sendTranslationRequest('machine', lang.value, lang.label, content);
      });
    } else {
      toast.error('No content found to translate');
    }
  };

  const options = [
    { value: 'da', label: 'Danish' },
    { value: 'nl', label: 'Dutch' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'el', label: 'Greek' },
    { value: 'it', label: 'Italian' },
    { value: 'no', label: 'Norwegian' },
    { value: 'pl', label: 'Polish' },
    { value: 'pt', label: 'Portuguese' },
    { value: 'es', label: 'Spanish' },
    { value: 'sv', label: 'Swedish' },
  ];

  return (
    <>
      {isEditing ? (
        <>
          <Input
            type="textarea"
            defaultValue={props.copy.content}
            onChange={({ target }) => setEditedCopy(target.value)}
          />{' '}
          <FontAwesomeIcon
            icon={faCheck}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              editProductCopy(props.type, editedCopy);
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
          {props.type === 'Extra Long Product Description' ||
          props.type === 'Product Bullets' ||
          props.type === 'Review Question and Answer' ||
          props.type === 'Description Question and Answer' ? (
            <div
              dangerouslySetInnerHTML={{ __html: props.copy.content }}
              style={{
                maxHeight: 200,
                overflowY: 'scroll',
                border: 'solid 1px #eee',
              }}
            />
          ) : (
            <>{props.copy.content}</>
          )}{' '}
          <FontAwesomeIcon
            icon={faEdit}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              setIsEditing(true);
            }}
          />{' '}
          &nbsp;
          <FontAwesomeIcon
            icon={faTrashAlt}
            size="sm"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              deleteProductCopy(props.type);
            }}
          />{' '}
          &nbsp;
          <FontAwesomeIcon
            icon={faGlobe}
            size="sm"
            className="cursor-pointer"
            onClick={() => setShowTranslation(!showTranslation)}
          ></FontAwesomeIcon>
        </>
      )}
      <br />
      {showTranslation && (
        <>
          <ul>
            {props.copy.translations &&
              Object.keys(props.copy.translations).map(
                (languageCode, index) => (
                  <>
                    <strong key={index}>{languageCode}: </strong>
                    {props.copy.translations[languageCode].translation}
                    <br />
                  </>
                ),
              )}
            <div className="d-flex flex-row">
              <FilterSelect
                label=""
                placeholder="Select language(s)..."
                value={languages}
                options={options}
                onChange={(value) => {
                  setLanguages(value);
                }}
                isMulti
                style={{ minWidth: 300 }}
              />
              <Button
                color="primary"
                onClick={handleMachineTranslateClick}
                size="sm"
                style={{ maxHeight: 30, padding: 5, margin: 5 }}
                disabled={working}
              >
                {working ? 'Working...' : 'Translate'}
              </Button>
            </div>
          </ul>
        </>
      )}
    </>
  );
}

export default ProductCopy;
