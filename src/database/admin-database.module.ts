import { Module } from "@nestjs/common";
import { DatabaseModule } from "@src/database/database.module";
import { PotRoomAdminRepository } from "@src/database/repository/pot-room.admin.repository";
import { PotEventAdminRepository } from "@src/database/repository/pot-event.admin.repository";

/**
 * 어드민 전용 레포지토리만 모아서 export 하는 모듈입니다.
 * 어드민 쪽 모듈은 DatabaseModule 대신(또는 함께) 이 모듈을 import 합니다.
 */
@Module({
  imports: [DatabaseModule],
  providers: [PotRoomAdminRepository, PotEventAdminRepository],
  exports: [PotRoomAdminRepository, PotEventAdminRepository],
})
export class AdminDatabaseModule {}
