export class UserContext {
  private readonly _userId: string;
  private readonly _deviceId: string;

  get userId(): string {
    return this._userId;
  }

  get deviceId(): string {
    return this._deviceId;
  }

  constructor(userId: string, deviceId: string) {
    this._userId = userId;
    this._deviceId = deviceId;
  }
}
