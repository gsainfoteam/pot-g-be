import { UserEntity } from "@src/database/entity/user.entity";
import { BankEntity } from "@src/database/entity/bank.entity";

export class UserBankEntity {
  userFk?: string;
  userEntity?: UserEntity;
  bankFk?: string;
  bankEntity?: BankEntity;
  account: string;
}
