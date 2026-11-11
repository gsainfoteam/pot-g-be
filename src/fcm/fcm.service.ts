import { StagingLogger } from "../global/logger/staging.logger";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as admin from "firebase-admin";
import { BulkPushMessageDto, PushMessageDto } from "./dto/push-message.dto";
import { Trace } from "@gsainfoteam/nest-observability";

export interface FcmResult {
  success: boolean;
  messageId?: string;
  error?: string;
  fcmToken?: string;
}

export interface BulkFcmResult {
  success: boolean;
  results: FcmResult[];
  totalSent: number;
  totalFailed: number;
}

@Trace()
@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new StagingLogger(FcmService.name);
  private firebaseApp: admin.app.App;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const projectId = this.configService.get<string>("FIREBASE_PROJECT_ID");
      const privateKey = this.configService.get<string>("FIREBASE_PRIVATE_KEY");
      const clientEmail = this.configService.get<string>(
        "FIREBASE_CLIENT_EMAIL",
      );

      if (!projectId || !privateKey || !clientEmail) {
        throw new Error(
          "Firebase configuration is missing. Please check your environment variables.",
        );
      }

      const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

      if (!admin.apps.length) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: formattedPrivateKey,
            clientEmail,
          }),
        });
      } else {
        this.firebaseApp = admin.app();
      }

      this.logger.debug(
        "[onModuleInit] Firebase Admin SDK initialized successfully",
      );
    } catch (error) {
      this.logger.error(
        "[onModuleInit] Failed to initialize Firebase Admin SDK:",
        error,
      );
      throw error;
    }
  }

  async sendPushNotification(pushMessage: PushMessageDto): Promise<FcmResult> {
    try {
      const {
        fcmToken,
        title,
        body,
        actionButtonText,
        deepLink,
        imageUrl,
        icon,
        color,
      } = pushMessage;

      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title,
          body,
          imageUrl,
        },
        android: {
          notification: {
            icon,
            color,
            clickAction: deepLink,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: "default",
              badge: 1,
            },
          },
          fcmOptions: {
            imageUrl,
          },
        },
        webpush: {
          notification: {
            title,
            body,
            icon,
            image: imageUrl,
            badge: icon,
            actions: actionButtonText
              ? [{ action: "open", title: actionButtonText }]
              : undefined,
          },
          fcmOptions: {
            link: deepLink,
          },
        },
        data: {
          deepLink: deepLink || "",
          actionButtonText: actionButtonText || "",
        },
      };

      const response = await admin.messaging().send(message);

      this.logger.debug(
        "[sendPushNotification] Push notification accepted by FCM",
      );

      return {
        success: true,
        messageId: response,
        fcmToken,
      };
    } catch (error) {
      this.logger.error(
        `[sendPushNotification] Failed to send push notification to ${StagingLogger.tokenId(pushMessage.fcmToken)}:`,
        error,
      );

      return {
        success: false,
        error: error.message,
        fcmToken: pushMessage.fcmToken,
      };
    }
  }

  async sendBulkPushNotification(
    bulkPushMessage: BulkPushMessageDto,
  ): Promise<BulkFcmResult> {
    const {
      fcmTokens,
      title,
      body,
      actionButtonText,
      deepLink,
      imageUrl,
      icon,
      color,
    } = bulkPushMessage;

    const multicastMessage: admin.messaging.MulticastMessage = {
      tokens: fcmTokens,
      notification: {
        title,
        body,
        imageUrl,
      },
      android: {
        notification: {
          icon,
          color,
          clickAction: deepLink,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
            },
            sound: "default",
            badge: 1,
          },
        },
        fcmOptions: {
          imageUrl,
        },
      },
      webpush: {
        notification: {
          title,
          body,
          icon,
          image: imageUrl,
          badge: icon,
          actions: actionButtonText
            ? [{ action: "open", title: actionButtonText }]
            : undefined,
        },
        fcmOptions: {
          link: deepLink,
        },
      },
      data: {
        deepLink: deepLink || "",
        path: deepLink || "",
        actionButtonText: actionButtonText || "",
      },
    };

    const response = await admin
      .messaging()
      .sendEachForMulticast(multicastMessage);

    const results: FcmResult[] = response.responses.map((res, index) => ({
      success: res.success,
      messageId: res.messageId,
      error: res.error ? res.error.message : undefined,
      fcmToken: fcmTokens[index],
    }));

    this.logger.debug(
      `[sendBulkPushNotification] accepted=${response.successCount}, failed=${response.failureCount}`,
    );

    response.responses.forEach((result, index) => {
      this.logger.debug(
        `[sendBulkPushNotification] token=${StagingLogger.tokenId(fcmTokens[index])} ${result.success ? "accepted" : `failed: ${result.error?.code ?? "unknown"}`}`,
      );
    });
    if (response.failureCount !== 0) {
      this.logger.error(
        `[sendBulkPushNotification] FCM send failed for ${response.failureCount} device(s)`,
      );
      response.responses.forEach((result, index) => {
        if (!result.success) {
          this.logger.error(
            `[sendBulkPushNotification] token=${StagingLogger.tokenId(fcmTokens[index])} failed: ${result.error?.code ?? "unknown"}`,
          );
        }
      });
    }

    return {
      success: response.failureCount === 0,
      results,
      totalSent: response.successCount,
      totalFailed: response.failureCount,
    };
  }

  async validateFcmToken(fcmToken: string): Promise<boolean> {
    try {
      if (!fcmToken || typeof fcmToken !== "string" || fcmToken.length < 10) {
        return false;
      }

      const testMessage: admin.messaging.Message = {
        token: fcmToken,
        data: {
          test: "true",
        },
      };

      await admin.messaging().send(testMessage, true);
      return true;
    } catch (error) {
      this.logger.debug(
        `[validateFcmToken] FCM token validation failed: token=${StagingLogger.tokenId(fcmToken)}, code=${error.code ?? "unknown"}`,
      );
      return false;
    }
  }
}
