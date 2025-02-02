enum HostMessageCode {
  Alert = 0,
  Normal = 1,
  NewUpdate = 2,
  Reboot = 3,
  UpdateApp = 4,
  UpdateReboot = 5,
  PostDelivery = 6,
  CancelPostDelivery = 7,
  Broadcast = 8,
  SyncTime = 9,
  ActivateMessageboard = 10,
  SyncDisplayOff = 11,
}

export default HostMessageCode;
