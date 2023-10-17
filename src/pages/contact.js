import React from 'react';
import ContactSection from 'components/ContactSection';
import { requireAuth } from 'util/auth.js';

function ContactPage() {
  return (
    <ContactSection
      bg="white"
      textColor="dark"
      size="md"
      bgImage=""
      bgImageOpacity={1}
      title="Contact Us"
      subtitle=""
      buttonText="Send message"
      buttonColor="primary"
      showNameField={true}
      inputSize="md"
    ></ContactSection>
  );
}

export default requireAuth(ContactPage);
