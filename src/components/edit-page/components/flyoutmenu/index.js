import { useState, useEffect, useRef } from 'react';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';

import Dropdown from './Dropdown';

const FlyoutButton = ({ items }) => {
  const [dropdown, setDropdown] = useState(false);
  const depthLevel = 0;

  let ref = useRef();

  useEffect(() => {
    const handler = (event) => {
      if (dropdown && ref.current && !ref.current.contains(event.target)) {
        setDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      // Cleanup the event listener
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [dropdown]);

  const onMouseEnter = () => {
    window.innerWidth > 960 && setDropdown(true);
  };

  const onMouseLeave = () => {
    window.innerWidth > 960 && setDropdown(false);
  };

  return (
    <div
      ref={ref}
      className="flyout"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <Button
        key="flyout"
        color="secondary"
        size="sm"
        outline
        aria-haspopup="menu"
        aria-expanded={dropdown ? 'true' : 'false'}
        onClick={() => setDropdown((prev) => !prev)}
      >
        <a>
          <FontAwesomeIcon icon={faEllipsisH} />
        </a>
      </Button>
      <Dropdown
        depthLevel={depthLevel}
        submenus={items.submenu}
        dropdown={dropdown}
      />
    </div>
  );
};

export default FlyoutButton;
