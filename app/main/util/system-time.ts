import { exec } from 'child_process';
import SyncTimeStatus from '../enums/sync-time-status';

export default function updateSystemTime(
  dateTime: string,
  callback: (status: SyncTimeStatus) => void
): void {
  const setDateCommand = `SET-DATE ${dateTime}`;
  const command = `Start-Process powershell \`
      -Verb runAs \`
      -ArgumentList '-Command ${setDateCommand}' \`
      -Windowstyle hidden`;

  exec(command, { shell: 'powershell' }, (error) => {
    if (error) {
      callback(SyncTimeStatus.FAILED);
    } else {
      callback(SyncTimeStatus.SUCCESS);
    }
  });
}
