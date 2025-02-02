import ResponseStatus from '../enums/response-status';

export interface ApiResult {
  status: ResponseStatus;
  message: string | MessageResponse;
}

export interface MessageResponse {
  currentPage?: number;
  totalCount: number;
  messages: Message[];
}

export interface Message {
  id: number;
  uid: number;
  hostId: string;
  deviceName: string;
  senderName: string;
  serialNumber: string;
  message: string;
  isImportant: boolean;
  isPinned: boolean;
  status: number;
  expiredAt: string;
  timeSent: string;
  attachments: Attachment[];
  replyTexts: ReplyText[];
  replyNumber: number;
}

export interface Attachment {
  assetId: number;
  name: string;
  md5Sum: string;
  url: string;
}

export interface ReplyText {
  text: string;
}