import { IpcMainEvent } from 'electron';
import { IpcChannel } from '../IpcChannel';
import { MessageboardUpdateRequest } from '../../../common/ipc/request/MessageboardUpdateRequest';

export default class MessageboardUpdateChannel implements IpcChannel {
  readonly name = 'messageboard-update';

  private event?: IpcMainEvent;

  private request?: MessageboardUpdateRequest;

  handle(
    event: Electron.IpcMainEvent,
    request: MessageboardUpdateRequest
  ): void {
    this.event = event;
    this.request = request;
  }

  reply() {
    if (this.event && this.request) {
      this.event.reply(this.request.responseChannel);
    }
  }
}
