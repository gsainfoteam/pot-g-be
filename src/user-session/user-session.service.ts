import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { UserRepository } from "@src/database/repository/user.repository";
import { DeviceRepository } from "@src/database/repository/device.repository";
import { UserAlarmSettingRepository } from "@src/database/repository/user-alarm-setting.repository";
import { UserEntity } from "@src/database/entity/user.entity";
import { DeviceEntity } from "@src/database/entity/device.entity";
import { TxType } from "@src/global/types/tx.types";
import { IdpUser } from "@src/auth/account";

// UserService 가 아니라 저장소에만 의존해야 UserAccountModule 과 순환 의존이 생기지 않습니다.
@Injectable()
export class UserSessionService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly userRepository: UserRepository,
    private readonly deviceRepository: DeviceRepository,
    private readonly userAlarmSettingRepository: UserAlarmSettingRepository,
  ) {}

  async resolveSession(user: IdpUser, body: Record<string, unknown>) {
    const deviceId = body.device_id;
    // device.device_id 는 varchar(64) 입니다.
    if (typeof deviceId !== "string" || !deviceId || deviceId.length > 64) {
      throw new BadRequestException("device_id is required");
    }

    const { user: local, device } = await this.dbService.db.transaction(
      (tx: TxType) =>
        this.findOrCreate(user.sub, user.name, user.email, deviceId, tx),
    );
    return { subject: local.pk, claims: { devicePk: device.pk } };
  }

  async findOrCreate(
    sub: string,
    name: string,
    email: string,
    deviceId: string,
    tx: TxType,
  ): Promise<{ user: UserEntity; device: DeviceEntity }> {
    const user = await this.userRepository.findUserByIdpSub(sub);
    if (!user) {
      // 사용자가 존재하지 않는 경우, 새로 생성합니다.
      const created = await this.createNewUser(sub, name, email, tx);
      return {
        user: created,
        device: await this.createNewDevice(created, deviceId, tx),
      };
    }

    const device =
      (await this.deviceRepository.findByDeviceIdAndUserFk(
        deviceId,
        user.pk,
      )) ?? (await this.createNewDevice(user, deviceId, tx));
    return { user, device };
  }

  private async createNewUser(
    sub: string,
    name: string,
    email: string,
    tx: TxType,
  ) {
    const user = await this.userRepository.insert(
      {
        isDeleted: false,
        idpSub: sub,
        name,
        email,
      },
      tx,
    );

    if (!user) {
      throw new InternalServerErrorException("Failed to create new user");
    }

    return user;
  }

  private async createNewDevice(
    user: UserEntity,
    deviceId: string,
    tx: TxType,
  ) {
    // insert device
    const device = await this.deviceRepository.insert(
      {
        userFk: user.pk,
        fcmToken: "", // 초기값은 빈 문자열로 설정
        deviceId: deviceId,
        os: "", // OS 정보는 추후에 업데이트 필요
        version: "", // 초기 버전 정보
        loggedIn: false,
      },
      tx,
    );

    // insert user_alarm_setting
    await this.userAlarmSettingRepository.insert(
      {
        deviceFk: device.pk,
        chatPush: true,
        marketingPush: true,
        potInOutPush: true,
      },
      tx,
    );

    return device;
  }
}
