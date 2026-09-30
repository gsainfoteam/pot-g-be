import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { AdminAccountRepository } from "@src/database/repository/admin-account.repository";
import {
  AdminAccountEntity,
  AdminAccountRole,
} from "@src/database/entity/admin-account.entity";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AdminAccountService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {}

  async list(): Promise<AdminAccountDto[]> {
    const adminAccounts = await this.adminAccountRepository.findAll();
    return adminAccounts.map((entity) => this.toDto(entity));
  }

  async create(req: CreateAdminAccountRequestDto): Promise<AdminAccountDto> {
    const email = req.email.trim().toLowerCase();

    if (!email.endsWith("@gm.gist.ac.kr")) {
      throw new BadRequestException(
        "gm.gist.ac.kr 이메일만 등록할 수 있습니다.",
      );
    }

    const existing = await this.adminAccountRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("이미 등록된 관리자 이메일입니다.");
    }

    const inserted = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.adminAccountRepository.insert(
        {
          email,
          role: req.role ?? AdminAccountRole.admin,
        },
        tx,
      );
    });

    return this.toDto(inserted);
  }

  async remove(pk: string): Promise<void> {
    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.adminAccountRepository.deleteByPk(pk, tx);
    });
  }

  private toDto(entity: AdminAccountEntity): AdminAccountDto {
    return {
      pk: entity.pk,
      email: entity.email,
      role: entity.role,
      created_at: entity.createdAt,
    };
  }
}
