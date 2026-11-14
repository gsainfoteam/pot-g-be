import { Injectable } from "@nestjs/common";
import { and, count, desc, eq, exists, or, sql } from "drizzle-orm";
import { DatabaseService } from "@src/database/database.service";
import { AdminUserListReqDto } from "@src/admin-user/dto/admin-user-list.dto";
import { users } from "../../../drizzle/schema/users";
import { device } from "../../../drizzle/schema/device";
import { userAlarmSetting } from "../../../drizzle/schema/user-alarm-setting";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { potEvent } from "../../../drizzle/schema/pot-event";
import { AdminUserPotListReqDto } from "@src/admin-user/dto/admin-user-pot-list.dto";

@Injectable()
export class AdminUserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  private buildWhere(req: AdminUserListReqDto) {
    return and(
      req.pk !== undefined ? eq(users.pk, req.pk) : undefined,

      req.idp_sub !== undefined ? eq(users.idpSub, req.idp_sub) : undefined,

      req.status === "all"
        ? undefined
        : eq(users.isDeleted, req.status === "withdrawn"),
    );
  }

  async findAll(req: AdminUserListReqDto) {
    return this.dbService.db
      .select({
        pk: users.pk,
        name: users.name,
        email: users.email,
        isDeleted: users.isDeleted,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(this.buildWhere(req))
      .orderBy(desc(users.createdAt), desc(users.pk))
      .limit(req.size)
      .offset(req.page * req.size);
  }

  async count(req: AdminUserListReqDto): Promise<number> {
    const [result] = await this.dbService.db
      .select({ total: count() })
      .from(users)
      .where(this.buildWhere(req));

    return result.total;
  }

  async findByPk(pk: string) {
    const [user] = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.pk, pk))
      .limit(1);
    return user ?? null;
  }

  async findDevices(userPk: string) {
    return this.dbService.db
      .select({
        pk: device.pk,
        os: device.os,
        version: device.version,
        logged_in: device.loggedIn,
        has_fcm_token: sql<boolean>`length(${device.fcmToken}) > 0`,
        push_setting: {
          chat_push: userAlarmSetting.chatPush,
          marketing_push: userAlarmSetting.marketingPush,
          pot_in_out_push: userAlarmSetting.potInOutPush,
        },
      })
      .from(device)
      .leftJoin(userAlarmSetting, eq(userAlarmSetting.deviceFk, device.pk))
      .where(eq(device.userFk, userPk))
      .orderBy(desc(device.createdAt), desc(device.pk));
  }

  private participatedIn(userPk: string) {
    // 생성 및 입장 이벤트는 퇴장·강퇴 이후에도 참여 이력을 보존합니다.
    return exists(
      this.dbService.db
        .select({ value: sql`1` })
        .from(potEvent)
        .where(
          and(
            eq(potEvent.potFk, potRoom.pk),
            or(
              and(
                eq(potEvent.type, "create_v1"),
                sql`${potEvent.data}->>'createUserId' = ${userPk}`,
              ),
              and(
                eq(potEvent.type, "user_in_v1"),
                sql`${potEvent.data}->>'userPk' = ${userPk}`,
              ),
            ),
          ),
        ),
    );
  }

  async findPots(userPk: string, req: AdminUserPotListReqDto) {
    return this.dbService.db
      .select({
        pk: potRoom.pk,
        name: potRoom.name,
        is_archived: potRoom.isArchived,
        is_deleted: potRoom.isDeleted,
        is_departure_confirmed: potRoom.isDepartureConfirmed,
        starts_at: potRoom.startsAt,
        ends_at: potRoom.endsAt,
        created_at: potRoom.createdAt,
      })
      .from(potRoom)
      .where(this.participatedIn(userPk))
      .orderBy(desc(potRoom.createdAt), desc(potRoom.pk))
      .limit(req.size)
      .offset(req.page * req.size);
  }

  async countPots(userPk: string): Promise<number> {
    const [result] = await this.dbService.db
      .select({ total: count() })
      .from(potRoom)
      .where(this.participatedIn(userPk));
    return result.total;
  }
}
