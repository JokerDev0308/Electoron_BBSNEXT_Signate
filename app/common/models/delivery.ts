import ActionType from '../constants/action-type';
import AssetType from '../constants/asset-type';

export interface Delivery {
  normal: DeliveryMode;
  alert: DeliveryMode;
}

export interface DeliveryMode {
  id: number;
  title: string;
  deliveryTimetables: DeliveryTimeTable[];
  timetables: Timetable[];
  toInsertion?: number;
  insertionStartDatetime?: string;
  insertionEndDatetime?: string;
}

export interface Timetable {
  id: number;
  title: string;
  contents: Content[];
}

export interface DeliveryTimeTable {
  type: string;
  priority: number;
  dayNumber: string;
  dayOfWeek: string;
  startDate: string;
  endDate: string;
  date: string;
  timetableId: number;
}

export interface Content {
  id: number;
  title: string;
  width: number;
  height: number;
  startTime: string;
  endTime: string;
  pages: Page[];
}

export interface Page {
  number: number;
  bgColor?: string;
  actionType?: ActionType;
  actionPage?: number;
  actionDuration?: number;
  assets: PageAsset[];
}

export interface PageAsset {
  type: AssetType;
  src: string | SlideshowAsset[];
  fileName?: string;
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  link?: number;
  linkType?: string;
  dateFormat: string;
  timeFormat: string;
  countFormat: string;
  countType: string;
  baseDate: string;
  weekFormat: string;
  qrImage: string,
  pageCount?: number;
  pageTransition?: number;
  toneEnabled?: number;
  messageboardType?: number;
  dispTitle?: number;
  messageCount?: number;
  md5Sum?: string;
  filePath?: string;
}

export interface SlideshowAsset {
  type: string;
  src: string;
  md5Sum?: string;
  transitionType?: string;
  duration: number;
  filePath?: string;
}
