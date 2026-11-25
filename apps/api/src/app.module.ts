import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AgendaController, AgendaService } from './agenda/agenda';
import { AprovacoesController } from './aprovacoes/aprovacoes.controller';
import { AprovacoesService } from './aprovacoes/aprovacoes.service';
import { AuditoriaModule } from './auditoria/auditoria';
import { AuthModule } from './auth/auth.module';
import { RelogioModule } from './common/relogio';
import { ConfiguracaoModule } from './configuracao/configuracao.module';
import { DisponibilidadeModule } from './disponibilidade/disponibilidade.module';
import { BloqueiosService, LaboratoriosController, LaboratoriosService } from './laboratorios/laboratorios';
import { PrismaModule } from './prisma/prisma.module';
import { ReservasController } from './reservas/reservas.controller';
import { ReservasService } from './reservas/reservas.service';
import { UsuariosController, UsuariosService } from './usuarios/usuarios';

@Module({
  imports: [
    EventEmitterModule.forRoot({ wildcard: true }),
    PrismaModule,
    RelogioModule,
    ConfiguracaoModule,
    DisponibilidadeModule,
    AuditoriaModule,
    AuthModule,
  ],
  controllers: [UsuariosController, LaboratoriosController, ReservasController, AprovacoesController, AgendaController],
  providers: [UsuariosService, LaboratoriosService, BloqueiosService, ReservasService, AprovacoesService, AgendaService],
})
export class AppModule {}
