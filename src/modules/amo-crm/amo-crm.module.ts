import { Module } from "@nestjs/common";
import { AmoCRMService } from "./amo-crm.service";
import { AmoCRMController } from "./amo-crm.controller";

@Module({
  providers: [AmoCRMService],
  controllers: [AmoCRMController]
})
export class AmoCRMModule {}
