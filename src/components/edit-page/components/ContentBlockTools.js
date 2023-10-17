import { useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { Constants } from '@util/global';
import renderConfirmDialog from '@components/ConfirmDialog';
import classnames from 'classnames';

const SettingsEnabledComponents = [
  Constants.ProductAssortmentComponentId,
  Constants.RelatedProductsListComponentId,
];

const ContentBlockTools = ({
  isActive,
  hasFocus,
  hasHover,
  readOnly,
  onRemove,
  onSettings,
  contentBlock,
  dragHandleProps,
}) => {
  const handleRemove = useCallback(() => {
    renderConfirmDialog(
      `Delete ${contentBlock.component.name}`,
      'Do you really want to delete this content block?',
    ).then(() => {
      onRemove();
    });
  }, [onRemove]);

  return (
    (hasFocus || hasHover || readOnly) && (
      <>
        <div
          className={classnames([
            'd-flex content-block-tools',
            isActive ? 'bg-primary' : 'bg-secondary',
          ])}
          {...dragHandleProps}
        >
          <div className="fs--1 text-600 px-2">
            <span style={{ color: 'white' }}>
              {contentBlock?.component?.name}
            </span>
            &nbsp;{' '}
            {SettingsEnabledComponents.includes(
              contentBlock.component.componentId,
            ) && (
              <FontAwesomeIcon
                icon={faCog}
                tabIndex="2"
                focusable={true}
                style={{ color: 'white' }}
                className="cursor-pointer"
                onClick={onSettings}
              ></FontAwesomeIcon>
            )}
          </div>
          <div className="fs--1 text-600 ml-auto mr-1">
            <FontAwesomeIcon
              icon={faTrashAlt}
              tabIndex="3"
              focusable={true}
              style={{ color: 'white' }}
              className="cursor-pointer"
              onClick={handleRemove}
            ></FontAwesomeIcon>
          </div>
        </div>
      </>
    )
  );
};

export default ContentBlockTools;
