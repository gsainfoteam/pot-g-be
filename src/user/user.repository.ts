import { Injectable } from "@nestjs/common";
import { DatabaseService } from "@src/database/database.service";
import { users } from "../../drizzle/schema/users";
import { eq } from "drizzle-orm";
import { UserEntity } from "@src/user/model/user.entity";

@Injectable()
export class UserRepository {
  constructor(private readonly dbService: DatabaseService) {}

  /*
  SELECT * FROM user WHERE idp_sub = ?1;
   */
  async findUserByIdpSub(idpSub: string): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .select()
      .from(users)
      .where(eq(users.idpSub, idpSub));

    if (result.length === 0) {
      return null;
    }

    const user = result[0];

    return {
      pk: user.pk,
      isDeleted: user.isDeleted,
      idpSub: user.idpSub,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async insert(user: UserEntity): Promise<UserEntity | null> {
    const result = await this.dbService.db
      .insert(users)
      .values({
        isDeleted: user.isDeleted,
        idpSub: user.idpSub,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
      })
      .returning();

    if (result.length === 0) {
      return null;
    }

    const insertedUser = result[0];

    return {
      pk: insertedUser.pk,
      isDeleted: insertedUser.isDeleted,
      idpSub: insertedUser.idpSub,
      name: insertedUser.name,
      email: insertedUser.email,
      studentId: insertedUser.studentId,
      createdAt: insertedUser.createdAt,
      updatedAt: insertedUser.updatedAt,
    };
  }
}
