import React, { useState, useEffect } from 'react';
import Loader from '@components/common/Loader';
import PaginatedDataTable from '@components/common/PaginatedDataTable';
import { useGetOrgGeoLocations } from '@util/api';

const GeoLocationsTable = ({ inputContent }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [dataLocations, setDataLocations] = useState();
  const [dataLocationsCount, setDataLocationsCount] = useState();

  const { isLoading, data: dataOrgGeo } = useGetOrgGeoLocations();

  useEffect(() => {
    if (!dataOrgGeo?.locations) return;
    if (inputContent && inputContent.length > 0) {
      setDataLocations(inputContent);
      setDataLocationsCount(inputContent.length);
    } else {
      setDataLocations(dataOrgGeo.locations);
      setDataLocationsCount(dataOrgGeo.locations.length);
    }
  }, [dataOrgGeo, inputContent]);

  const columns = [
    {
      dataField: 'name',
      text: 'Name',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'city',
      text: 'City',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'state',
      text: 'State',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'latitude',
      text: 'Latitude',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
    {
      dataField: 'longitude',
      text: 'Longitude',
      classes: 'border-0 align-middle',
      headerClasses: 'border-0',
      sort: false,
    },
  ];

  return (
    <>
      {!isLoading && dataLocationsCount > 0 && (
        <PaginatedDataTable
          keyField="name"
          data={dataLocations}
          totalCount={dataLocationsCount}
          columns={columns}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          setPageSize={setPageSize}
          config={{ pageOptions: [5] }}
          remote={false}
        />
      )}
      {isLoading && <Loader></Loader>}
    </>
  );
};

export default GeoLocationsTable;
