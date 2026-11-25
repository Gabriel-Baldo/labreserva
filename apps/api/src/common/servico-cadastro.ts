import { NotFoundException } from '@nestjs/common';

export type DelegateDeCadastro<T> = {
  findMany(argumentos: object): Promise<T[]>;
  findUnique(argumentos: { where: { id: number } }): Promise<T | null>;
  update(argumentos: { where: { id: number }; data: object }): Promise<T>;
};

export abstract class ServicoCadastro<T extends { id: number; ativo: boolean }, Publico = T> {
  protected abstract readonly delegate: DelegateDeCadastro<T>;
  protected abstract readonly mensagemNaoEncontrado: string;

  protected apresentar(item: T): Publico {
    return item as unknown as Publico;
  }

  async listar(incluirInativos: boolean): Promise<Publico[]> {
    const itens = await this.delegate.findMany({
      where: { ativo: incluirInativos ? undefined : true },
      orderBy: { id: 'asc' },
    });
    return itens.map((item) => this.apresentar(item));
  }

  async obter(id: number): Promise<T> {
    const item = await this.delegate.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(this.mensagemNaoEncontrado);
    return item;
  }

  async desativar(id: number): Promise<Publico> {
    await this.obter(id);
    return this.apresentar(await this.delegate.update({ where: { id }, data: { ativo: false } }));
  }
}
