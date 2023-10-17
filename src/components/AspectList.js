import React from 'react';
import { Card, CardBody, Button } from 'reactstrap';

const getContentClassNames = (color) => {
  const contentClassNames =
    'display-4 fs-0 mb-2 font-weight-normal text-sans-serif';
  if (color === 'success') return contentClassNames;
  return `${contentClassNames} text-gray`;
};

function AspectList(props) {
  return (
    <>
      <Card
        className="mb-3 overflow-hidden"
        style={{
          minWidth: '12rem',
          background: 'linear-gradient(#ceeeff, #fff)',
        }}
      >
        <CardBody className="position-relative">
          <h6>{props.header}</h6>
          <div className={getContentClassNames('info')}>
            <ul style={{ padding: 5 }}>
              {props.items &&
                props.items.map((item) => (
                  <li key={item} style={{ padding: 5 }}>
                    {item}
                  </li>
                ))}
            </ul>
          </div>
          <div className="d-flex justify-content-center align-self-end">
            <Button>Create Article</Button>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export default AspectList;
