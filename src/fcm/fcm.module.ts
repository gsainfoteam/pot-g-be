import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { FcmService } from "./fcm.service";
import { FcmLocalService } from "./fcm-local.service";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: FcmService,
      useFactory: (configService: ConfigService) => {
        const projectId = configService.get<string>("FIREBASE_PROJECT_ID");
        if (projectId) {
          return new FcmService(configService);
        }
        return new FcmLocalService();
      },
      inject: [ConfigService],
    },
  ],
  exports: [FcmService],
})
export class FcmModule {}
