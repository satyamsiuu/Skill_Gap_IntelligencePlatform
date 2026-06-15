/**
 * SGIP — Users Module
 * Ticket: SGIP-2.1.1.1
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
