import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { jwtKeyPair } from "../../drizzle/schema/jwt-key-pair";

@Injectable()
export class JwtKeyPairRepository {
  constructor(private readonly dbService: DatabaseService) {}

  async getKeyPair() {
    const result = await this.dbService.db.select().from(jwtKeyPair).limit(1);

    if (result.length === 0) {
      throw new Error("No JWT key pair found in the database.");
    }
    const { publicKey, privateKey } = result[0];
    return {
      publicKey,
      privateKey,
    };
  }
}
