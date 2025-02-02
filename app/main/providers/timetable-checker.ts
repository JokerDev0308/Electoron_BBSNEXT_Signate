import path from 'path';
import {RESOURCES_PATH} from '../../common/constants/path';
import {execSync} from 'child_process';
import moment from 'moment';
import { EventEmitter } from 'events';
import lodash from 'lodash';
import PriorityType from '../enums/priority-type';
import {
  Content,
  Delivery,
  DeliveryTimeTable,
  Timetable
} from '../../common/models/delivery';
import ContentMode from '../enums/content-mode';
import writeLog from '../util/logger';
import LogType from '../../common/constants/log-type';
import {
  NO_CONTENT_FOUND,
  NO_TIMETABLE_FOUND,
  PLAYING_CONTENT
} from '../../common/constants/log-messages';
import toastMessageChannel from '../ipc/channels/ToastMessageChannel';
import {
  DISPLAY_POWER_ON
} from '../../common/constants/toast-messages';
import { updateSetting } from './settings';
import SettingsKeys from '../enums/settings-keys';

export class TimetableChecker extends EventEmitter {
  private static instance: TimetableChecker;

  private readonly CHECK_INTERVAL = 1000;

  private currentMode = ContentMode.Normal;

  private deliveryData?: Delivery;

  private currentContent?: Content;

  private currentTimetable?: Timetable;

  private timer?: NodeJS.Timeout;

  private isDispayOff: number = 0;
  private currentDisplayPower: boolean = true;

  private constructor() {
    // Prohibit instantiating using new keyword.
    // Use TimetableChecker.Instance instead.
    super();
  }

  static get Instance(): TimetableChecker {
    if (!TimetableChecker.instance) {
      TimetableChecker.instance = new TimetableChecker();
    }
    return TimetableChecker.instance;
  }

  get content(): Content | undefined {
    return this.currentContent;
  }

  get delivery(): Delivery | undefined {
    return this.deliveryData;
  }

  set delivery(delivery: Delivery | undefined) {
    this.deliveryData = delivery;

    if (this.deliveryData) {
      this.deliveryData.normal.deliveryTimetables.sort(
        (a: DeliveryTimeTable, b: DeliveryTimeTable) => a.priority - b.priority
      );
    }
  }

  set mode(mode: ContentMode) {
    this.currentMode = mode;
  }

  set displayOff(isDispayOff: number){
    this.isDispayOff = isDispayOff;
    //this.checkDisplayPower();
  }

  startChecker() {
    // We need the first check so that if checker gets undefined value
    // for the first time, it will log and emit the changes
    this.checkTimetableContent(true);

    // Alert content is scheduled for 24hrs display.
    // So, only run the timer if Normal mode.
    if (this.currentMode === ContentMode.Normal) {
      this.timer = setInterval(() => {
        this.checkTimetableContent(false);
      }, this.CHECK_INTERVAL);
    }
  }

  stopChecker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  restartChecker(): void {
    this.stopChecker();
    this.startChecker();
    //
    this.checkDisplayPower();
  }

  private checkTimetableContent = (firstCheck: boolean): void => {

    const timetable = this.getTimeTable();
    if (!lodash.isEqual(this.currentTimetable, timetable) || firstCheck) {
      if (!timetable) {
        writeLog(LogType.INFO, NO_TIMETABLE_FOUND);
      }
      this.currentTimetable = timetable;
    }

    const content = this.getCurrentContent();
    if (!lodash.isEqual(this.currentContent, content) || firstCheck) {
      if (!content) {
        writeLog(LogType.INFO, NO_CONTENT_FOUND);
      } else {
        writeLog(LogType.INFO, `「${content.title}」${PLAYING_CONTENT}`);
      }
      this.currentContent = content;
      this.emit('content-change', content);
    }

    // [表示中の時間割]
    if (this.currentTimetable) {
      updateSetting(SettingsKeys.CurrentTimetableName, this.currentTimetable.title).then();
    } else {
      updateSetting(SettingsKeys.CurrentTimetableName, '').then();
    }
    if (this.currentContent && this.currentContent.title) {
      updateSetting(SettingsKeys.CurrentContentName, this.currentContent.title).then();
    } else {
      updateSetting(SettingsKeys.CurrentContentName, '（なし）').then();
    }
    //
    if(!firstCheck){
      this.checkDisplayPower();
    }

  };

  private checkDisplayPower(){
    //console.log('displayPower: '+this.currentDisplayPower);
    if(!this.isDispayOff){
      // ディスプレイ制御なし：電源が落ちていた場合を考慮して電源ONの処理を行う
      if(!this.currentDisplayPower){
        this.doDisplayPowerOn();
      }
      return;
    }
    const content = this.currentContent;
    let isEmpty = false;
    if(!content){
      //console.log('empty contents (no content)');
      isEmpty = true;
    }else if(!content.pages || content.pages.length === 0){
      isEmpty = true;
      //console.log('empty contents (no page)');
    }else if(content.pages.length === 1 && content.pages[0].assets.length === 0){
      isEmpty = true;
      //console.log('empty contents (no asset)');
    }
    if(this.currentMode === ContentMode.Normal){
      if(isEmpty && this.currentDisplayPower){
        this.doDisplayPowerOff();
      }else if(!isEmpty && !this.currentDisplayPower){
        this.doDisplayPowerOn();
      }
    }else{
      // 差込時は常にON
      if(!this.currentDisplayPower) {
        this.doDisplayPowerOn();
      }
    }
  }
  async doDisplayPowerOn(){
    this.currentDisplayPower = true;
    const command = '"'+this.getExecFullPath('exec_ps.bat')+'" "'+this.getExecFullPath('display_on.ps1'+'"');
    writeLog(LogType.INFO, 'ディスプレイの電源をONにします: '+command);
    execSync(command);
    //this.checkTimetableContent(false);

    // 実行後にトースト表示
    toastMessageChannel.send(DISPLAY_POWER_ON);
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待つ
    this.emit('display-power-on');
  }
  private doDisplayPowerOff(){
    this.currentDisplayPower = false;
    const command = '"'+this.getExecFullPath('exec_ps.bat')+'" "'+this.getExecFullPath('display_off.ps1'+'"');
    writeLog(LogType.INFO, 'ディスプレイの電源をOFFにします: '+command);
    execSync(command);
  }
  private getExecFullPath(fileName: string): string {
    return path.join(RESOURCES_PATH, 'shell', fileName);
  }

  private getCurrentContent = (): Content | undefined => {
    if (!this.currentTimetable) return undefined;

    
    const currTime = moment(new Date()).format('HH:mm');
    // Get content for current time
    return this.currentTimetable.contents.find(
      (c: Content) =>
        c.startTime === currTime ||
        (c.startTime <= currTime && c.endTime > currTime)
    );
  };

  private getTimeTable = (): Timetable | undefined => {
    if (!this.deliveryData) return undefined;

    const deliveryMode =
      this.currentMode === ContentMode.Normal
        ? this.deliveryData.normal
        : this.deliveryData.alert;

    const schedule = this.getDeliveryTimeTableByPriority(
      deliveryMode.deliveryTimetables
    );

    if (!schedule) {
      return undefined;
    }

    // [配信済みのスケジュール]
    updateSetting(SettingsKeys.CurrentDeliveryName, this.deliveryData.normal.title).then();

    // [表示中のモード]
    updateSetting(SettingsKeys.CurrentMode, this.currentMode === ContentMode.Normal ? '通常' : '差込').then();

    // [配信済の差込コンテンツ]
    if (this.deliveryData.alert == null || this.deliveryData.alert.timetables.length == 0) {
      updateSetting(SettingsKeys.AlertContentName, '（なし）').then();
    } else {
      if(this.deliveryData.alert.timetables[0].contents[0].title){
        updateSetting(SettingsKeys.AlertContentName, this.deliveryData.alert.timetables[0].contents[0].title).then();
      } else {
        updateSetting(SettingsKeys.AlertContentName, '（なし）').then();
      }
    }


    return deliveryMode.timetables.find(
      (timetable: Timetable) => timetable.id === schedule.timetableId
    );
  };

  private getDeliveryTimeTableByPriority = (
    deliveryTimetables: DeliveryTimeTable[]
  ): DeliveryTimeTable | undefined => {
    for (let i = 0; i < deliveryTimetables.length; i += 1) {
      const data = deliveryTimetables[i];
      switch (data.priority) {
        case PriorityType.DATE:
          if (this.checkByDate(data.date)) {
            return data;
          }
          break;
        case PriorityType.DAY_NUMBER:
          if (this.checkByDayNumber(data.dayNumber)) {
            return data;
          }
          break;
        case PriorityType.DAY_OF_WEEK:
          if (this.checkByDayOfWeek(data.dayOfWeek)) {
            return data;
          }
          break;
        case PriorityType.SPAN:
          if (this.checkBySpan(data.startDate, data.endDate)) {
            return data;
          }
          break;
        default:
          return data;
      }
    }
    return undefined;
  };

  private checkByDate = (date: string): boolean => {
    return date === moment(new Date()).format('YYYY-MM-DD');
  };

  private checkByDayNumber = (dayNumber: string): boolean => {
    const today = moment(new Date(), 'YYYY-MM-DD').format('D');
    const lastDigit = Number(today) % 10;
    return Number(dayNumber) === lastDigit;
  };

  private checkByDayOfWeek = (dayOfWeek: string): boolean => {
    const dayToday = moment(new Date(), 'YYYY-MM-DD')
      .format('dddd')
      .toLowerCase();
    return dayOfWeek === dayToday;
  };

  private checkBySpan = (startDate: string, endDate: string): boolean => {
    const today = moment(new Date()).format('YYYY-MM-DD');
    return moment(today).isBetween(startDate, endDate, undefined, '[]');
  };
}

export declare interface TimetableChecker {
  on(event: 'content-change', callback: (content?: Content) => void): this;
  on(event: 'display-power-on', callback: () => void): this;
}
