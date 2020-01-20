import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { Form, Input, message } from 'antd';
import { FormComponentProps } from 'antd/lib/form';
import { useApolloClient } from '@apollo/react-hooks';
import gql from 'graphql-tag';
import cookie from 'js-cookie';

import * as ROUTES from '@constants/routes';
import { EXPIRES_IN } from '@constants/cookie';
import FormIcon from '@components/Form/Icon';
import FormItem from '@components/Form/Item';
import FormStretchedButton from '@components/Form/StretchedButton';

import { doSignInWithEmailAndPassword } from '@services/firebase/auth';

const StyledFormFooter = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SIGN_IN = gql`
  mutation($idToken: String!) {
    signIn(idToken: $idToken) {
      sessionToken
    }
  }
`;

const SignInForm = ({ form }: FormComponentProps) => {
  const router = useRouter();
  const apolloClient = useApolloClient();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    form.validateFields(async (error, values) => {
      if (error) return;

      message.loading({
        content: 'Loading ...',
        key: ROUTES.SIGN_IN,
      });

      try {
        const { user } = await doSignInWithEmailAndPassword(
          values.email,
          values.password
        );

        const idToken = await user?.getIdToken();
        // const csrfToken = getCookie('csrfToken'); // https://firebase.google.com/docs/auth/admin/manage-cookies#sign_in

        const { data } = await apolloClient.mutate({
          mutation: SIGN_IN,
          variables: {
            idToken,
          },
        });

        cookie.set('session', data.signIn.sessionToken, {
          expires: EXPIRES_IN,
          // httpOnly: true,
          // secure: true,
        });

        message.success({
          content: 'Success!',
          key: ROUTES.SIGN_IN,
          duration: 2,
        });

        router.push(ROUTES.INDEX);
      } catch (error) {
        message.error({
          content: error.message,
          key: ROUTES.SIGN_IN,
          duration: 2,
        });
      }
    });

    event.preventDefault();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormItem>
        {form.getFieldDecorator('email', {
          rules: [
            {
              type: 'email',
              message: 'The input is not valid E-mail!',
            },
            {
              required: true,
              message: 'Please input your E-mail!',
            },
          ],
          validateTrigger: 'onBlur',
        })(
          <Input
            prefix={<FormIcon type="user" />}
            placeholder="E-mail"
            aria-label="sign-in-email"
          />
        )}
      </FormItem>
      <FormItem>
        {form.getFieldDecorator('password', {
          rules: [
            {
              required: true,
              message: 'Please input your Password!',
            },
          ],
          validateTrigger: 'onBlur',
        })(
          <Input
            prefix={<FormIcon type="lock" />}
            type="password"
            placeholder="Password"
            aria-label="sign-in-password"
          />
        )}
      </FormItem>

      <FormItem>
        <FormStretchedButton
          type="primary"
          htmlType="submit"
          aria-label="sign-in-submit"
        >
          Sign In
        </FormStretchedButton>

        <StyledFormFooter>
          <span>
            Or&nbsp;
            <Link href={ROUTES.SIGN_UP}>
              <a aria-label="sign-up-link">sign up now!</a>
            </Link>
          </span>

          <Link href={ROUTES.PASSWORD_FORGOT}>
            <a aria-label="password-forgot-link">Forgot password</a>
          </Link>
        </StyledFormFooter>
      </FormItem>
    </Form>
  );
};

export default Form.create({
  name: 'sign-in',
})(SignInForm);
