import React from 'react';
import Section from 'components/Section';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import SectionHeader from 'components/SectionHeader';
import Button from 'react-bootstrap/Button';

function CtaSection(props) {
  return (
    <Section
      bg={props.bg}
      textColor={props.textColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container className="text-center">
        <Row className="justify-content-center align-items-center">
          <Col xs={12} md="auto" className="py-3 px-4">
            <SectionHeader
              title={props.title}
              subtitle={props.subtitle}
              size={1}
              spaced={false}
              className="text-center"
            ></SectionHeader>
          </Col>
          <Col xs={12} md="auto" className="py-3 px-4">
            <Button
              variant={props.buttonColor}
              size="lg"
              onClick={props.buttonOnClick}
            >
              {props.buttonText}
            </Button>
          </Col>
        </Row>
      </Container>
    </Section>
  );
}

export default CtaSection;
