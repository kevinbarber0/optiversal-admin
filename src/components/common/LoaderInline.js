import React from 'react';
import { Spinner } from 'reactstrap';

const Loader = (props) => <Spinner {...props} />;

Loader.propTypes = { ...Spinner.propTypes };

Loader.defaultProps = {
  size: 'sm',
};

export default Loader;
