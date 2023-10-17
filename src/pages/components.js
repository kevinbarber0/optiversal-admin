import ComponentsTable from '@components/ComponentsTable';
import FalconCardHeader from '@components/common/FalconCardHeader';
import { InputGroup, Card, CardBody } from 'reactstrap';
import { ForwardRefButtonIcon } from '@components/common/ButtonIcon';
import Link from 'next/link';
import { requireAdmin } from '@util/auth.js';


function ManageComponents() {
  return (
    <>
      <Card className="mb-3">
        <FalconCardHeader title="Components" light={false}>
          <InputGroup>
            <Link href="/component/add">
              <ForwardRefButtonIcon
                icon="plus"
                transform="shrink-3 down-2"
                color="falcon-default"
                size="sm"
              >
                New
              </ForwardRefButtonIcon>
            </Link>
          </InputGroup>
        </FalconCardHeader>
        <CardBody className="p-0">
          <ComponentsTable />
        </CardBody>
      </Card>
    </>
  );
}

export default requireAdmin(ManageComponents);
