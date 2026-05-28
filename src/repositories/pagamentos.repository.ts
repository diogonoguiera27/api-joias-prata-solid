import {
  MetodoPagamento,
  StatusPagamento,
  StatusPedido,
  TipoMovimentacaoEstoque,
} from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

class PagamentosRepository {
  async buscarPedidoPorId(pedidoId: string) {
    return prisma.pedido.findUnique({
      where: {
        id: pedidoId,
      },
      include: {
        pagamento: true,
      },
    });
  }

  async criarPagamento(data: {
    pedidoId: string;
    metodo: MetodoPagamento;
    valor: unknown;
  }) {
    return prisma.pagamento.create({
      data: {
        pedidoId: data.pedidoId,
        metodo: data.metodo,
        status: StatusPagamento.PENDENTE,
        valor: data.valor as any,
      },
      include: {
        pedido: true,
      },
    });
  }

  async listarPagamentos() {
    return prisma.pagamento.findMany({
      include: {
        pedido: {
          include: {
            cliente: true,
            itens: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarPagamentoPorId(id: string) {
    return prisma.pagamento.findUnique({
      where: {
        id,
      },
      include: {
        pedido: {
          include: {
            cliente: true,
            itens: {
              include: {
                produto: true,
                variacao: true,
              },
            },
          },
        },
      },
    });
  }

  async buscarPagamentoParaAprovacao(id: string) {
    return prisma.pagamento.findUnique({
      where: {
        id,
      },
      include: {
        pedido: {
          include: {
            itens: {
              include: {
                variacao: true,
                produto: true,
              },
            },
          },
        },
      },
    });
  }

  async buscarPagamentoComPedido(id: string) {
    return prisma.pagamento.findUnique({
      where: {
        id,
      },
      include: {
        pedido: true,
      },
    });
  }

  async buscarPagamentoSimplesPorId(id: string) {
    return prisma.pagamento.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarPagamentoParaReembolso(id: string) {
    return prisma.pagamento.findUnique({
      where: {
        id,
      },
      include: {
        pedido: {
          include: {
            itens: {
              include: {
                variacao: true,
              },
            },
          },
        },
      },
    });
  }

  async aprovarPagamento(id: string, pagamento: Awaited<ReturnType<this["buscarPagamentoParaAprovacao"]>>) {
    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    return prisma.$transaction(async (tx) => {
      const pagamentoAprovado = await tx.pagamento.update({
        where: {
          id,
        },
        data: {
          status: StatusPagamento.APROVADO,
          pagoEm: new Date(),
        },
      });

      const pedidoAtualizado = await tx.pedido.update({
        where: {
          id: pagamento.pedidoId,
        },
        data: {
          status: StatusPedido.PAGO,
        },
      });

      for (const item of pagamento.pedido.itens) {
        await tx.variacaoProduto.update({
          where: {
            id: item.variacaoId,
          },
          data: {
            estoque: item.variacao.estoque - item.quantidade,
          },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: item.variacaoId,
            tipo: TipoMovimentacaoEstoque.VENDA,
            quantidade: item.quantidade,
            motivo: `Baixa automática após pagamento aprovado do pedido ${pagamento.pedidoId}.`,
          },
        });
      }

      return {
        pagamento: pagamentoAprovado,
        pedido: pedidoAtualizado,
      };
    });
  }

  async atualizarStatusPagamento(
    id: string,
    status: StatusPagamento,
    includePedido = true
  ) {
    return prisma.pagamento.update({
      where: {
        id,
      },
      data: {
        status,
      },
      include: includePedido
        ? {
            pedido: true,
          }
        : undefined,
    });
  }

  async reembolsarPagamento(id: string, pagamento: Awaited<ReturnType<this["buscarPagamentoParaReembolso"]>>) {
    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    return prisma.$transaction(async (tx) => {
      const pagamentoReembolsado = await tx.pagamento.update({
        where: {
          id,
        },
        data: {
          status: StatusPagamento.REEMBOLSADO,
        },
      });

      const pedidoReembolsado = await tx.pedido.update({
        where: {
          id: pagamento.pedidoId,
        },
        data: {
          status: StatusPedido.REEMBOLSADO,
        },
      });

      for (const item of pagamento.pedido.itens) {
        await tx.variacaoProduto.update({
          where: {
            id: item.variacaoId,
          },
          data: {
            estoque: item.variacao.estoque + item.quantidade,
          },
        });

        await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: item.variacaoId,
            tipo: TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO,
            quantidade: item.quantidade,
            motivo: `Devolução automática após reembolso do pedido ${pagamento.pedidoId}.`,
          },
        });
      }

      return {
        pagamento: pagamentoReembolsado,
        pedido: pedidoReembolsado,
      };
    });
  }
}

export const pagamentosRepository = new PagamentosRepository();
