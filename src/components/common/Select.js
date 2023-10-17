import React from 'react';
import PropTypes from 'prop-types';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import AsyncCreatableSelect from 'react-select/async-creatable';
import RSelect from 'react-select';
import SortableSelect from './SortableSelect';

const Select = ({ isAsync, isCreatable, isSortable, styles, ...rest }) => {
  let Component = null;
  if (isCreatable && isAsync) {
    Component = AsyncCreatableSelect;
  } else if (isCreatable) {
    Component = CreatableSelect;
  } else if (isAsync) {
    Component = AsyncSelect;
  } else {
    Component = RSelect;
  }
  if (isSortable) {
    return (
      <>
        <SortableSelect
          {...rest}
          Component={Component}
          menuPortalTarget={document.querySelector('body')}
          styles={{ ...defaultStyles, ...styles }}
        />
      </>
    );
  }
  return (
    <Component
      {...rest}
      menuPortalTarget={document.querySelector('body')}
      styles={{ ...defaultStyles, ...styles }}
    />
  );
};

Select.propTypes = {
  classNamePrefix: PropTypes.string,
  isCreatable: PropTypes.bool,
  isAsync: PropTypes.bool,
  styles: PropTypes.object,
};

Select.defaultProps = {
  classNamePrefix: 'react-select',
  isCreatable: false,
  isAsync: true,
  styles: {},
};

const defaultStyles = {
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 1100,
  }),
};

export default Select;
