import React, { useState } from 'react';

const ReviewItem = ({ value, row }) => {
  const [isActive, setIsActive] = useState(false);
  const handleClick = (event) => {
    setIsActive((current) => !current);
  };

  return (
    <div
      className={`cursor-pointer review-content ${
        isActive ? '' : 'review-collapse'
      }`}
      onClick={handleClick}
    >
      {value && (
        <div className="mb-1">
          <b>{value}</b>
        </div>
      )}
      {row?.text && <div dangerouslySetInnerHTML={{ __html: row.text }}></div>}
    </div>
  );
};
export default ReviewItem;
