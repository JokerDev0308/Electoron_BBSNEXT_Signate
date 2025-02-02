import { IpcMainEvent } from 'electron';
import { IpcChannel } from '../IpcChannel';
import { ToastMessageRequest } from '../../../common/ipc/request/ToastMessageRequest';
import { ToastMessageResponse } from '../../../common/ipc/response/ToastMessageResponse';

class ToastMessageChannel implements IpcChannel {
  readonly name = 'toast-message';

  private event?: IpcMainEvent;

  private request?: ToastMessageRequest;

  private pending: string[] = [];

  handle = (event: Electron.IpcMainEvent, request: ToastMessageRequest) => {
    this.event = event;
    this.request = request;

    this.pending.forEach((message) => this.send(message));
    this.pending = [];
  };

  send(message: string) {
    if (this.event && this.request) {
      const response: ToastMessageResponse = {
        message,
      };
      this.event.reply(this.request.responseChannel, response);
    } else {
      this.pending.push(message);
    }
  }
}

export default new ToastMessageChannel();
