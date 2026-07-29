export interface PhoneBookEntry {
  authUid: string;
  congregation: string;
  role: "admin" | "user";
  firstName: string;
  lastName: string;
  displayName: string;
  phoneNumber: string;
}
