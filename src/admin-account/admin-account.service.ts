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
import { ManagerContext } from "@src/auth/context/manager-context.entity";
import { TxType } from "@src/global/types/tx.types";

@Injectable()
export class AdminAccountService {
  constructor(
    private readonly dbService: DatabaseService,
    private readonly adminAccountRepository: AdminAccountRepository,
  ) {}

  async list(): Promise<AdminAccountDto[]> {
    const adminAccounts = await this.adminAccountRepository.findAll();
    return adminAccounts.map((entity) => this.adminAccountToDto(entity));
  }

  async create(req: CreateAdminAccountRequestDto): Promise<AdminAccountDto> {
    const email = req.email.trim().toLowerCase();

    if (!email.endsWith("@gm.gist.ac.kr")) {
      throw new BadRequestException(
        "Only gm.gist.ac.kr emails can be registered.",
      );
    }

    const existing = await this.adminAccountRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException("This admin email is already registered.");
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

    return this.adminAccountToDto(inserted);
  }

  async remove(adminPk: string, managerCtx: ManagerContext): Promise<void> {
    const target = await this.adminAccountRepository.findByPk(adminPk);
    if (!target) {
      throw new NotFoundException("Admin account not found.");
    }

    if (this.isSameEmail(target.email, managerCtx.email)) {
      throw new ForbiddenException("You cannot remove yourself.");
    }

    if (target.role === AdminAccountRole.superadmin) {
      throw new ForbiddenException(
        "Superadmin accounts cannot be removed. Demote to admin first.",
      );
    }

    await this.dbService.db.transaction(async (tx: TxType) => {
      const deleted = await this.adminAccountRepository.deleteAdminByPk(
        adminPk,
        tx,
      );
      if (!deleted) {
        throw new ForbiddenException(
          "Superadmin accounts cannot be removed. Demote to admin first.",
        );
      }
    });
  }

  async updateRole(
    adminPk: string,
    req: UpdateAdminAccountRoleRequestDto,
    managerCtx: ManagerContext,
  ): Promise<AdminAccountDto> {
    const target = await this.adminAccountRepository.findByPk(adminPk);
    if (!target) {
      throw new NotFoundException("Admin account not found.");
    }

    if (this.isSameEmail(target.email, managerCtx.email)) {
      throw new ForbiddenException("You cannot change your own role.");
    }

    const updated = await this.dbService.db.transaction(async (tx: TxType) => {
      return this.adminAccountRepository.update(
        { ...target, role: req.role },
        tx,
      );
    });

    return this.adminAccountToDto(updated);
  }

  private isSameEmail(a: string, b: string): boolean {
    return a.trim().toLowerCase() === b.trim().toLowerCase();
  }

  private adminAccountToDto(entity: AdminAccountEntity): AdminAccountDto {
    return {
      pk: entity.pk,
      email: entity.email,
      role: entity.role,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
