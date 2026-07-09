import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { HomeDoc, HomeDocSchema } from '../documents/document.schema';
import { User, UserSchema } from '../users/user.schema';
import { MailService } from './mail.service';
import { Reminder, ReminderSchema } from './reminder.schema';
import { RemindersController } from './reminders.controller';
import { RemindersService } from './reminders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminder.name, schema: ReminderSchema },
      { name: HomeDoc.name, schema: HomeDocSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService, MailService],
  exports: [RemindersService],
})
export class RemindersModule {}
