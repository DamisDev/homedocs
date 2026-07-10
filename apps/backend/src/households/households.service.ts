import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'node:crypto';
import { Model } from 'mongoose';
import type {
  HouseholdDto,
  HouseholdWithMembersDto,
} from '@homedocs/shared-types';
import { UsersService } from '../users/users.service';
import { Household, HouseholdDocument } from './household.schema';

/** Alfabeto senza caratteri ambigui (niente 0/O/1/I) per codici leggibili a voce. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectModel(Household.name)
    private readonly householdModel: Model<Household>,
    private readonly usersService: UsersService,
  ) {}

  async create(nome: string): Promise<HouseholdDocument> {
    return this.householdModel.create({
      nome,
      codiceInvito: await this.generateUniqueCode(),
    });
  }

  findById(id: string): Promise<HouseholdDocument | null> {
    return this.householdModel.findById(id).exec();
  }

  findByInviteCode(codice: string): Promise<HouseholdDocument | null> {
    return this.householdModel
      .findOne({ codiceInvito: codice.trim().toUpperCase() })
      .exec();
  }

  /** Household con l'elenco dei membri, per la pagina gestione famiglia. */
  async findWithMembers(householdId: string): Promise<HouseholdWithMembersDto> {
    const household = await this.findById(householdId);
    if (!household) {
      throw new NotFoundException('Household non trovato');
    }
    const membri = await this.usersService.findByHousehold(household._id);
    return {
      ...this.toDto(household),
      membri: membri.map((u) => this.usersService.toDto(u)),
    };
  }

  /** Rigenera il codice invito (es. se compromesso): solo il nuovo codice sarà valido. */
  async regenerateInviteCode(householdId: string): Promise<HouseholdDto> {
    const household = await this.findById(householdId);
    if (!household) {
      throw new NotFoundException('Household non trovato');
    }
    household.codiceInvito = await this.generateUniqueCode();
    await household.save();
    return this.toDto(household);
  }

  toDto(household: HouseholdDocument): HouseholdDto {
    return {
      id: household._id.toHexString(),
      nome: household.nome,
      codiceInvito: household.codiceInvito,
      createdAt: household.createdAt.toISOString(),
    };
  }

  private async generateUniqueCode(): Promise<string> {
    // Una collisione su 32^8 è trascurabile, ma la registrazione concorrente
    // la rende teoricamente possibile: si riprova finché il codice è libero.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = this.randomCode();
      if (!(await this.householdModel.exists({ codiceInvito: code }).exec())) {
        return code;
      }
    }
    throw new Error('Impossibile generare un codice invito univoco');
  }

  private randomCode(): string {
    const bytes = randomBytes(CODE_LENGTH);
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return code;
  }
}
