import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { DeviceEntity } from "@src/database/model/device.entity";
import { TxType } from "@src/global/types/tx.types";
import { device } from "../../../drizzle/schema/device";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

@Injectable()
export class DeviceRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM device WHERE pk = ?1 and user_fk = ?2;
   */
  async findByPkAndUserFk(
    pk: string,
    userFk: string,
  ): Promise<DeviceEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(device)
      .where(and(eq(device.pk, pk), eq(device.userFk, userFk)));

    if (result.length === 0) {
      return null;
    }

    const foundDevice = result[0];
    return this.resultToDeviceEntity(foundDevice);
  }

  async insert(
    deviceEntity: DeviceEntity,
    tx: TxType,
  ): Promise<DeviceEntity | null> {
    const result = await tx
      .insert(device)
      .values({
        pk: deviceEntity.pk || randomUUID(),
        userFk: deviceEntity.userFk,
        fcmToken: deviceEntity.fcmToken,
        os: deviceEntity.os,
        version: deviceEntity.version,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert device"); // TODO
    }

    const insertedDevice = result[0];
    return this.resultToDeviceEntity(insertedDevice);
  }

  async update(deviceEntity: DeviceEntity, tx: TxType) {
    await tx.update(device).set({
      fcmToken: deviceEntity.fcmToken,
      os: deviceEntity.os,
      version: deviceEntity.version,
      updatedAt: new Date(),
    });
  }

  private resultToDeviceEntity(result: any): DeviceEntity {
    return {
      pk: result.pk,
      userFk: result.userFk,
      fcmToken: result.fcmToken,
      os: result.os,
      version: result.version,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }
}
