import { Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  /**
   * Trigger manuale del controllo scadenze (il cron gira comunque alle 8:00).
   * Utile in sviluppo e per test; idempotente grazie a notificheInviate.
   */
  @Post('run')
  run(): Promise<{ notificheInviate: number }> {
    return this.remindersService.checkScadenze();
  }
}
