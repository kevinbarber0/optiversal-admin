import React, { useState, Fragment, useMemo } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { Popover, PopoverBody, UncontrolledTooltip } from 'reactstrap';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';

const DropZone = ({
  droppableId,
  direction = 'horizontal',
  components,
  insertComponent,
  ...props
}) => {
  const componentGroups = useMemo(() => {
    return components.reduce((acc, component) => {
      if (!component.displayGroup) {
        component.displayGroup = 'Default';
      }
      if (acc[component.displayGroup]) {
        acc[component.displayGroup].push(component);
      } else {
        acc[component.displayGroup] = [component];
      }
      return acc;
    }, {});
  }, [components]);

  const [isOpenPopover, setIsOpenPopover] = useState(false);
  return (
    <Droppable droppableId={droppableId} {...props}>
      {(provided, dropSnapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={classNames(
            'border border-dashed text-center p-1 h-100 d-flex justify-content-center align-items-center',
            dropSnapshot.isDraggingOver && 'bg-light',
          )}
        >
          <div id={`btn-${droppableId}`} className="mr-2" type="button">
            <FontAwesomeIcon icon={faPlus} size="xs" />
            &nbsp;
            {direction === 'horizontal' &&
              (dropSnapshot.isDraggingOver
                ? 'Drop component to place it in this location'
                : 'Click to select a content block or drag and drop here.')}
          </div>
          {provided.placeholder}
          <Popover
            placement="right"
            isOpen={isOpenPopover}
            target={`btn-${droppableId}`}
            toggle={() => setIsOpenPopover(!isOpenPopover)}
          >
            <PopoverBody>
              {Object.keys(componentGroups).map((group, index) => (
                <Fragment key={index}>
                  <h6 className="py-1 mb-1">{group}</h6>
                  {componentGroups[group].map((component, index) => (
                    <Item
                      destination={droppableId}
                      key={component.componentId}
                      index={index}
                      component={component}
                      insertComponent={insertComponent}
                      closePopover={() => setIsOpenPopover(!isOpenPopover)}
                    />
                  ))}
                </Fragment>
              ))}
            </PopoverBody>
          </Popover>
        </div>
      )}
    </Droppable>
  );
};

const Item = ({
  destination,
  component,
  insertComponent,
  closePopover,
  ...props
}) => {
  const onClickItem = () => {
    insertComponent(destination, component.componentId);
    closePopover();
  };

  return (
    <div
      className="border mt-1 mb-1 px-2 d-flex align-items-center bg-white"
      type="button"
      onClick={onClickItem}
      {...props}
    >
      <span>{component.name}</span> &nbsp;
      {component.description && (
        <Fragment>
          <FontAwesomeIcon
            id={`tooltip-${destination}-${component.componentId}`}
            icon={faInfoCircle}
          />
          <UncontrolledTooltip
            placement="bottom"
            target={`tooltip-${destination}-${component.componentId}`}
          >
            {component.description}
          </UncontrolledTooltip>
        </Fragment>
      )}
    </div>
  );
};
export default DropZone;
