import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { AtGuard } from './common/guards';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MembersModule } from './members/members.module';
import { HouseholdsModule } from './households/households.module';
import { DepartmentsModule } from './departments/departments.module';
import { ServicesModule } from './services/services.module';
import { AttendanceModule } from './attendance/attendance.module';
import { GivingModule } from './giving/giving.module';
import { FollowUpsModule } from './follow-ups/follow-ups.module';
import { AutomationsModule } from './automations/automations.module';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { MessagingModule } from './messaging/messaging.module';
import { GroupsModule } from './groups/groups.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { DirectMessagesModule } from './direct-messages/direct-messages.module';
import { GroupChatModule } from './group-chat/group-chat.module';
import { SeedModule } from './seed/seed.module';
import { SettingsModule } from './settings/settings.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serve uploaded files
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    MembersModule,
    HouseholdsModule,
    DepartmentsModule,
    ServicesModule,
    AttendanceModule,
    GivingModule,
    FollowUpsModule,
    AutomationsModule,
    HealthModule,
    NotificationsModule,
    ReportsModule,
    MessagingModule,
    GroupsModule,
    ChatModule,
    UploadModule,
    DirectMessagesModule,
    GroupChatModule,
    SeedModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }

