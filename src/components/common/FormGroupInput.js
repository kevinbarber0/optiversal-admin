import React from 'react';
import PropTypes from 'prop-types';
import { FormGroup, Input, Label } from 'reactstrap';

const FormGroupInput = ({ id, label, labelClass, ...rest }) => (
  <FormGroup>
    <Label htmlFor={id} className={labelClass}>
      {label}
    </Label>
    <Input id={id} {...rest} />
  </FormGroup>
);

FormGroupInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  ...Input.propTypes,
};

export default FormGroupInput;
