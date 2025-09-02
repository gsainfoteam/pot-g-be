import { UserEntity } from "@src/user/model/user.entity";
import { BankEntity } from "@src/accounting/model/bank.entity";

export class UserBankEntity {
  userFk?: string;
  userEntity?: UserEntity;
  bankFk?: string;
  bankEntity?: BankEntity;
  account: string;
}
