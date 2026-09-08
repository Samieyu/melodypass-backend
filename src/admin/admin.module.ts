import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AccessCodeModule } from '../access-code/access-code.module';

@Module({
  imports: [AccessCodeModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
