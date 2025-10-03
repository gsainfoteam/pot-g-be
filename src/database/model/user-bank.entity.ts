import { UserEntity } from "@src/database/model/user.entity";
import { BankEntity } from "@src/database/model/bank.entity";

export class UserBankEntity {
  userFk?: string;
  userEntity?: UserEntity;
  bankFk?: string;
  bankEntity?: BankEntity;
  account: string;
}
