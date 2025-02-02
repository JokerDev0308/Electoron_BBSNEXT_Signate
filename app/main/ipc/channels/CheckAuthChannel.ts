import { IpcMainEvent } from 'electron';
import { IpcChannel } from '../IpcChannel';
import { AuthRequest } from '../../../common/ipc/request/AuthRequest';
import { AuthResponse } from '../../../common/ipc/response/AuthResponse';
import AuthStatus from '../../enums/auth-status';
import { isAppAuthenticated } from '../../providers/authentication';

export default class CheckAuthChannel implements IpcChannel {
  readonly name = 'check-authentication';

  handle = async (event: IpcMainEvent, request: AuthRequest) => {
    const status = await isAppAuthenticated()
      ? AuthStatus.ACTIVATED
      : AuthStatus.DEACTIVATED;

    const response: AuthResponse = { status };
    event.reply(request.responseChannel, response);
  };
}
