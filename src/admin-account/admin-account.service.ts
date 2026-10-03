import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { AdminAccountRepository } from "@src/database/repository/admin-account.repository";
import {
  AdminAccountEntity,
  AdminAccountRole,
} from "@src/database/entity/admin-account.entity";
import { AdminAccountDto } from "@src/admin-account/dto/admin-account.dto";
import { CreateAdminAccountRequestDto } from "@src/admin-account/dto/create-admin-account.dto";
import { UpdateAdminAccountRoleRequestDto } from "@src/admin-account/dto/update-admin-account-role.dto";
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

  async remove(pk: string, requesterEmail: string): Promise<void> {
    const target = await this.adminAccountRepository.findByPk(pk);
    if (!target) {
      throw new NotFoundException("존재하지 않는 관리자 계정입니다.");
    }

    if (this.isSameEmail(target.email, requesterEmail)) {
      throw new ForbiddenException("자기 자신은 제거할 수 없습니다.");
    }

    if (target.role === AdminAccountRole.superadmin) {
      throw new ForbiddenException(
        "superadmin 계정은 제거할 수 없습니다. 먼저 admin으로 권한을 내려주세요.",
      );
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      await this.adminAccountRepository.deleteByPk(pk, tx);
    });
  }

  async updateRole(
    pk: string,
    req: UpdateAdminAccountRoleRequestDto,
    requesterEmail: string,
  ): Promise<AdminAccountDto> {
    const target = await this.adminAccountRepository.findByPk(pk);
    if (!target) {
      throw new NotFoundException("존재하지 않는 관리자 계정입니다.");
    }

    if (this.isSameEmail(target.email, requesterEmail)) {
      throw new ForbiddenException("자기 자신의 권한은 변경할 수 없습니다.");
    }

    const updated = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.adminAccountRepository.update(
        { ...target, role: req.role },
        tx,
      );
    });

    return this.toDto(updated);
  }

  private isSameEmail(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  private toDto(entity: AdminAccountEntity): AdminAccountDto {
    return {
      pk: entity.pk,
      email: entity.email,
      role: entity.role,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
