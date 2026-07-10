import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import type {
  HouseholdDto,
  HouseholdWithMembersDto,
} from '@homedocs/shared-types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { HouseholdsService } from './households.service';

@Controller('households')
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  /** L'household dell'utente corrente con membri e codice invito. */
  @Get('mine')
  mine(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HouseholdWithMembersDto> {
    return this.householdsService.findWithMembers(user.householdId);
  }

  /** Rigenera il codice invito del proprio household. */
  @Post('regenerate-code')
  regenerateCode(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<HouseholdDto> {
    return this.householdsService.regenerateInviteCode(user.householdId);
  }
}
