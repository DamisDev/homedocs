import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { HouseholdsModule } from '../households/households.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  // JwtModule senza segreto di default: ogni sign/verify passa esplicitamente
  // il segreto giusto (access vs refresh) via ConfigService.
  imports: [
    JwtModule.register({}),
    UsersModule,
    forwardRef(() => HouseholdsModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
