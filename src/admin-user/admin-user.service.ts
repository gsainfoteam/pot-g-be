import { Injectable, NotFoundException } from "@nestjs/common";
import { AdminUserDetailDto } from "./dto/admin-user-detail.dto";
import {
  AdminUserPotListReqDto,
  AdminUserPotListResDto,
} from "./dto/admin-user-pot-list.dto";
import { AdminUserRepository } from "@src/admin-database/repository/admin-user.repository";
import {
  AdminUserListReqDto,
  AdminUserListResDto,
} from "./dto/admin-user-list.dto";

@Injectable()
export class AdminUserService {
  constructor(private readonly adminUserRepository: AdminUserRepository) {}

  private async requireUser(pk: string) {
    const user = await this.adminUserRepository.findByPk(pk);
    if (!user) throw new NotFoundException("User not found.");
    return user;
  }

  async getDetail(pk: string): Promise<AdminUserDetailDto> {
    const user = await this.requireUser(pk);
    const devices = await this.adminUserRepository.findDevices(pk);
    return {
      pk: user.pk,
      idp_sub: user.idpSub,
      name: user.name || null,
      email: user.email || null,
      is_deleted: user.isDeleted,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
      devices,
    };
  }

  async listPots(
    pk: string,
    req: AdminUserPotListReqDto,
  ): Promise<AdminUserPotListResDto> {
    await this.requireUser(pk);
    const [items, total] = await Promise.all([
      this.adminUserRepository.findPots(pk, req),
      this.adminUserRepository.countPots(pk),
    ]);
    return { items, total, page: req.page, size: req.size };
  }

  async list(req: AdminUserListReqDto): Promise<AdminUserListResDto> {
    const [users, total] = await Promise.all([
      this.adminUserRepository.findAll(req),
      this.adminUserRepository.count(req),
    ]);

    return {
      items: users.map((user) => ({
        pk: user.pk,
        name: user.name || null,
        email: user.email || null,
        is_deleted: user.isDeleted,
        created_at: user.createdAt,
      })),
      total,
      page: req.page,
      size: req.size,
    };
  }
}
