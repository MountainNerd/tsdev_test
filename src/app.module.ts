import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AmoCRMModule } from './modules/amo-crm/amo-crm.module';

@Module({
  imports: [AmoCRMModule],
  providers: [AppService],
})
export class AppModule {}

