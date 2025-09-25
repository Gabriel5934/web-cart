import { Dayjs } from "dayjs";
import { Timestamp } from "firebase/firestore";

export interface BookingDoc {
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Timestamp;
  returned: boolean;
  owner: string;
}

export interface Booking {
  device: string;
  name: string;
  partner: string;
  place: string;
  date: Dayjs;
  returned: boolean;
  owner: string;
}
