export default class Heartbeat {
  sender?: string;

  serialNumber?: string;

  macAddress?: string;

  ipAddress?: string;

  manufacturer?: string;

  osVersion?: string;

  signageVersion?: string;

  normalDeliveryId?: number;

  alertContentId?: number;

  status?: number;

  totalDownload?: number;

  completedCount?: number;

  syncTimeStatus?: string;

  messageboardEnabled = false;

  messageboardSerialKey?: string;

  deliveryMode?: string;

  is_displayoff?: number;

  availableReply?: number;
  availableDisplayOff?: number;

  syncDisplayOffStatus?: string;

  availableInsertionContents?: number;
  insertionStartDatetime?: string;
  insertionEndDatetime?: string;

}
