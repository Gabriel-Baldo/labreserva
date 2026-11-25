import { ConflictException, UnprocessableEntityException } from '@nestjs/common';

export class RegraDeNegocioException extends UnprocessableEntityException {}

export class ConflitoDeHorarioException extends ConflictException {}

const CODIGO_VIOLACAO_DE_EXCLUSAO = '23P01';

export const ehViolacaoDeExclusao = (erro: unknown): boolean =>
  String((erro as { message?: string })?.message).includes(CODIGO_VIOLACAO_DE_EXCLUSAO);
