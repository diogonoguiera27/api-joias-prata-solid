import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

class MovimentacoesEstoqueRepository {
  async buscarVariacaoPorId(variacaoId: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        id: variacaoId,
      },
    });
  }

  async criarMovimentacaoEAtualizarEstoque(data: {
    variacaoId: string;
    tipo: TipoMovimentacaoEstoque;
    quantidade: number;
    motivo?: string | null;
    novoEstoque: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const movimentacao = await tx.movimentacaoEstoque.create({
        data: {
          variacaoId: data.variacaoId,
          tipo: data.tipo,
          quantidade: data.quantidade,
          motivo: data.motivo,
        },
      });

      const variacao = await tx.variacaoProduto.update({
        where: {
          id: data.variacaoId,
        },
        data: {
          estoque: data.novoEstoque,
        },
        include: {
          produto: true,
          movimentacoesEstoque: true,
        },
      });

      return {
        movimentacao,
        variacao,
      };
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
