import {Module} from '@nestjs/common';
import { AdminDatabaseModule} from '@src/admin-database/admin-database.module';
import { AdminUserController } from '@src/admin-user/admin-user.controller';
import { AdminUserService} from '@src/admin-user/admin-user.service';

@Module({
  imports: [AdminDatabaseModule],
  controllers: [AdminUserController],
  providers: [AdminUserService],
})
export class AdminUserModule {}