import {
  faChevronDown,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useState } from 'react';
import { Card, CardBody, Collapse } from 'reactstrap';
import FalconCardHeader from './common/FalconCardHeader';

export default function CollapsibleCard({
  title,
  renderer,
  defaultCollapsed = false,
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const toggleCollapsed = () => setCollapsed((v) => !v);

  return (
    <Card>
      <FalconCardHeader title={title} light={false} onClick={toggleCollapsed} className="cursor-pointer">
        <span>
          {collapsed ? (
            <FontAwesomeIcon icon={faChevronRight} />
          ) : (
            <FontAwesomeIcon icon={faChevronDown} />
          )}
        </span>
      </FalconCardHeader>
      <CardBody className="bg-light">
        <Collapse isOpen={!collapsed}>{renderer()}</Collapse>
      </CardBody>
    </Card>
  );
}
