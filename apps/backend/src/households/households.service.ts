import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Household, HouseholdDocument } from './household.schema';

@Injectable()
export class HouseholdsService {
  constructor(
    @InjectModel(Household.name)
    private readonly householdModel: Model<Household>,
  ) {}

  create(nome: string): Promise<HouseholdDocument> {
    return this.householdModel.create({ nome });
  }

  findById(id: string): Promise<HouseholdDocument | null> {
    return this.householdModel.findById(id).exec();
  }
}
