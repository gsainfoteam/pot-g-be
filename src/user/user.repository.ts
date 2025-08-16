import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";
import { UserEntity } from "@src/user/model/user.entity";
import { userAlarmSetting } from "../../drizzle/schema/user-alarm-setting";
import { bank } from "../../drizzle/schema/bank";
import { userBank } from "../../drizzle/schema/user-bank";

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM user WHERE pk = ?1;
   */
  async findUserByPk(pk: string): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.pk, pk));

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
      studentId: user.studentId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /*
  SELECT * FROM user WHERE idp_sub = ?1;
   */
  async findUserByIdpSub(idpSub: string): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.idpSub, idpSub));

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
      studentId: user.studentId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /*
  SELECT u.name, u.email,
         uas.any_push,
         uas.chat_push,
         uas.marketing_push,
         uas.pot_in_out_push,
         b.bank_short_name,
         ub.account
  FROM user as u
    INNER JOIN user_alarm_setting as uas ON uas.device_fk = ?2
    LEFT OUTER JOIN user_bank as ub ON ub.user_fk = u.pk
    INNER JOIN bank as b ON b.pk = ub.bank_fk
  WHERE pk = ?1;
   */
  async getUserInfoByPk(userId: string, deviceId: string) {
    const result = await this.dbService.db
      .select({
        name: users.name,
        email: users.email,
        anyPush: userAlarmSetting.anyPush,
        chatPush: userAlarmSetting.chatPush,
        marketingPush: userAlarmSetting.marketingPush,
        potInOutPush: userAlarmSetting.potInOutPush,
        bankShortName: bank.bankShortName,
        account: userBank.account,
      })
      .from(users)
      .innerJoin(userAlarmSetting, eq(userAlarmSetting.deviceFk, deviceId))
      .leftJoin(userBank, eq(userBank.userFk, users.pk))
      .innerJoin(bank, eq(bank.pk, userBank.bankFk))
      .where(eq(users.pk, userId));

    if (result.length === 0) {
      return null;
    }

    const userInfo = result[0];

    return {
      name: userInfo.name,
      email: userInfo.email,
      pushSetting: {
        any_push: userInfo.anyPush,
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

  async insert(user: UserEntity): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .insert(users)
      .values({
        isDeleted: user.isDeleted,
        idpSub: user.idpSub,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
      })
      .returning();

    if (result.length === 0) {
      return null;
    }

    const insertedUser = result[0];

    return {
      pk: insertedUser.pk,
      isDeleted: insertedUser.isDeleted,
      idpSub: insertedUser.idpSub,
      name: insertedUser.name,
      email: insertedUser.email,
      studentId: insertedUser.studentId,
      createdAt: insertedUser.createdAt,
      updatedAt: insertedUser.updatedAt,
    };
  }
}
