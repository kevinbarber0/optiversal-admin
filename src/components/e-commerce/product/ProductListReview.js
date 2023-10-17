import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Col, Row } from 'reactstrap';
import { isIterableArray } from '../../../helpers/utils';
import Slider from 'react-slick/lib';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Flex from '../../common/Flex';
import StarCount from './StarCount';
import classNames from 'classnames';
import ButtonIcon from '../../common/ButtonIcon';
import AppContext, { ProductContext } from '../../../context/Context';

const ProductListReview = ({
  id,
  image,
  name,
  category,
  features,
  quotes,
  price,
  sale,
  rating,
  review,
  shippingCost,
  isInStock,
  isNew,
  sliderSettings,
  index,
}) => {
  const { currency, isDark } = useContext(AppContext);
  const { handleCartAction, isInFavouriteItems, favouriteItemsDispatch } =
    useContext(ProductContext);
  const [cartLoading, setCartLoading] = useState(false);

  const handleAddToCart = () => {
    setCartLoading(true);
    setTimeout(() => {
      handleCartAction({ id });
      setCartLoading(false);
    }, 1000);
  };

  return (
    <Col
      xs={12}
      className={classNames({ 'bg-100': isDark && index % 2 !== 0 })}
    >
      <div className="p-1">
        <Row>
          <Col sm={5} md={4}>
            <div className="position-relative h-sm-100">
              {image && image !== '' && (
                <img
                  className="img-fluid rounded-top"
                  style={{ maxHeight: 100 }}
                  src={image}
                  alt={name}
                />
              )}
            </div>
          </Col>
          <Col sm={7} md={8}>
            <Row>
              <Col lg={12}>
                <strong className="mt-3 mt-sm-0">
                  <span className="text-dark fs--2">{name}</span>
                </strong>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </Col>
  );
};

export default ProductListReview;
