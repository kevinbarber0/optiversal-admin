jest.mock('@api/_require-auth');

jest.mock('@db/accountDB', () => ({
  getAccountOrganizations: jest.fn(),
}));

jest.mock('@auth0/nextjs-auth0', () => ({
  getSession: jest.fn(),
}));

jest.mock('@services/auth0Service', () => ({
  updateUserProfile: jest.fn().mockResolvedValue(),
}));

import Auth0Service from '@services/auth0Service';
import AccountDB from '@db/accountDB';
import * as NextJsAuth0 from '@auth0/nextjs-auth0';
import { validateOrgSelection, handleUserUpdate } from '@api/auth/user';
import { createMocks } from 'node-mocks-http';

describe('api/user', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {});

  it('validateOrgSelection: returns true when the user  ould have access to an organization', async () => {
    const accountId = '123';
    const orgId = '456';
    const orgs = [{ organizationId: '456' }];

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);
    const result = await validateOrgSelection(accountId, orgId);
    expect(result).toBe(true);
  });

  it('validateOrgSelection: returns false when the user should not have access to an organization', async () => {
    const accountId = '123';
    const orgId = '123';
    const orgs = [{ organizationId: '456' }];

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);
    const result = await validateOrgSelection(accountId, orgId);
    expect(result).toBe(false);
  });

  it('validateOrgSelection: returns false when the user should not have access to an organization', async () => {
    const accountId = '123';
    const orgId = '123';
    const orgs = [{ organizationId: '456' }];

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);
    const result = await validateOrgSelection(accountId, orgId);
    expect(result).toBe(false);
  });

  it('handleUserUpdate: updates user properties in auth0 with a valid request', async () => {
    const orgs = [{ organizationId: '456' }];

    const { req, res } = createMocks({
      method: 'PATCH',
      body: {
        data: {
          sub: '123',
        },
      },
    });

    res.setHeader = jest.fn();

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);

    jest.spyOn(NextJsAuth0, 'getSession').mockImplementationOnce(() => ({
      user: {
        sub: '123',
      },
    }));

    const authSpy = jest
      .spyOn(Auth0Service, 'updateUserProfile')
      .mockResolvedValue({
        foo: 'bar',
      });

    await handleUserUpdate(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(authSpy).toHaveBeenCalledWith('123', { sub: '123' });
    expect(res.setHeader).not.toHaveBeenCalledWith(
      'Set-Cookie',
      'appSession=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ); //Don't clear the appSession unless were org switching.
  });

  it('handleUserUpdate: sets org_id_override app_metadata in auth0 with a valid request', async () => {
    const orgs = [{ organizationId: '456' }];

    const { req, res } = createMocks({
      method: 'PATCH',
      body: {
        data: {
          org_id_override: '456',
          sub: '123',
        },
      },
    });

    req.user = { sub: '123' };
    res.setHeader = jest.fn();
    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);

    jest.spyOn(NextJsAuth0, 'getSession').mockImplementationOnce(() => ({
      user: {
        sub: '123',
      },
    }));

    const authSpy = jest
      .spyOn(Auth0Service, 'updateUserProfile')
      .mockResolvedValue({
        foo: 'bar',
      });

    await handleUserUpdate(req, res);

    expect(authSpy).toHaveBeenCalledWith('123', {
      app_metadata: {
        org_id_override: '456',
      },
      sub: '123',
    });
    expect(res._getStatusCode()).toBe(302);
  });

  it('handleUserUpdate: redirects to clearsession endpoint on org_id_override changes', async () => {
    const orgs = [{ organizationId: '456' }];

    const { req, res } = createMocks({
      method: 'PATCH',
      body: {
        data: {
          org_id_override: '456',
          sub: '123',
        },
      },
    });
    req.user = { sub: '123' };
    res.setHeader = jest.fn();

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);

    jest.spyOn(NextJsAuth0, 'getSession').mockImplementationOnce(() => ({
      user: {
        sub: '123',
      },
    }));

    jest
      .spyOn(Auth0Service, 'updateUserProfile')
      .mockResolvedValue({
        foo: 'bar',
      });

    await handleUserUpdate(req, res);

    expect(res._getStatusCode()).toBe(302);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      'appSession=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
    );
  });

  it('handleUserUpdate: rejects an update with an invalid request', async () => {
    const orgs = [{ organizationId: '123456' }];

    const { req, res } = createMocks({
      method: 'PATCH',
      body: {
        data: {
          org_id_override: '123',
          sub: '123',
        },
      },
    });

    jest
      .spyOn(AccountDB, 'getAccountOrganizations')
      .mockImplementationOnce(() => orgs);

    jest.spyOn(NextJsAuth0, 'getSession').mockImplementationOnce(() => ({
      user: {
        sub: '123',
      },
    }));

    const authSpy = jest
      .spyOn(Auth0Service, 'updateUserProfile')
      .mockResolvedValue({
        foo: 'bar',
      });

    await handleUserUpdate(req, res);

    expect(res._getStatusCode()).toBe(403);
    expect(authSpy).not.toHaveBeenCalled();
  });
});
