export class UserEntity {
  pk?: string;
  isDeleted: boolean = false;
  idpSub: string;
  name: string;
  email: string;
  createdAt?: Date = new Date();
  updatedAt?: Date = new Date();
}
