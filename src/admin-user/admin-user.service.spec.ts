import { NotFoundException } from "@nestjs/common";
import { AdminUserRepository } from "@src/admin-database/repository/admin-user.repository";
import { AdminUserService } from "./admin-user.service";
import { AdminUserPotListReqDto } from "./dto/admin-user-pot-list.dto";

describe("AdminUserService.listPots", () => {
  const canonicalPk = "abcdef01-2345-4678-8abc-def012345678";
  const requestPk = canonicalPk.toUpperCase();
  const req = new AdminUserPotListReqDto();

  function setup(user: { pk: string } | null) {
    const repository = {
      findByPk: jest.fn().mockResolvedValue(user),
      findPots: jest.fn().mockResolvedValue([]),
      countPots: jest.fn().mockResolvedValue(0),
    };
    const service = new AdminUserService(
      repository as unknown as AdminUserRepository,
    );
    return { repository, service };
  }

  it("uses the stored UUID for both participation queries", async () => {
    const { repository, service } = setup({ pk: canonicalPk });

    await expect(service.listPots(requestPk, req)).resolves.toEqual({
      items: [],
      total: 0,
      page: req.page,
      size: req.size,
    });
    expect(repository.findByPk).toHaveBeenCalledWith(requestPk);
    expect(repository.findPots).toHaveBeenCalledWith(canonicalPk, req);
    expect(repository.countPots).toHaveBeenCalledWith(canonicalPk);
  });

  it("rejects a missing user before querying participation", async () => {
    const { repository, service } = setup(null);

    await expect(service.listPots(requestPk, req)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.findPots).not.toHaveBeenCalled();
    expect(repository.countPots).not.toHaveBeenCalled();
  });

  it("returns confirmed departure times for archived pots and null for unconfirmed pots", async () => {
    const { repository, service } = setup({ pk: canonicalPk });
    const departure = "2026-11-17T10:00:00.000Z";
    repository.findPots.mockResolvedValue([
      {
        is_deleted: false,
        is_archived: true,
        is_departure_confirmed: true,
        departure_time: departure,
      },
      {
        is_deleted: false,
        is_archived: false,
        is_departure_confirmed: false,
        departure_time: null,
      },
    ]);
    repository.countPots.mockResolvedValue(2);

    const result = await service.listPots(requestPk, req);

    expect(result.total).toBe(2);
    expect(result.items[0]).toMatchObject({
      status: "ARCHIVED",
      departure_time: new Date(departure),
    });
    expect(result.items[1]).toMatchObject({
      status: "BEFORE_CONFIRMED",
      departure_time: null,
    });
  });
});
