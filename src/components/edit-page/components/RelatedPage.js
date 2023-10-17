import React from 'react';
import { Button, Media } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClone,
  faTrash,
  faThumbtack,
} from '@fortawesome/free-solid-svg-icons';

const RelatedPage = ({ page, urlFormat, isLast, pinned, onPin, onTrash }) => {
  return (
    <>
      <Media className="mb-1 hover-actions-trigger align-items-center">
        <Media body>
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-1">
              <a
                target="_blank"
                href={page.slug}
                rel="noopener noreferrer"
                className="stretched-link text-700"
              >
                {page.title}
              </a>
            </h6>
            {pinned && (
              <Button
                color="white"
                size="sm"
                className="text-600 border-none py-0"
              >
                <FontAwesomeIcon
                  size="xs"
                  icon={faThumbtack}
                  color="#2c7be5"
                ></FontAwesomeIcon>
              </Button>
            )}
            <div className="hover-actions r-0 absolute-vertical-center">
              <Button
                color="light"
                size="sm"
                className="border-300 text-600 ml-1"
                onClick={() => {
                  navigator.clipboard.writeText(
                    urlFormat.replaceAll('{{slug}}', page.slug),
                  );
                }}
              >
                <FontAwesomeIcon size="xs" icon={faClone}></FontAwesomeIcon>
              </Button>

              <Button
                color="light"
                size="sm"
                className="border-300 text-600 ml-1"
                onClick={() => onTrash(page)}
              >
                <FontAwesomeIcon size="xs" icon={faTrash}></FontAwesomeIcon>
              </Button>
              <Button
                color={pinned ? 'primary' : 'light'}
                size="sm"
                className="border-300 text-600 ml-1"
                onClick={() => {
                  onPin(!pinned, page);
                }}
              >
                <FontAwesomeIcon
                  size="xs"
                  icon={faThumbtack}
                  color={pinned ? 'white' : ''}
                ></FontAwesomeIcon>
              </Button>
            </div>
          </div>
        </Media>
      </Media>
      {!isLast && <hr className="border-200 mt-2" />}
    </>
  );
};

export default RelatedPage;
