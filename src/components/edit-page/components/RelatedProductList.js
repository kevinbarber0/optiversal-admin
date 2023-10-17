import React from 'react';
import { Row, Col } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
import Loader from '@components/common/Loader';

const RelatedProductList = (props) => {
  return (
    <>
      {props.contentBlock.isComposing && (
        <div className="overlayover">
          <Loader></Loader>
        </div>
      )}
      {!props.contentBlock.isComposing && (
        <>
          <Row>
            {props.contentBlock.data.length > 0 &&
              props.contentBlock.data.map((product) => (
                <Col
                  key={product.id}
                  style={{ maxWidth: '20%', textAlign: 'center' }}
                  className="justify-content-between align-items-center"
                >
                  {product.image ? (
                    <img
                      src={product.image}
                      style={{ maxWidth: '90%', maxHeight: 100 }}
                      alt={product.name}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faGift} size="5x"></FontAwesomeIcon>
                  )}
                  <div style={{ fontSize: 'small', textAlign: 'center' }}>
                    {product.name + ' (' + product.id + ')'}
                  </div>
                </Col>
              ))}
            {props.contentBlock.data.length === 0 && (
              <>
                No related products found
                <br />
                <br />
              </>
            )}
          </Row>
        </>
      )}
    </>
  );
};

export default RelatedProductList;
