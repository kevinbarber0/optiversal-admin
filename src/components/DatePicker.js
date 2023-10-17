import DatePicker from 'react-datepicker';
import { Input } from 'reactstrap';
import 'react-datepicker/dist/react-datepicker.css';

export default function CustomDatePicker(props) {
  return <DatePicker {...props} customInput={<Input />} />;
}
