import { IpcMainEvent } from 'electron';
import { IpcChannel } from '../IpcChannel';
import { FetchContentRequest } from '../../../common/ipc/request/FetchContentRequest';
import { FetchContentResponse } from '../../../common/ipc/response/FetchContentResponse';
import { TimetableChecker } from '../../providers/timetable-checker';
import { Content } from '../../../common/models/delivery';

export default class FetchContentChannel implements IpcChannel {
  readonly name = 'fetch-content';

  private event?: IpcMainEvent;

  private request?: FetchContentRequest;

  private timetableChecker: TimetableChecker;

  constructor() {
    this.timetableChecker = TimetableChecker.Instance;
    this.timetableChecker.on('content-change', this.sendUpdate);
  }

  handle(event: IpcMainEvent, request: FetchContentRequest): void {
    this.event = event;
    this.request = request;
    this.sendUpdate(this.timetableChecker.content);
  }

  private sendUpdate = (content?: Content): void => {
    if (this.event && this.request) {
      const response: FetchContentResponse = {
        content,
      };
      this.event.reply(this.request.responseChannel, response);
    }
  };
}
