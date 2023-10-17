import React from 'react';
import ContentTemplatesTable from '@components/ContentTemplatesTable';
import FalconCardHeader from '@components/common/FalconCardHeader';
import { InputGroup, Card, CardBody } from 'reactstrap';
import ButtonIcon from '@components/common/ButtonIcon';
import Link from 'next/link';
import { requireAdmin } from '@util/auth.js';

function ManageContentTemplates() {
  return (
    <>
      <Card className="mb-3">
        <FalconCardHeader title="Content Templates" light={false}>
          <InputGroup>
            <Link href="/contenttemplate/add">
              <ButtonIcon
                icon="plus"
                transform="shrink-3 down-2"
                color="falcon-default"
                size="sm"
              >
                New
              </ButtonIcon>
            </Link>
          </InputGroup>
        </FalconCardHeader>
        <CardBody className="p-0">
          <ContentTemplatesTable />
        </CardBody>
      </Card>
    </>
  );
}

export default requireAdmin(ManageContentTemplates);
