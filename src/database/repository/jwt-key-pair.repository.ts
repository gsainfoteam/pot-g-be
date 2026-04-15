import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { jwtKeyPair } from "../../../drizzle/schema/jwt-key-pair";
import { randomUUID } from "node:crypto";

@Injectable()
export class JwtKeyPairRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async getKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  } | null> {
    const result = await this.dbService.db.select().from(jwtKeyPair).limit(1);

    if (result.length === 0) {
      return null;
    }

    const { publicKey, privateKey } = result[0];
    return { publicKey, privateKey };
  }

  async saveKeyPair(publicKey: string, privateKey: string) {
    await this.dbService.db.insert(jwtKeyPair).values({
      pk: randomUUID(),
      publicKey,
      privateKey,
    });
  }
}
