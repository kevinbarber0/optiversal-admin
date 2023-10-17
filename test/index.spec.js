import { cleanup, render } from '@testing-library/react';
import IndexPage from '@pages/index';
import auth from '@util/auth.js';
import router from 'next/router';

jest.mock('@util/auth.js', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('IndexPage', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  afterEach(() => {
    cleanup();
  })

  it('renders spinner when loading', () => {
    
    jest.spyOn(auth, 'useAuth').mockImplementationOnce(() => ({
      isLoading: true,
      user: null,
    }));

    jest.spyOn(router, 'useRouter').mockImplementationOnce(() => ({ 
      query: {},
      push: jest.fn(), 
    }));

    render(<IndexPage />);

    const spinner = document.querySelector('.spinner-border');

    expect(spinner).toBeVisible();
  });

  it('redirects user to ./verify-email when email is not verified', () => {
    
    jest.spyOn(auth, 'useAuth').mockImplementationOnce(() => ({
      isLoading: false,
      user: {
        email_verified: false,
        providers: [],
      },
    }));
    const pushMock = jest.fn();

    jest.spyOn(router, 'useRouter').mockImplementationOnce(() => ({ 
      query: {},
      push: pushMock, 
    }));

    render(<IndexPage />);
    expect(pushMock).toHaveBeenCalledWith('/verify-email');
  });


  it('redirects user to ./pages when authenticated and verified', () => {
    
    jest.spyOn(auth, 'useAuth').mockImplementationOnce(() => ({
      isLoading: false,
      user: {
        email_verified: true,
        providers: [],
      },
    }));

    const pushMock = jest.fn();

    jest.spyOn(router, 'useRouter').mockImplementationOnce(() => ({ 
      query: {},
      push: pushMock, 
    }));

    render(<IndexPage />);
    expect(pushMock).toHaveBeenCalledWith('/pages');
  });

  it('renders empty div when authenticated', () => {
    jest.spyOn(auth, 'useAuth').mockImplementationOnce(() => ({
      isLoading: false,
      user: { 
        email_verified: true,
        providers: ['oidc'],
      },
    }));

    jest.spyOn(router, 'useRouter').mockImplementationOnce(() => ({ 
      query: {},
      push: jest.fn(), 
    }));

    const { container } = render(<IndexPage />);

    expect(container.outerHTML).toEqual('<div></div>');
  });

});
