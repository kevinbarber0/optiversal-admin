import React from 'react';
import Section from 'components/Section';
import Container from 'react-bootstrap/Container';
import SectionHeader from 'components/SectionHeader';
import Button from 'react-bootstrap/Button';

function HeroSection(props) {
  return (
    <Section
      bg={props.bg}
      textColor={props.textColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container className="text-center">
        <SectionHeader
          title={props.title}
          subtitle={props.subtitle}
          size={1}
          spaced={true}
        ></SectionHeader>
        <Button
          variant={props.buttonColor}
          size="lg"
          onClick={props.buttonOnClick}
        >
          {props.buttonText}
        </Button>
      </Container>
    </Section>
  );
}

export default HeroSection;
