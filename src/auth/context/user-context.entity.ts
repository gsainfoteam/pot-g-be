export class UserContext {
  private readonly _userId: string;
  private readonly _devicePk: string;

  get userId(): string {
    return this._userId;
  }

  get devicePk(): string {
    return this._devicePk;
  }

  constructor(userId: string, devicePk: string) {
    this._userId = userId;
    this._devicePk = devicePk;
  }
}
