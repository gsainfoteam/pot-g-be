import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { iFcmService } from "./fcm.interface";
import { PushMessageDto, BulkPushMessageDto } from "./dto/push-message.dto";
import { FcmResult, BulkFcmResult } from "./fcm.service";

@Injectable()
export class FcmLocalService implements iFcmService {
  private readonly logger = new Logger(FcmLocalService.name);
  async sendPushNotification(pushMessage: PushMessageDto): Promise<FcmResult> {
    const { fcmToken, title, body } = pushMessage;
    this.logger.log(
      `[Local FCM] 단일 push message -> Token: ${fcmToken}, title: ${title}, body: ${body}`,
    );
    return {
      success: true,
      messageId: "Local-message-id",
      fcmToken,
    };
  }

  async sendBulkPushNotification(
    bulkPushMessage: BulkPushMessageDto,
  ): Promise<BulkFcmResult> {
    const { fcmTokens, title, body } = bulkPushMessage;
    this.logger.log(
      `[Local FCM] 다중 push message -> ${fcmTokens.length}명, title: ${title}, body: ${body}`,
    );

    const results: FcmResult[] = fcmTokens.map((token, index) => ({
      success: true,
      messageId: `local-bulk-id-${index}`,
      fcmToken: token,
    }));

    return {
      success: true,
      results,
      totalSent: fcmTokens.length,
      totalFailed: 0,
    };
  }

  async validateFcmToken(fcmToken: string): Promise<boolean> {
    if (!fcmToken || typeof fcmToken !== "string" || fcmToken.length < 10) {
      return false;
    }
    this.logger.debug(
      `[Local FCM] 토큰 유효성 검증 통과 -> Token: ${fcmToken}`,
    );
    return true;
  }
}
