import { UserEntity } from "@src/database/entity/user.entity";

export class UserConsentEntity {
  userFk: string;
  user?: UserEntity;
  term: string;
  createdAt?: Date;
  updatedAt?: Date;
}
