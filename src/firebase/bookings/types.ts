import { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";

export interface BookingDoc {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  returned: boolean;
  owner: string;
}

export interface Booking {
  id: string;
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs;
  returned: boolean;
  owner: string;
}
