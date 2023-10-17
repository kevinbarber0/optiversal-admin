import React, { useCallback, useState } from 'react';
import { Button, Card, CardBody, Col, Row } from 'reactstrap';
import { Router } from 'next/router';

const Header = ({ onSave }) => {
  const [isWorking, setIsWorking] = useState(false);

  const handleSave = async () => {
    setIsWorking(true);
    await onSave();
    setIsWorking(false);
  };

  const handleCancel = useCallback(() => {
    Router.push('/reviews');
  }, []);

  return (
    <Card>
      <CardBody>
        <Row className="justify-content-between align-items-center">
          <Col md>
            <h5 className="mb-2 mb-md-0">Review annotation</h5>
          </Col>
          <Col xs="auto">
            <Button
              color="falcon-secondary"
              size="sm"
              className="ml-2"
              onClick={handleCancel}
              disabled={isWorking}
            >
              Cancel
            </Button>

            <Button
              color="falcon-default"
              size="sm"
              className="ml-2"
              onClick={handleSave}
              disabled={isWorking}
            >
              Save
            </Button>
          </Col>
        </Row>
      </CardBody>
    </Card>
  );
};

export default Header;
