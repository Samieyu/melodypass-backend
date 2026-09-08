import { Module } from '@nestjs/common';
import { AccessCodeService } from './access-code.service';
import { AccessCodeController } from './access-code.controller';

@Module({
  controllers: [AccessCodeController],
  providers: [AccessCodeService],
  exports: [AccessCodeService],
})
export class AccessCodeModule {}
