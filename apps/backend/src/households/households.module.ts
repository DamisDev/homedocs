import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Household, HouseholdSchema } from './household.schema';
import { HouseholdsService } from './households.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Household.name, schema: HouseholdSchema },
    ]),
  ],
  providers: [HouseholdsService],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
