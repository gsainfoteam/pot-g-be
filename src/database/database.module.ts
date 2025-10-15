import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";
import { ConfigModule } from "@nestjs/config";
import { BankRepository } from "@src/database/repository/bank.repository";
import { DeviceRepository } from "@src/database/repository/device.repository";
import { JwtKeyPairRepository } from "@src/database/repository/jwt-key-pair.repository";
import { PotEventRepository } from "@src/database/repository/pot-event.repository";
import { PotRoomRepository } from "@src/database/repository/pot-room.repository";
import { RouteRepository } from "@src/database/repository/route.repository";
import { StopsRepository } from "@src/database/repository/stops.repository";
import { UserRepository } from "@src/database/repository/user.repository";
import { UserAlarmSettingRepository } from "@src/database/repository/user-alarm-setting.repository";
import { UserBankRepository } from "@src/database/repository/user-bank.repository";
import { UserPotRoomRepository } from "@src/database/repository/user-pot-room.repository";
import { PopoChatMsgRepository } from "@src/database/repository/popo-chat-msg.repository";
import { PopoChatReservationRepository } from "@src/database/repository/popo-chat-reservation.repository";
import { RefreshTokenRepository } from "@src/database/repository/refresh-token.repository";
import { UserConsentRepository } from "@src/database/repository/user-consent.repository";

@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    BankRepository,
    DeviceRepository,
    JwtKeyPairRepository,
    PotEventRepository,
    PotRoomRepository,
    RouteRepository,
    StopsRepository,
    UserRepository,
    UserAlarmSettingRepository,
    UserBankRepository,
    UserPotRoomRepository,
    PopoChatMsgRepository,
    PopoChatReservationRepository,
    RefreshTokenRepository,
    UserConsentRepository,
  ],
  exports: [
    DatabaseService,
    BankRepository,
    DeviceRepository,
    JwtKeyPairRepository,
    PotEventRepository,
    PotRoomRepository,
    RouteRepository,
    StopsRepository,
    UserRepository,
    UserAlarmSettingRepository,
    UserBankRepository,
    UserPotRoomRepository,
    PopoChatMsgRepository,
    PopoChatReservationRepository,
    RefreshTokenRepository,
    UserConsentRepository,
  ],
})
export class DatabaseModule {}
