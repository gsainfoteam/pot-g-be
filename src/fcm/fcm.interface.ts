import { PushMessageDto, BulkPushMessageDto } from "./dto/push-message.dto";
import { FcmResult, BulkFcmResult } from "./fcm.service";

export interface iFcmService {
  sendPushNotification(pushMessage: PushMessageDto): Promise<FcmResult>;

  sendBulkPushNotification(
    bulkPushMessage: BulkPushMessageDto,
  ): Promise<BulkFcmResult>;

  validateFcmToken(fcmToken: string): Promise<boolean>;
}
