import { Global, Module } from '@nestjs/common';
import { DisponibilidadeService } from './disponibilidade.service';

@Global()
@Module({ providers: [DisponibilidadeService], exports: [DisponibilidadeService] })
export class DisponibilidadeModule {}
