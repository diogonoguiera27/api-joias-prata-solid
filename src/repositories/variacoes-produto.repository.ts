import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

class VariacoesProdutoRepository {
  async buscarProdutoPorId(produtoId: string) {
    return prisma.produto.findUnique({
      where: {
        id: produtoId,
      },
    });
  }

  async buscarVariacaoPorSku(sku: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        sku,
      },
    });
  }

  async criarVariacao(data: {
    produtoId: string;
    nome: string;
    sku: string;
    tamanho?: string | null;
    cor?: string | null;
    precoAdicional: number;
    estoque: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const variacao = await tx.variacaoProduto.create({
        data,
        include: {
          produto: true,
          movimentacoesEstoque: true,
        },
      });

      if (data.estoque > 0) {
        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: variacao.id,
            tipo: TipoMovimentacaoEstoque.ENTRADA,
            quantidade: data.estoque,
            motivo: "Estoque inicial da variação.",
          },
        });
      }

      return variacao;
    });
  }

  async listarVariacoesAtivas() {
    return prisma.variacaoProduto.findMany({
      where: {
        ativo: true,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async listarVariacoesPorProduto(produtoId: string) {
    return prisma.variacaoProduto.findMany({
      where: {
        produtoId,
        ativo: true,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarVariacaoPorId(id: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarVariacaoDetalhadaPorId(id: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        id,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });
  }

  async atualizarVariacao(
    id: string,
    data: {
      produtoId: string;
      nome: string;
      sku: string;
      tamanho?: string | null;
      cor?: string | null;
      precoAdicional: number;
      estoque: number;
    }
  ) {
    return prisma.variacaoProduto.update({
      where: {
        id,
      },
      data,
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });
  }

  async atualizarEstoque(
    id: string,
    data: {
      novoEstoque: number;
      diferenca: number;
      estoqueAtual: number;
      motivo?: string | null;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const variacao = await tx.variacaoProduto.update({
        where: {
          id,
        },
        data: {
          estoque: data.novoEstoque,
        },
        include: {
          produto: true,
          movimentacoesEstoque: true,
        },
      });

      if (data.diferenca !== 0) {
        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: id,
            tipo: TipoMovimentacaoEstoque.AJUSTE,
            quantidade: Math.abs(data.diferenca),
            motivo:
              data.motivo ||
              `Ajuste manual de estoque. Estoque anterior: ${data.estoqueAtual}. Novo estoque: ${data.novoEstoque}.`,
          },
        });
      }

      return variacao;
    });
  }

  async atualizarStatusVariacao(id: string, ativo: boolean) {
    return prisma.variacaoProduto.update({
      where: {
        id,
      },
      data: {
        ativo,
      },
    });
  }
}

export const variacoesProdutoRepository = new VariacoesProdutoRepository();
