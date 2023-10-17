import { useMemo } from 'react';
import { useGetOrgGeoLocations } from '@util/api';
import FilterSelect from './FilterSelect';

export default function LocationPicker(props) {
  const { location, onChange, label, ...others } = props;
  const { isLoading: isLocationLoading, data: locationData } =
    useGetOrgGeoLocations();
  const locationOptions = useMemo(() => {
    return locationData?.locations.map((location) => {
      return {
        value: location.locationId,
        locData: (({ state, city }) => ({ state, city }))(location),
        label: location.name,
      };
    });
  }, [locationData]);

  return (
    <FilterSelect
      label={label}
      placeholder="Select a location..."
      value={location}
      onChange={(value) => onChange(value)}
      defaultOptions
      isClearable={true}
      isLoading={isLocationLoading}
      options={locationOptions}
      {...others}
    />
  );
}
