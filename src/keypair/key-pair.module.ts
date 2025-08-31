import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { KeyPairService } from "@src/keypair/key-pair.service";
import { JwtKeyPairRepository } from "@src/keypair/jwt-key-pair.repository";

@Module({
  imports: [DatabaseModule],
  providers: [KeyPairService, JwtKeyPairRepository],
  exports: [KeyPairService],
})
export class KeyPairModule {}
