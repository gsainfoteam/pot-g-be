import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { KeyPairService } from "@src/keypair/key-pair.service";

@Module({
  imports: [DatabaseModule],
  providers: [KeyPairService],
  exports: [KeyPairService],
})
export class KeyPairModule {}
