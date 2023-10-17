import React, { useState } from 'react';
import FormAlert from 'components/FormAlert';
import { Form, FormGroup, Row, Col, Button, Spinner } from 'reactstrap';
import FormField from 'components/FormField';
import contact from 'util/contact.js';
import { useForm } from 'react-hook-form';

function Contact(props) {
  const [pending, setPending] = useState(false);
  const [formAlert, setFormAlert] = useState(null);
  const { handleSubmit, register, errors, reset } = useForm();

  const onSubmit = (data) => {
    // Show pending indicator
    setPending(true);

    contact
      .submit(data)
      .then(() => {
        // Clear form
        reset();
        // Show success alert message
        setFormAlert({
          type: 'success',
          message: 'Your message has been sent!',
        });
      })
      .catch((error) => {
        // Show error alert message
        setFormAlert({
          type: 'error',
          message: error.message,
        });
      })
      .finally(() => {
        // Hide pending indicator
        setPending(false);
      });
  };

  return (
    <>
      {formAlert && (
        <FormAlert
          type={formAlert.type}
          message={formAlert.message}
        ></FormAlert>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <Row>
          {props.showNameField && (
            <Col xs={12} sm={6}>
              <FormGroup controlId="formName">
                <FormField
                  size={props.inputSize}
                  name="name"
                  type="text"
                  placeholder="Name"
                  error={errors.name}
                  inputRef={register({
                    required: 'Please enter your name',
                  })}
                ></FormField>
              </FormGroup>
            </Col>
          )}
          <Col xs={12} sm={props.showNameField ? 6 : 12}>
            <FormGroup controlId="formEmail">
              <FormField
                size={props.inputSize}
                name="email"
                type="email"
                placeholder="Email"
                error={errors.email}
                inputRef={register({
                  required: 'Please enter your email',
                })}
              ></FormField>
            </FormGroup>
          </Col>
        </Row>
        <FormGroup controlId="formMessage">
          <FormField
            size={props.inputSize}
            name="message"
            type="textarea"
            placeholder="Message"
            rows={5}
            error={errors.message}
            inputRef={register({
              required: 'Please enter a message',
            })}
          ></FormField>
        </FormGroup>
        <Button
          color={props.buttonColor}
          //variant={props.buttonColor}
          size={props.inputSize}
          type="submit"
          disabled={pending}
        >
          <span>{props.buttonText}</span>

          {pending && (
            <Spinner
              animation="border"
              size="sm"
              role="status"
              aria-hidden={true}
              className="ml-2"
            >
              <span className="sr-only">Sending...</span>
            </Spinner>
          )}
        </Button>
      </Form>
    </>
  );
}

export default Contact;
