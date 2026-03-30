import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { users } from "../../../drizzle/schema/users";
import { and, eq, inArray } from "drizzle-orm";
import { UserEntity } from "@src/database/entity/user.entity";
import { userAlarmSetting } from "../../../drizzle/schema/user-alarm-setting";
import { bank } from "../../../drizzle/schema/bank";
import { userBank } from "../../../drizzle/schema/user-bank";
import { TxType } from "@src/global/types/tx.types";
import { randomUUID } from "node:crypto";
import { PotgDBError } from "@src/global/exceptions/potg-db.error";

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM user WHERE pk = ?1 and is_deleted = false;
   */
  async findUserByPk(pk: string): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.pk, pk), eq(users.isDeleted, false)));

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    return {
      pk: user.pk,
      isDeleted: user.isDeleted,
      idpSub: user.idpSub,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /*
  SELECT * FROM user WHERE idp_sub = ?1 and is_deleted = false;
   */
  async findUserByIdpSub(idpSub: string): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(and(eq(users.idpSub, idpSub), eq(users.isDeleted, false)));

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    return {
      pk: user.pk,
      isDeleted: user.isDeleted,
      idpSub: user.idpSub,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /*
  SELECT u.pk, u.name, u.email,
         uas.chat_push,
         uas.marketing_push,
         uas.pot_in_out_push,
         b.bank_short_name,
         ub.account
  FROM user as u
    INNER JOIN user_alarm_setting as uas ON uas.device_fk = ?2
    LEFT OUTER JOIN user_bank as ub ON ub.user_fk = u.pk
    LEFT JOIN bank as b ON b.pk = ub.bank_fk
  WHERE pk = ?1 and u.is_deleted = false;
   */
  async getUserInfoByPk(userId: string, deviceId: string) {
    const result = await this.dbService.db
      .select({
        pk: users.pk,
        name: users.name,
        email: users.email,
        chatPush: userAlarmSetting.chatPush,
        marketingPush: userAlarmSetting.marketingPush,
        potInOutPush: userAlarmSetting.potInOutPush,
        bankShortName: bank.bankShortName,
        account: userBank.account,
      })
      .from(users)
      .innerJoin(userAlarmSetting, eq(userAlarmSetting.deviceFk, deviceId))
      .leftJoin(userBank, eq(userBank.userFk, users.pk))
      .leftJoin(bank, eq(bank.pk, userBank.bankFk))
      .where(and(eq(users.pk, userId), eq(users.isDeleted, false)));

    if (result.length === 0) {
      return null;
    }

    const userInfo = result[0];

    return {
      pk: userInfo.pk,
      name: userInfo.name,
      email: userInfo.email,
      pushSetting: {
        chat_push: userInfo.chatPush,
        marketing_push: userInfo.marketingPush,
        pot_in_out_push: userInfo.potInOutPush,
      },
      accounting: {
        is_set: !!userInfo.bankShortName && !!userInfo.account,
        bank_short_name: userInfo.bankShortName || undefined,
        account: userInfo.account || undefined,
      },
    };
  }

  async insert(user: UserEntity, tx: TxType): Promise<UserEntity | null> {
    const result = await tx
      .insert(users)
      .values({
        pk: user.pk || randomUUID(),
        isDeleted: user.isDeleted,
        idpSub: user.idpSub,
        name: user.name,
        email: user.email,
      })
      .returning();

    if (result.length === 0) {
      throw new PotgDBError("Failed to insert user");
    }

    const inserted = result[0];

    return {
      pk: inserted.pk,
      isDeleted: inserted.isDeleted,
      idpSub: inserted.idpSub,
      name: inserted.name,
      email: inserted.email,
      createdAt: inserted.createdAt,
      updatedAt: inserted.updatedAt,
    };
  }

  async withdraw(userId: string, tx: TxType): Promise<void> {
    await tx
      .update(users)
      .set({ isDeleted: true, name: "", email: "", updatedAt: new Date() })
      .where(eq(users.pk, userId));
  }

  /*
  아래 쿼리는 is_deleted=true 인 유저에 대해서도 쿼리가 진행되어야 합니다.
  SELECT u.pk, u.name, u.is_deleted
  FROM user as u
  WHERE u.pk in (?1);
   */
  async getUserProfileByPks(userPks: string[]) {
    const result = await this.dbService.db
      .select({
        pk: users.pk,
        name: users.name,
        isDeleted: users.isDeleted,
      })
      .from(users)
      .where(inArray(users.pk, userPks));

    return result.map((user) => ({
      pk: user.pk,
      name: user.name,
      isDeleted: user.isDeleted,
    }));
  }

  /*
  아래 쿼리는 is_deleted=true 인 유저가 쿼리하지 못합니다.
  SELECT u.pk, u.name
  FROM user as u
  WHERE u.pk = ?1;
   */
  async getUserProfileByPk(userPk: string) {
    const result = await this.dbService.db
      .select({
        pk: users.pk,
        name: users.name,
      })
      .from(users)
      .where(eq(users.pk, userPk));

    if (result.length === 0) {
      throw new PotgDBError("Failed to select user profile");
    }

    return {
      pk: result[0].pk,
      name: result[0].name,
    };
  }
}
