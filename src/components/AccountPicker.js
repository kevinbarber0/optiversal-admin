import { useMemo } from 'react';
import { useOrgAccountsForFilter } from '@util/api';
import FilterSelect from './FilterSelect';

export default function AccountPicker(props) {
  const { accounts, onChange, orgId, label, ...others } = props;
  const { isLoading: isAccountsLoading, data: accountsData } =
    useOrgAccountsForFilter(orgId);
  const accountOptions = useMemo(() => {
    return (
      accountsData?.accounts
        .filter((account) => !account.disabled)
        .map((account) => {
          return {
            value: account.accountId,
            label: `${account.name || ''}(${account.email})`,
          }
        })
    );
  }, [accountsData]);
  
  return (
    <FilterSelect
      label={label}
      placeholder="Select account..."
      value={accounts}
      onChange={(value) => onChange(value)}
      defaultOptions
      isClearable={true}
      isLoading={isAccountsLoading}
      options={accountOptions}
      {...others}
    />
  );
}
