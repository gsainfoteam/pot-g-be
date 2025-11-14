export class ManagerContext {
  private readonly _email: string;

  get email(): string {
    return this._email;
  }

  constructor(email: string) {
    this._email = email;
  }
}
