import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { HouseholdsController } from './households.controller';
import { Household, HouseholdSchema } from './household.schema';
import { HouseholdsService } from './households.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Household.name, schema: HouseholdSchema },
    ]),
    UsersModule,
    // forwardRef: AuthModule importa HouseholdsModule (per HouseholdsService in
    // registrazione) e qui serve JwtAuthGuard da AuthModule → ciclo risolto.
    forwardRef(() => AuthModule),
  ],
  controllers: [HouseholdsController],
  providers: [HouseholdsService],
  exports: [HouseholdsService],
})
export class HouseholdsModule {}
