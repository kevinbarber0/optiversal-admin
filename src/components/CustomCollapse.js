import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Label, Collapse } from 'reactstrap';

export default function CustomCollapse({
  title,
  renderer,
  defaultCollapsed = true,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => setCollapsed((v) => !v);

  return (
    <>
      <div onClick={toggleCollapsed} className="mb-3 cursor-pointer">
        <Label className="mb-0">{title}</Label>
        {collapsed ? (
          <FontAwesomeIcon icon={faChevronDown} className="ml-2" />
        ) : (
          <FontAwesomeIcon icon={faChevronUp} className="ml-2" />
        )}
        {/* <FontAwesomeIcon icon="chevron-down" className="ml-2 fs--2" /> */}
      </div>
      <Collapse isOpen={!collapsed}>{renderer()}</Collapse>
    </>
  );
}
