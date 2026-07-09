import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import type { UserDto } from '@homedocs/shared-types';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  create(data: {
    email: string;
    passwordHash: string;
    nome: string;
    cognome: string;
    householdId: Types.ObjectId;
    ruolo: 'admin' | 'membro';
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  async setRefreshTokenHash(
    userId: Types.ObjectId,
    hash: string | null,
  ): Promise<void> {
    await this.userModel
      .updateOne({ _id: userId }, { refreshTokenHash: hash })
      .exec();
  }

  /** Proiezione verso il contratto REST condiviso — mai esporre passwordHash. */
  toDto(user: UserDocument): UserDto {
    return {
      id: user._id.toHexString(),
      email: user.email,
      nome: user.nome,
      cognome: user.cognome,
      householdId: user.householdId.toHexString(),
      ruolo: user.ruolo,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
