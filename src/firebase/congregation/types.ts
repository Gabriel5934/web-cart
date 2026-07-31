export interface Congregation {
  backgroundImage: string;
  devices: string[];
  id: string;
  /** Day.js weekday numbers: 0 (Sunday) through 6 (Saturday). */
  meetingsWeekDays?: number[];
  /** Meeting times in HH:mm format, matched to meetingsWeekDays by index. */
  meetingsTimes?: string[];
  /** Day.js weekday numbers for ministry arrangements. */
  ministryWeekDays?: number[];
  /** Ministry arrangement times in HH:mm, matched by index. */
  ministryTimes?: string[];
  /** Meeting point by index: 0 territory, 1 congregation, 2 groups. */
  ministryMeetingPoints?: Array<0 | 1 | 2>;
  name: string;
  places: string[];
  whatsapp: string;
}
