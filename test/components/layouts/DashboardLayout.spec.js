import { cleanup, render, screen } from '@testing-library/react';
import DashboardLayout from '@components/layouts/DashboardLayout';
import auth from '@util/auth.js';
import router from 'next/router';

jest.mock('@util/auth.js', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('DashboardLayout', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  afterEach(() => {
    cleanup();
  })

  it('Displays "Your account has not yet been associated with an organization." when account not found', () => {

    const user = {
      message: 'Account not found',
      email_verified: false,
      org_id_override: null,
      organizationId: '1234',
      providerData: [
        {foo: 'bar'}
      ]
    };

    jest.spyOn(auth, 'useAuth').mockImplementation(() => ({
      isLoading: false,
      getSelectedOrganization: jest.fn().mockImplementation(() => {
        return user.org_id_override || user.organizationId;
      }),
      user,
    }));

    jest.spyOn(auth, 'useUser').mockImplementation(() => ({
      isLoading: false,
      user,
    }));

    jest.spyOn(router, 'useRouter').mockImplementation(() => ({
      query: {},
      push: jest.fn(),
    }));

    render(<DashboardLayout showNav={false} />);

    const orgWarning = screen.getByText('Your account has not yet been associated with an organization. Please try again later.');

    expect(orgWarning).toBeVisible();
  });
});
