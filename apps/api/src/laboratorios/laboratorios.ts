import { Body, ConflictException, Controller, Delete, Get, HttpCode, Injectable, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Bloqueio, Laboratorio, Prisma } from '@prisma/client';
import { IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Perfis, UsuarioAtual, UsuarioAutenticado } from '../common/decorators';
import { RegraDeNegocioException } from '../common/excecoes';
import { MENSAGENS } from '../common/mensagens';
import { DelegateDeCadastro, ServicoCadastro } from '../common/servico-cadastro';
import { STATUS_ATIVOS } from '../common/status';
import { minutosDeHora } from '../common/tempo';
import { PrismaService } from '../prisma/prisma.service';

const CODIGO_DUPLICADO = 'P2002';
const MINUTOS_MAXIMOS_DO_DIA = 24 * 60;

export class CriarLaboratorioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsInt()
  @Min(1)
  capacidade: number;

  @IsOptional()
  @IsString()
  recursos?: string;

  @IsString()
  abertura: string;

  @IsString()
  fechamento: string;
}

export class AtualizarLaboratorioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  nome?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  tipo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacidade?: number;

  @IsOptional()
  @IsString()
  recursos?: string;

  @IsOptional()
  @IsString()
  abertura?: string;

  @IsOptional()
  @IsString()
  fechamento?: string;
}

export class CriarBloqueioDto {
  @IsISO8601()
  inicio: string;

  @IsISO8601()
  fim: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;
}

const validarFuncionamento = (abertura: string, fechamento: string): void => {
  const minutosAbertura = minutosDeHora(abertura);
  const minutosFechamento = minutosDeHora(fechamento);
  const valido =
    Number.isInteger(minutosAbertura) &&
    Number.isInteger(minutosFechamento) &&
    minutosAbertura >= 0 &&
    minutosFechamento <= MINUTOS_MAXIMOS_DO_DIA &&
    minutosFechamento > minutosAbertura;
  if (!valido) throw new RegraDeNegocioException(MENSAGENS.horarioDeFuncionamentoInvalido);
};

@Injectable()
export class LaboratoriosService extends ServicoCadastro<Laboratorio> {
  protected readonly delegate: DelegateDeCadastro<Laboratorio>;
  protected readonly mensagemNaoEncontrado = MENSAGENS.laboratorioNaoEncontrado;

  constructor(private readonly prisma: PrismaService) {
    super();
    this.delegate = prisma.laboratorio as unknown as DelegateDeCadastro<Laboratorio>;
  }

  async criar(dto: CriarLaboratorioDto): Promise<Laboratorio> {
    validarFuncionamento(dto.abertura, dto.fechamento);
    return this.prisma.laboratorio
      .create({ data: { ...dto, nome: dto.nome.trim(), recursos: dto.recursos ?? '' } })
      .catch(this.traduzirDuplicado);
  }

  async atualizar(id: number, dto: AtualizarLaboratorioDto): Promise<Laboratorio> {
    const atual = await this.obter(id);
    validarFuncionamento(dto.abertura ?? atual.abertura, dto.fechamento ?? atual.fechamento);
    return this.prisma.laboratorio.update({ where: { id }, data: dto }).catch(this.traduzirDuplicado);
  }

  async reservasFuturas(id: number): Promise<{ quantidade: number }> {
    await this.obter(id);
    const quantidade = await this.prisma.reserva.count({
      where: { laboratorioId: id, status: { in: STATUS_ATIVOS }, fim: { gt: new Date() } },
    });
    return { quantidade };
  }

  private traduzirDuplicado(erro: Prisma.PrismaClientKnownRequestError): never {
    if (erro.code !== CODIGO_DUPLICADO) throw erro;
    throw new ConflictException(MENSAGENS.nomeDeLaboratorioEmUso);
  }
}

@Injectable()
export class BloqueiosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(laboratorioId: number): Promise<Bloqueio[]> {
    return this.prisma.bloqueio.findMany({
      where: { laboratorioId, fim: { gt: new Date() } },
      orderBy: { inicio: 'asc' },
    });
  }

  async criar(admin: UsuarioAutenticado, laboratorioId: number, dto: CriarBloqueioDto): Promise<Bloqueio> {
    const inicio = new Date(dto.inicio);
    const fim = new Date(dto.fim);
    if (fim.getTime() <= inicio.getTime()) throw new RegraDeNegocioException(MENSAGENS.intervaloInvalido);
    const reserva = await this.prisma.reserva.findFirst({
      where: { laboratorioId, status: { in: STATUS_ATIVOS }, inicio: { lt: fim }, fim: { gt: inicio } },
    });
    if (reserva) throw new RegraDeNegocioException(MENSAGENS.bloqueioComReservaAprovada);
    return this.prisma.bloqueio.create({ data: { laboratorioId, criadoPor: admin.id, inicio, fim, motivo: dto.motivo.trim() } });
  }

  async remover(id: number): Promise<void> {
    const bloqueio = await this.prisma.bloqueio.findUnique({ where: { id } });
    if (!bloqueio) throw new NotFoundException(MENSAGENS.bloqueioNaoEncontrado);
    await this.prisma.bloqueio.delete({ where: { id } });
  }
}

@ApiTags('laboratorios')
@Controller()
export class LaboratoriosController {
  constructor(
    private readonly laboratorios: LaboratoriosService,
    private readonly bloqueios: BloqueiosService,
  ) {}

  @Get('laboratorios')
  listar(@Query('incluirInativos') incluirInativos?: string) {
    return this.laboratorios.listar(incluirInativos === 'true');
  }

  @Perfis('ADMIN')
  @Post('laboratorios')
  criar(@Body() dto: CriarLaboratorioDto) {
    return this.laboratorios.criar(dto);
  }

  @Perfis('ADMIN')
  @Patch('laboratorios/:id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: AtualizarLaboratorioDto) {
    return this.laboratorios.atualizar(id, dto);
  }

  @Perfis('ADMIN')
  @Get('laboratorios/:id/reservas-futuras')
  reservasFuturas(@Param('id', ParseIntPipe) id: number) {
    return this.laboratorios.reservasFuturas(id);
  }

  @Perfis('ADMIN')
  @Post('laboratorios/:id/desativar')
  @HttpCode(200)
  desativar(@Param('id', ParseIntPipe) id: number) {
    return this.laboratorios.desativar(id);
  }

  @Get('laboratorios/:id/bloqueios')
  listarBloqueios(@Param('id', ParseIntPipe) id: number) {
    return this.bloqueios.listar(id);
  }

  @Perfis('ADMIN')
  @Post('laboratorios/:id/bloqueios')
  criarBloqueio(@UsuarioAtual() admin: UsuarioAutenticado, @Param('id', ParseIntPipe) id: number, @Body() dto: CriarBloqueioDto) {
    return this.bloqueios.criar(admin, id, dto);
  }

  @Perfis('ADMIN')
  @Delete('bloqueios/:id')
  @HttpCode(204)
  removerBloqueio(@Param('id', ParseIntPipe) id: number) {
    return this.bloqueios.remover(id);
  }
}
