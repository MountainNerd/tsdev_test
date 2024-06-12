import { Controller, Get, Param, Query } from '@nestjs/common';
import { AmoCRMService } from './amo-crm.service';
import { GetLeadDto } from './dto/get-lead.dto';

@Controller('amo-crm')
export class AmoCRMController {
  constructor(private readonly amoCrmService: AmoCRMService) {}

  @Get('auth_code/:code')
  async getTokenPairByCode(@Param('code') code: string) {
    return this.amoCrmService.getTokenPairByCode(code);
  }

  @Get('lead')
  async getLeads(@Query() { query }: GetLeadDto) {
    return this.amoCrmService.getLeads(query);
  }
}
