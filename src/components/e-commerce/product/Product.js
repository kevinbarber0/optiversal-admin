import ProductList from './ProductList';

const sliderSettings = {
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const Product = (props) => {
  return <ProductList {...props} sliderSettings={sliderSettings} />;
};

export default Product;
