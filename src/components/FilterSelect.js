import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Label } from 'reactstrap';
import Flex from '@components/common/Flex';
import Loader from '@components/common/Loader';
import Select from '@components/common/Select';
import { isIterableArray } from '@helpers/utils';

const FilterSelect = ({
  loading,
  label,
  options,
  loadOptions,
  style,
  ...rest
}) => (
  <FormGroup style={style}>
    <Flex justify="between" align="center">
      <Label className="mb-0">{label}</Label>
    </Flex>

    {loading ? (
      <Loader />
    ) : isIterableArray(options) ? (
      <Select isAsync={false} options={options} {...rest} />
    ) : (
      <Select
        isAsync={true}
        options={options}
        loadOptions={loadOptions}
        {...rest}
      />
    )}
  </FormGroup>
);

FilterSelect.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};

export default FilterSelect;
