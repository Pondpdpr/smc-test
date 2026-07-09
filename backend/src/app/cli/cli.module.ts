import { Module } from '@nestjs/common';

import { DomainCodeGenCli } from './code-gen/domain-code-gen.cli';
import { FinancialDataCliSeed } from './financial-data/financial-data.cli.seed';
import { InitialsCliSeed } from './initials/initials.cli.seed';

@Module({
  providers: [InitialsCliSeed, DomainCodeGenCli, FinancialDataCliSeed],
})
export class CliModule {}
