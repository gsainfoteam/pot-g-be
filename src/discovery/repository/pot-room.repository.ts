import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { PotRoomEntity } from "@src/discovery/model/pot-room.entity";
import { TxType } from "@src/global/types/tx.types";
import { potRoom } from "../../../drizzle/schema/pot-room";
import { desc } from "drizzle-orm";

@Injectable()
export class PotRoomRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async insert(
    potRoomEntity: PotRoomEntity,
    tx: TxType,
  ): Promise<PotRoomEntity | null> {
    const result = await tx
      .insert(potRoom)
      .values({
        pk: potRoomEntity.pk,
        routeFk: potRoomEntity.routeFk,
        isArchived: potRoomEntity.isArchived,
        isDeleted: potRoomEntity.isDeleted,
        isDepartureConfirmed: potRoomEntity.isDepartureConfirmed,
        maxCapacity: potRoomEntity.maxCapacity,
        startsAt: potRoomEntity.startsAt,
        endsAt: potRoomEntity.endsAt,
        createdAt: potRoomEntity.createdAt,
        updatedAt: potRoomEntity.updatedAt,
        name: potRoomEntity.name,
      })
      .returning();

    if (result.length === 0) {
      throw new Error("Failed to insert pot room"); // TODO
    }

    return this.resultToPotRoomEntity(result[0]);
  }

  async searchPotList(
    offset: number,
    limit: number,
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ): Promise<PotRoomEntity[]> {
    const results = await this.dbService.db
      .select()
      .from(potRoom)
      .offset(offset)
      .limit(limit)
      .orderBy(desc(potRoom.createdAt));

    return results.map((result) => this.resultToPotRoomEntity(result));
  }

  async countPotList(
    route_id?: string,
    starts_at?: Date,
    ends_at?: Date,
  ): Promise<number> {
    return await this.dbService.db.$count(potRoom);
  }

  private resultToPotRoomEntity(result: any): PotRoomEntity {
    return {
      pk: result.pk,
      routeFk: result.routeFk,
      isArchived: result.isArchived,
      isDeleted: result.isDeleted,
      isDepartureConfirmed: result.isDepartureConfirmed,
      maxCapacity: result.maxCapacity,
      startsAt: result.startsAt,
      endsAt: result.endsAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      name: result.name,
    };
  }
}
