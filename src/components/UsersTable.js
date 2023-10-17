import React, { useMemo } from 'react';
import { getOrgId } from '@helpers/auth';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { dateTimeFormatter } from '@helpers/formatter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '@util/auth.js';
import { useOrgAccounts } from '@util/api';

const UsersTable = ({
  inactivate,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  setEditUser,
}) => {
  const auth = useAuth();

  const { isLoading: isAccountsLoading, data: accountsData } = useOrgAccounts(
    getOrgId(auth),
    inactivate,
  );

  const columns = [
    {
      dataField: 'name',
      text: 'Name',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'email',
      text: 'Email',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'dateAdded',
      text: 'Date Created',
      classes: 'border-0 align-middle',
      formatter: (v) => dateTimeFormatter(v),
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'accountId',
      text: '',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
      formatter: (cell, row) => {
        return (
          <FontAwesomeIcon icon={faEdit} onClick={() => setEditUser(row)} />
        );
      },
    },
  ];

  const sortedAccountsData = useMemo(() => {
    return accountsData
      ? accountsData.accounts.sort((a, b) => {
          if (a.details.disabled !== true && b.details.disabled === true) {
            return -1;
          }
          return a.name > b.name ? 1 : a.name < b.name ? -1 : 0;
        })
      : [];
  }, [accountsData]);

  return (
    <>
      {!isAccountsLoading && accountsData && accountsData.success && (
        <>
          <PaginatedDataTable
            keyField="accountId"
            data={sortedAccountsData}
            totalCount={sortedAccountsData.totalCount}
            columns={columns}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            setPageSize={setPageSize}
          />
        </>
      )}
      {isAccountsLoading && <Loader></Loader>}
    </>
  );
};

export default UsersTable;
