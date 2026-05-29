import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

class MovimentacoesEstoqueRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async executarTransacao<T>(
    operacao: (tx: Prisma.TransactionClient) => Promise<T>
  ) {
    return prisma.$transaction(operacao);
  }

  async buscarVariacaoPorId(variacaoId: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        id: variacaoId,
      },
    });
  }

  async criarMovimentacaoEstoque(
    data: {
      variacaoId: string;
      tipo: TipoMovimentacaoEstoque;
      quantidade: number;
      motivo?: string | null;
    },
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).movimentacaoEstoque.create({
      data,
    });
  }

  async atualizarEstoqueVariacao(
    variacaoId: string,
    novoEstoque: number,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).variacaoProduto.update({
      where: {
        id: variacaoId,
      },
      data: {
        estoque: novoEstoque,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });
  }

  async listarMovimentacoes() {
    return prisma.movimentacaoEstoque.findMany({
      include: {
        variacao: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async listarMovimentacoesPorVariacao(variacaoId: string) {
    return prisma.movimentacaoEstoque.findMany({
      where: {
        variacaoId,
      },
      include: {
        variacao: {
          include: {
            produto: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarMovimentacaoPorId(id: string) {
    return prisma.movimentacaoEstoque.findUnique({
      where: {
        id,
      },
      include: {
        variacao: {
          include: {
            produto: true,
          },
        },
      },
    });
  }
}

export const movimentacoesEstoqueRepository =
  new MovimentacoesEstoqueRepository();
