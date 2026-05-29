import {
  MetodoPagamento,
  StatusPagamento,
  StatusPedido,
  TipoMovimentacaoEstoque,
} from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

class PagamentosRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async executarTransacao<T>(
    operacao: (tx: Prisma.TransactionClient) => Promise<T>
  ) {
    return prisma.$transaction(operacao);
  }

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

  async marcarPagamentoComoAprovado(
    id: string,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).pagamento.update({
      where: {
        id,
      },
      data: {
        status: StatusPagamento.APROVADO,
        pagoEm: new Date(),
      },
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

  async marcarPagamentoComoReembolsado(
    id: string,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).pagamento.update({
      where: {
        id,
      },
      data: {
        status: StatusPagamento.REEMBOLSADO,
      },
    });
  }

  async atualizarStatusPedido(
    id: string,
    status: StatusPedido,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).pedido.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });
  }

  async atualizarEstoqueVariacao(
    id: string,
    estoque: number,
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).variacaoProduto.update({
      where: {
        id,
      },
      data: {
        estoque,
      },
    });
  }

  async criarMovimentacaoEstoque(
    data: {
      variacaoId: string;
      tipo: TipoMovimentacaoEstoque;
      quantidade: number;
      motivo: string;
    },
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).movimentacaoEstoque.create({
      data,
    });
  }
}

export const pagamentosRepository = new PagamentosRepository();
