import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Alert, Button, Container, Spinner } from 'reactstrap';
import Form from 'react-bootstrap/Form';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';

import FormField from '@components/FormField';
import Section from '@components/Section';
import SectionHeader from '@components/SectionHeader';

export default function SetPasswordForm({ auth }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const { handleSubmit, register, errors, getValues } = useForm();

  const onSubmit = useCallback(
    async (v) => {
      try {
        setPending(true);
        await auth.updatePassword(v.pass);
        toast.success('Your password has been set');
        router && router.replace('/');
      } catch (e) {
        console.log('error', e);
        setError(e.message);
      } finally {
        setPending(false);
      }
    },
    [auth],
  );

  return (
    <Section
      bg="white"
      textColor="dark"
      size="md"
      bgImage=""
      bgImageOpacity={1}
    >
      <Container
        style={{
          maxWidth: '450px',
        }}
      >
        <SectionHeader
          title="Set your password"
          subtitle=""
          size={2}
          spaced={true}
          className="text-center"
        />

        <Form onSubmit={handleSubmit(onSubmit)}>
          {error && <Alert color="danger">{error}</Alert>}
          <Form.Group controlId="formPassword">
            <FormField
              size="lg"
              name="pass"
              type="password"
              placeholder="Password"
              error={errors.pass}
              inputRef={register({
                required: 'Please enter a password',
              })}
            ></FormField>
          </Form.Group>

          <Form.Group controlId="formConfirmPass">
            <FormField
              size="lg"
              name="confirmPass"
              type="password"
              placeholder="Confirm Password"
              error={errors.confirmPass}
              inputRef={register({
                required: 'Please enter your password again',
                validate: (value) => {
                  if (value === getValues().pass) {
                    return true;
                  } else {
                    return "This doesn't match your password";
                  }
                },
              })}
            ></FormField>
          </Form.Group>

          <Button
            size="lg"
            variant="primary"
            block={true}
            type="submit"
            disabled={pending}
          >
            {!pending && <span>Set Password</span>}

            {pending && (
              <Spinner
                animation="border"
                size="sm"
                role="status"
                aria-hidden={true}
                className="align-baseline"
              >
                <span className="sr-only">Loading...</span>
              </Spinner>
            )}
          </Button>
        </Form>
      </Container>
    </Section>
  );
}
