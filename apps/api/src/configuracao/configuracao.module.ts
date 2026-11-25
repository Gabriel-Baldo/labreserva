import { Global, Module } from '@nestjs/common';
import { ConfiguracaoService } from './configuracao.service';

@Global()
@Module({ providers: [ConfiguracaoService], exports: [ConfiguracaoService] })
export class ConfiguracaoModule {}
