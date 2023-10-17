import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import { useRouter } from 'next/router';
import classNames from 'classnames';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

import _enum, { UserRole, Status } from '@util/enum';
import { toast } from 'react-toastify';

import { compareArray, filterNullValues } from '@helpers/utils';
import { isEqual, debounce } from 'lodash';
import useStateWithCallback from 'hooks/useStateWithCallback';
import { loadLabelsOptions } from '@util/load-options';
import {
  Card,
  CardBody,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Nav,
  NavItem,
  NavLink,
  Input,
  InputGroupAddon,
  InputGroupText,
  InputGroup,
  CustomInput,
  FormGroup,
  Popover,
  PopoverBody,
} from 'reactstrap';
import { requireRoles, useAuth } from '@util/auth.js';
import { getRouteRoles } from 'routes';
import {
  updateOrganizationUser,
  useOrgAccounts,
  createOrganizationUser,
} from '@util/api';
import UsersTable from '@components/UsersTable';
import AuditsTable from '@components/AuditsTable';
import FilterSelect from '@components/FilterSelect';
import FalconCardHeader from '@components/common/FalconCardHeader';
import Loader from '@components/common/Loader';
import PageLoader from '@components/PageLoader';
import ButtonIcon from '@components/common/ButtonIcon';
import DatePicker from '@components/DatePicker';
import { UserAction } from '@util/enum';
import { getOrgId } from '@helpers/auth';

function ManageUsersView() {
  const auth = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [editUser, setEditUser] = useState(null);
  const [newUserModalVisible, setNewUserModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    inactivate: null,
  });

  const router = useRouter();
  const isMountedRef = useRef(false);
  const isFiltersSetRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;
    isFiltersSetRef.current = false;

    (async () => {
      const currentFilters = { ...filterOptions };
      let filterOptionChanged = false;

      if (query.inactivate !== currentFilters.inactivate) {
        currentFilters.inactivate = query.inactivate ? true : null;
        filterOptionChanged = true;
      }

      if (filterOptionChanged === true) {
        setFilterOptions(currentFilters, () => {
          isFiltersSetRef.current = true;
        });
      } else {
        isFiltersSetRef.current = true;
      }
    })();

    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          view: 'manage',
          inactivate: filterOptions.inactivate ? true : null,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
        },
        [undefined, null, ''],
      );
      if (!isEqual(newQuery, query)) {
        if (Object.keys(newQuery).length > 0) {
          router.push({
            query: newQuery,
          });
        } else {
          router.push(router.pathname);
        }
      }
    }
  }, [filterOptions.inactivate, currentPage, pageSize]);

  const organizationOptions = useMemo(() => {
    return auth.user.organizations
      .filter(
        (organization) =>
          organization.organizationId !== auth.getSelectedOrganization() &&
          organization.roles.includes(UserRole.ManageUsers),
      )
      .map(({ organizationId, name }) => ({ organizationId, name }));
  }, [auth]);

  const onCloseEditUserModal = () => setEditUser(null);

  const onCloseNewUserModal = () => setNewUserModalVisible(false);

  const handleNewUser = useCallback(() => {
    setNewUserModalVisible(true);
  }, []);

  return (
    <>
      <Card>
        <FalconCardHeader title="Manage Users" light={false}>
          <OrgAccountFilter
            filter={filterOptions}
            setFilter={setFilterOptions}
          />
          &nbsp; &nbsp;
          <Button color="falcon-primary" size="sm" onClick={handleNewUser}>
            New User
          </Button>
        </FalconCardHeader>
        <CardBody className="p-0">
          <UsersTable
            inactivate={filterOptions.inactivate}
            setEditUser={setEditUser}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </CardBody>

        {editUser && (
          <EditAccountModal
            user={editUser}
            onClose={onCloseEditUserModal}
            organizationOptions={organizationOptions}
          />
        )}
        {newUserModalVisible && (
          <NewAccountModal
            orgId={getOrgId(auth)}
            onClose={onCloseNewUserModal}
            organizationOptions={organizationOptions}
          />
        )}
      </Card>
    </>
  );
}

function OrgAccountFilter({ filter, setFilter }) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [inactivate, setInactivate] = useState(filter.inactivate);

  useEffect(() => {
    if (isPopupOpen) {
      setInactivate(filter.inactivate);
    }
  }, [isPopupOpen, filter]);

  return (
    <>
      <ButtonIcon
        id="filterOptions"
        icon="filter"
        transform="shrink-3 down-2"
        color="falcon-default"
        size="sm"
        className="mx-2"
        onClick={() => setPopupOpen((v) => !v)}
      >
        Filter
      </ButtonIcon>
      <Popover
        trigger="legacy"
        placement="bottom"
        target="filterOptions"
        isOpen={isPopupOpen}
      >
        <PopoverBody>
          <FormGroup className="form-check">
            <Input
              type="checkbox"
              name="inactivate-filter"
              id="inactivate-filter"
              defaultChecked={inactivate}
              onClick={({ target }) => {
                setInactivate(target.checked);
              }}
            />
            <Label for="inactivate-filter" check>
              Include Inactivate Users
            </Label>
          </FormGroup>

          <FormGroup className="d-flex justify-content-end">
            <Button
              color="secondary"
              size="sm"
              className="mr-2"
              onClick={() => setPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => {
                setFilter({
                  inactivate,
                });
                setPopupOpen(false);
              }}
            >
              Apply
            </Button>
          </FormGroup>
        </PopoverBody>
      </Popover>
    </>
  );
}

const EditAccountModal = ({ user, onClose, organizationOptions }) => {
  const [isLoading, setLoading] = useState(false);
  const [editUser, setEditUser] = useState({
    name: user.name,
    roles: user.roles,
    organizations: user.organizations.map((v) => ({
      ...v,
      isFixed: !organizationOptions.find(
        (organizationOption) =>
          organizationOption.organizationId === v.organizationId,
      ),
    })),
  });

  const roleOptions = useMemo(() => {
    return Object.values(_enum.UserRole).map(userRoleFormatter);
  }, []);

  const onSave = useCallback(() => {
    setLoading(true);
    updateOrganizationUser(user.organizationId, user.accountId, {
      ...editUser,
      organizations: editUser.organizations.map(
        ({ organizationId }) => organizationId,
      ),
    }).then((result) => {
      setLoading(false);
      if (result.success === true) {
        onClose(result.account);
        const accLabel =
          result.account.details?.name ||
          result.account.details?.displayName ||
          result.account.details?.email;

        toast.success(`${accLabel} account info has been updated!`, {
          theme: 'colored',
        });
      } else {
        toast.error(result.message, { theme: 'colored' });
      }
    });
  }, [user, editUser, onClose]);

  const onToggleActivation = useCallback(() => {
    setLoading(true);
    updateOrganizationUser(user.organizationId, user.accountId, {
      ...editUser,
      organizations: editUser.organizations.map(
        ({ organizationId }) => organizationId,
      ),
      status:
        user.status === Status.DISABLED ? Status.ENABLED : Status.DISABLED,
    }).then((result) => {
      setLoading(false);
      if (result.success === true) {
        onClose(result.account);

        const accLabel =
          result.account.details?.name ||
          result.account.details?.displayName ||
          result.account.details?.email;
        toast.success(
          result.account.status === Status.DISABLED
            ? `${accLabel} account has been deactivated!`
            : `${accLabel} account has been activated!`,
          { theme: 'colored' },
        );
      } else {
        toast.error(result.message, { theme: 'colored' });
      }
    });
  }, [user, onClose]);

  return (
    <Modal
      isOpen={true}
      onClosed={() => onClose()}
      centered={true}
      style={{ width: '500px' }}
    >
      <ModalHeader>Edit Account</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="name">Full name</Label>
          <Input
            id="name"
            onChange={(e) =>
              setEditUser({
                ...editUser,
                name: e.target.value,
              })
            }
            value={editUser.name || ''}
          />
        </FormGroup>
        <FormGroup>
          <Label for="email">Email</Label>
          <Input id="email" type="email" disabled value={user.email || ''} />
        </FormGroup>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            classNamePrefix=""
            label="Roles"
            placeholder="Select Roles"
            id="user-roles"
            options={roleOptions}
            value={(editUser.roles || []).map(userRoleFormatter)}
            onChange={(v) =>
              setEditUser({ ...editUser, roles: v.map((v) => v.value) })
            }
          />
        </FormGroup>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            classNamePrefix=""
            label="Organizations"
            placeholder="Select Organizations"
            id="user-organizations"
            options={organizationOptions}
            getOptionLabel={(v) => v.name}
            getOptionValue={(v) => v.organizationId}
            isClearable={editUser.organizations.some((v) => !v.isFixed)}
            value={editUser.organizations || []}
            onChange={(v, actionMeta) => {
              switch (actionMeta.action) {
                case 'remove-value':
                case 'pop-value':
                  if (actionMeta.removedValue.isFixed) {
                    return;
                  }
                  break;
                case 'clear':
                  v = actionMeta.removedValues.filter((v) => v.isFixed);
                  break;
                default:
                  break;
              }

              setEditUser({
                ...editUser,
                organizations: v,
              });
            }}
            styles={organizationSelectorStyles}
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button
          color={user.status === Status.DISABLED ? 'success' : 'danger'}
          className="btn mr-6"
          onClick={onToggleActivation}
        >
          {user.status === Status.DISABLED ? 'Activate' : 'Deactivate'}
        </Button>

        <Button color="primary" className="btn mr-4" onClick={onSave}>
          Save
        </Button>
        <Button className="btn" onClick={() => onClose()}>
          Cancel
        </Button>
      </ModalFooter>
      {isLoading && (
        <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-holder overlay">
          <Loader />
        </div>
      )}
    </Modal>
  );
};

const NewAccountModal = ({ orgId, onClose, organizationOptions }) => {
  const [isLoading, setLoading] = useState(false);
  const [userInfo, setEditUserInfo] = useState({
    email: '',
    name: '',
    roles: [],
    organizations: [],
  });

  const roleOptions = useMemo(() => {
    return Object.values(_enum.UserRole).map(userRoleFormatter);
  }, []);

  const onCreate = useCallback(() => {
    setLoading(true);
    createOrganizationUser(orgId, {
      ...userInfo,
      organizations: userInfo.organizations.map((v) => v.organizationId),
    }).then((result) => {
      setLoading(false);
      if (result.success === true) {
        onClose(result.account);
        toast.success('Sent an invitation email.', { theme: 'colored' });
      } else {
        toast.error(result.message, { theme: 'colored' });
      }
    });
  }, [orgId, userInfo, onClose]);

  return (
    <Modal
      isOpen={true}
      onClosed={() => onClose()}
      centered={true}
      style={{ width: '500px' }}
    >
      <ModalHeader>Create Account</ModalHeader>
      <ModalBody>
        <FormGroup>
          <Label for="name">Full name</Label>
          <Input
            id="name"
            onChange={(e) =>
              setEditUserInfo({
                ...userInfo,
                name: e.target.value,
              })
            }
            value={userInfo.name || ''}
          />
        </FormGroup>
        <FormGroup>
          <Label for="email">Email</Label>
          <Input
            id="email"
            type="email"
            onChange={(e) =>
              setEditUserInfo({
                ...userInfo,
                email: e.target.value.toLowerCase(),
              })
            }
            value={userInfo.email || ''}
          />
        </FormGroup>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            classNamePrefix=""
            label="Roles"
            placeholder="Select Roles"
            id="user-roles"
            options={roleOptions}
            value={(userInfo.roles || []).map(userRoleFormatter)}
            onChange={(v) =>
              setEditUserInfo({ ...userInfo, roles: v.map((v) => v.value) })
            }
          />
        </FormGroup>
        <FormGroup>
          <FilterSelect
            isMulti={true}
            classNamePrefix=""
            label="Additional Organizations"
            placeholder="Select Organizations"
            id="user-organizations"
            options={organizationOptions}
            getOptionLabel={(v) => v.name}
            getOptionValue={(v) => v.organizationId}
            value={userInfo.organizations || []}
            onChange={(v) =>
              setEditUserInfo({
                ...userInfo,
                organizations: v,
              })
            }
          />
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="primary" className="btn mr-4" onClick={onCreate}>
          Create
        </Button>
        <Button className="btn" onClick={() => onClose()}>
          Cancel
        </Button>
      </ModalFooter>
      {isLoading && (
        <div className="position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-holder overlay">
          <Loader />
        </div>
      )}
    </Modal>
  );
};

const userRoleFormatter = (role) => ({
  label: role.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase();
  }),
  value: role,
});

const organizationSelectorStyles = {
  multiValue: (base, state) => {
    return state.data.isFixed ? { ...base, backgroundColor: 'gray' } : base;
  },
  multiValueLabel: (base, state) => {
    return state.data.isFixed
      ? { ...base, fontWeight: 'bold', color: 'white', paddingRight: 6 }
      : base;
  },
  multiValueRemove: (base, state) => {
    return state.data.isFixed ? { ...base, display: 'none' } : base;
  },
};

function AccountHistory({ accounts }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterOptions, setFilterOptions] = useStateWithCallback({
    accounts: [],
    actionTypes: [],
    dateRange: null,
  });
  const router = useRouter();
  const isMountedRef = useRef(false);
  const isFiltersSetRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;
    isFiltersSetRef.current = false;

    (async () => {
      const currentFilters = { ...filterOptions };
      let filterOptionChanged = false;

      const queryAccounts =
        (query.accounts &&
          (Array.isArray(query.accounts)
            ? query.accounts
            : [query.accounts])) ||
        [];
      if (
        !compareArray(
          queryAccounts,
          currentFilters.accounts.map(({ value }) => value),
        )
      ) {
        currentFilters.accounts = (queryAccounts || []).map((acc) => ({
          value: acc,
          label: accounts[acc],
        }));
        filterOptionChanged = true;
      }

      const queryActionTypes =
        (query.actionTypes &&
          (Array.isArray(query.actionTypes)
            ? query.actionTypes
            : [query.actionTypes])) ||
        [];
      if (
        !compareArray(
          queryActionTypes,
          currentFilters.actionTypes.map(({ value }) => value),
        )
      ) {
        currentFilters.actionTypes = (queryActionTypes || []).map(
          (actionType) => ({
            value: actionType,
            label: UserAction[actionType],
          }),
        );
        filterOptionChanged = true;
      }

      if (
        !compareArray(
          query.dateRange,
          currentFilters.dateRange
            ? [
                currentFilters.dateRange.startDate.toISOString().substr(0, 10),
                currentFilters.dateRange.endDate.toISOString().substr(0, 10),
              ]
            : null,
        )
      ) {
        if (query.dateRange && query.dateRange[0] && query.dateRange[1]) {
          currentFilters.dateRange = {
            startDate: new Date(query.dateRange[0]),
            endDate: new Date(query.dateRange[1]),
          };
        } else {
          currentFilters.dateRange = null;
        }
        filterOptionChanged = true;
      }

      if (filterOptionChanged === true) {
        setFilterOptions(currentFilters, () => {
          isFiltersSetRef.current = true;
        });
      } else {
        isFiltersSetRef.current = true;
      }
    })();

    if (query.filter !== filter) {
      setFilter(query.filter || '');
    }
    if (query.sortBy !== sortBy) {
      setSortBy(query.sortBy || 'newest');
    }
    if (query.currentPage !== currentPage) {
      setCurrentPage(query.currentPage || 1);
    }
    if (query.pageSize !== pageSize) {
      setPageSize(query.pageSize || 25);
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current && isFiltersSetRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          view: 'history',
          accounts:
            filterOptions.accounts.length > 0
              ? filterOptions.accounts.length === 1
                ? filterOptions.accounts[0].value
                : filterOptions.accounts.map(({ value }) => value)
              : undefined,
          actionTypes:
            filterOptions.actionTypes.length > 0
              ? filterOptions.actionTypes.length === 1
                ? filterOptions.actionTypes[0].value
                : filterOptions.actionTypes.map(({ value }) => value)
              : undefined,
          dateRange: filterOptions.dateRange
            ? [
                filterOptions.dateRange.startDate.toISOString().substr(0, 10),
                filterOptions.dateRange.endDate.toISOString().substr(0, 10),
              ]
            : null,
          filter,
          sortBy: sortBy !== 'newest' ? sortBy : undefined,
          currentPage: currentPage !== 1 ? currentPage : undefined,
          pageSize: pageSize !== 25 ? pageSize : undefined,
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [
    filterOptions.accounts,
    filterOptions.actionTypes,
    filterOptions.dateRange?.startDate,
    filterOptions.dateRange?.endDate,
    filter,
    sortBy,
    currentPage,
    pageSize,
  ]);

  const debouncedChangeFilter = debounce((query) => {
    setFilter(query);
  }, 500);

  return (
    <Card>
      <FalconCardHeader title="Account History" light={false}>
        <>
          <InputGroup>
            <HistoryFilter
              accountOptions={accounts}
              filter={filterOptions}
              setFilter={setFilterOptions}
              loadLabelsOptions={loadLabelsOptions}
            />
            &nbsp; &nbsp;
            <InputGroupAddon addonType="prepend">
              <InputGroupText>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroupText>
            </InputGroupAddon>
            <Input
              placeholder="Search..."
              type="text"
              onChange={({ target }) => debouncedChangeFilter(target.value)}
            ></Input>
            &nbsp; &nbsp;
            <CustomInput
              type="select"
              id="sortBy"
              value={sortBy}
              onChange={({ target }) => setSortBy(target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </CustomInput>
          </InputGroup>
        </>
      </FalconCardHeader>
      <CardBody className="p-0">
        <AuditsTable
          filter={filter}
          contentType={filterOptions.contentTypeFilter}
          sortBy={sortBy}
          accounts={filterOptions.accounts}
          actionTypes={filterOptions.actionTypes}
          dateRange={filterOptions.dateRange}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
        />
      </CardBody>
    </Card>
  );
}

function HistoryFilter({ filter, setFilter, accountOptions }) {
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [accounts, setAccounts] = useState(filter.accounts);
  const [actionTypes, setActionTypes] = useState(filter.actionTypes);
  const [[startDate, endDate], setDateRangeChange] = useState([
    filter.dateRange?.startDate,
    filter.dateRange?.endDate,
  ]);

  const accountListingOptions = useMemo(() => {
    return Object.keys(accountOptions).map((key) => ({
      value: key,
      label: accountOptions[key],
    }));
  }, [accountOptions]);
  const actionTypeListingOptions = useMemo(() => {
    return Object.keys(UserAction).map((key) => ({
      value: key,
      label: UserAction[key],
    }));
  }, [UserAction]);

  useEffect(() => {
    if (isPopupOpen) {
      setAccounts(filter.accounts);
      setActionTypes(filter.actionTypes);
      setDateRangeChange([
        filter.dateRange?.startDate,
        filter.dateRange?.endDate,
      ]);
    }
  }, [isPopupOpen, filter]);

  return (
    <>
      <ButtonIcon
        id="filterOptions"
        icon="filter"
        transform="shrink-3 down-2"
        color="falcon-default"
        size="sm"
        className="mx-2"
        onClick={() => setPopupOpen((v) => !v)}
      >
        Filter
      </ButtonIcon>
      <Popover
        trigger="legacy"
        placement="bottom"
        target="filterOptions"
        isOpen={isPopupOpen}
      >
        <PopoverBody>
          <FormGroup>
            <FilterSelect
              label="Accounts"
              placeholder="Select Accounts..."
              value={accounts}
              onChange={(value) => {
                setAccounts(value);
              }}
              options={accountListingOptions}
              isMulti
            />
          </FormGroup>
          <FormGroup>
            <FilterSelect
              label="Action Types"
              placeholder="Select Action Types..."
              value={actionTypes}
              onChange={(value) => {
                setActionTypes(value);
              }}
              options={actionTypeListingOptions}
              isMulti
            />
          </FormGroup>

          <FormGroup>
            <Label for="date-range">Date Range</Label>
            <DatePicker
              id="date-range"
              selectsRange
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              scrollableYearDropdown
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => {
                setDateRangeChange(update);
              }}
              isClearable={true}
            />
          </FormGroup>

          <FormGroup className="d-flex justify-content-end">
            <Button
              color="secondary"
              size="sm"
              className="mr-2"
              onClick={() => setPopupOpen(false)}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onClick={() => {
                setFilter({
                  accounts,
                  actionTypes,
                  dateRange:
                    startDate && endDate ? { startDate, endDate } : null,
                });
                setPopupOpen(false);
              }}
            >
              Apply
            </Button>
          </FormGroup>
        </PopoverBody>
      </Popover>
    </>
  );
}

function AccountHistoryWrapper() {
  const auth = useAuth();
  const { isLoading: isAccountsLoading, data: accountsData } = useOrgAccounts(
    getOrgId(auth),
    false,
  );
  const accountDictionary = useMemo(() => {
    if (accountsData) {
      return accountsData.accounts.reduce(
        (acc, account) => ({
          ...acc,
          [account.email]: `${
            account.details.name || account.details.displayName || ''
          } <${account.email}>`,
        }),
        {},
      );
    }
    return null;
  }, [accountsData]);

  return isAccountsLoading || !accountsData?.accounts ? (
    <PageLoader />
  ) : (
    <AccountHistory accounts={accountDictionary} />
  );
}

const AccountHistoryView = requireRoles(
  AccountHistoryWrapper,
  getRouteRoles('/manage-users?view="history"'),
);

function ManageUsers() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(router.query.view || 'manage');

  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const { query } = router;

    if (query.view !== activeTab) {
      setActiveTab(query.view || 'manage');
    }
  }, [router]);

  useEffect(() => {
    if (isMountedRef.current) {
      const { query } = router;

      const newQuery = filterNullValues(
        {
          ...query,
          view: activeTab,
        },
        [undefined, null, ''],
      );

      if (!isEqual(newQuery, query)) {
        router.push({
          query: newQuery,
        });
      }
    }
  }, [activeTab]);

  const toggle = (tab) => {
    if (activeTab !== tab) setActiveTab(tab);
  };

  return (
    <Card>
      <Nav tabs>
        <NavItem className="cursor-pointer">
          <NavLink
            className={classNames({ active: activeTab === 'manage' })}
            onClick={() => {
              toggle('manage');
            }}
          >
            Manage Users
          </NavLink>
        </NavItem>
        <NavItem className="cursor-pointer">
          <NavLink
            className={classNames({ active: activeTab === 'history' })}
            onClick={() => {
              toggle('history');
            }}
          >
            Account History
          </NavLink>
        </NavItem>
      </Nav>
      {activeTab === 'manage' ? (
        <ManageUsersView />
      ) : activeTab === 'history' ? (
        <AccountHistoryView />
      ) : null}
    </Card>
  );
}

export default requireRoles(ManageUsers, getRouteRoles('/manage-users'));
