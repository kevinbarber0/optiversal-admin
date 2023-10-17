import React, { Fragment, useMemo } from 'react';
import { faArrowsAlt, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { UncontrolledTooltip } from 'reactstrap';

const ComponentList = ({ components }) => {
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

  return (
    <Droppable droppableId="COMPONENTS" isDropDisabled>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {Object.keys(componentGroups).map((group, index) => (
            <Fragment key={index}>
              <h6 className="py-1">{group}</h6>
              {componentGroups[group].map((component, index) => (
                <Draggable
                  draggableId={component.componentId}
                  key={component.componentId}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <Fragment>
                      <Item
                        component={component}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        isDragging={snapshot.isDragging}
                        innerRef={provided.innerRef}
                      />
                      {snapshot.isDragging && (
                        <Item className="cloned-item" component={component} />
                      )}
                    </Fragment>
                  )}
                </Draggable>
              ))}
            </Fragment>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

const Item = ({
  component,
  innerRef = undefined,
  isDragging,
  className,
  ...props
}) => {
  return (
    <div
      className={classNames(
        className,
        isDragging && 'border-primary border-dashed',
        'border mt-1 mb-1 px-2 d-flex align-items-center bg-white',
      )}
      ref={innerRef || undefined}
      {...props}
    >
      <FontAwesomeIcon icon={faArrowsAlt} /> &nbsp;
      <span>{component.name}</span> &nbsp;
      {component.description && (
        <Fragment>
          <FontAwesomeIcon
            id={`tooltip-${component.componentId}`}
            icon={faInfoCircle}
          />
          <UncontrolledTooltip
            placement="bottom"
            target={`tooltip-${component.componentId}`}
            container=".content"
          >
            {component.description}
          </UncontrolledTooltip>
        </Fragment>
      )}
    </div>
  );
};

export default ComponentList;
