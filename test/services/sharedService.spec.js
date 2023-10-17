jest.mock('@db/accountDB', () => ({
  getAccountOrganizations: jest.fn(),
}));

import AccountDB from '@db/accountDB';
import SharedService from '@services/sharedService';

describe('SharedService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    SharedService.orgUserMap = new Map();// Not the best way to do this, but it works for now.
  });

  afterEach(() => {});

  it('getUserOrgId: should return null by default.', async () => {
    const orgs = [{ organizationId: '456' }];
    
    jest
    .spyOn(AccountDB, 'getAccountOrganizations')
    .mockImplementationOnce(() => orgs);

    const orgId = SharedService.getUserOrgId('456');
    expect(orgId).toBe(null);
  });

  it('getUserOrgId: should return default org id after being set with setDefaultOrganizationId.', async () => {
    const orgs = [{ organizationId: '456' }, { organizationId: '789' }, { organizationId: '101112' }];
    
    jest
    .spyOn(AccountDB, 'getAccountOrganizations')
    .mockImplementationOnce(() => orgs);
    await SharedService.setDefaultOrganizationId('1234');
    const orgId = SharedService.getUserOrgId('1234');
    expect(orgId).toBe('456');
  });

  it('getUserOrgId: should return org id after being set with setOrganizationId.', async () => {
    const orgs = [{ organizationId: '456' }, { organizationId: '789' }, { organizationId: '101112' }];
    
    jest
    .spyOn(AccountDB, 'getAccountOrganizations')
    .mockImplementationOnce(() => orgs);

    await SharedService.setOrganizationId('1234', '789');
    const orgId = SharedService.getUserOrgId('1234');
    expect(orgId).toBe('789');
  });

  it('getUserOrgIdOrDefault: should return default org id when not previously set.', async () => {
    const orgs = [{ organizationId: '456' }, { organizationId: '789' }, { organizationId: '101112' }];
    
    jest
    .spyOn(AccountDB, 'getAccountOrganizations')
    .mockImplementationOnce(() => orgs);

    const orgId = await SharedService.getUserOrgIdOrDefault('1234');
  
    expect(orgId).toBe('456');
  });

  it('getUserOrgIdOrDefault: should return previously set org id.', async () => {
    const orgs = [{ organizationId: '456' }, { organizationId: '789' }, { organizationId: '101112' }];
    
    jest
    .spyOn(AccountDB, 'getAccountOrganizations')
    .mockImplementationOnce(() => orgs);
    await SharedService.setOrganizationId('1234', '789');

    const orgId = await SharedService.getUserOrgIdOrDefault('1234');
  
    expect(orgId).toBe('789');
  });
});
