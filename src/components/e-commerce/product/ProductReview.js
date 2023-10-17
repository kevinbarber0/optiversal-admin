import ProductListReview from './ProductListReview';

const sliderSettings = {
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const ProductReview = (props) => {
  return <ProductListReview {...props} sliderSettings={sliderSettings} />;
};

export default ProductReview;
