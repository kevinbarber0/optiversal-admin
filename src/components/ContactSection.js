import React from 'react';
import Section from 'components/Section';
import Container from 'react-bootstrap/Container';
import SectionHeader from 'components/SectionHeader';
import Contact from 'components/Contact';

function ContactSection(props) {
  return (
    <Section
      bg={props.bg}
      textColor={props.textColor}
      size={props.size}
      bgImage={props.bgImage}
      bgImageOpacity={props.bgImageOpacity}
    >
      <Container
        style={{
          maxWidth: '850px',
        }}
      >
        <SectionHeader
          title={props.title}
          subtitle={props.subtitle}
          size={2}
          spaced={true}
          className="text-center"
        ></SectionHeader>
        <br />
        <Contact
          showNameField={props.showNameField}
          buttonText={props.buttonText}
          buttonColor={props.buttonColor}
          inputSize={props.inputSize}
        ></Contact>
      </Container>
    </Section>
  );
}

export default ContactSection;
