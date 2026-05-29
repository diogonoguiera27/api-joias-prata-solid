import { StatusCarrinho, StatusPedido } from "../generated/prisma/enums";
import { Prisma } from "../generated/prisma/client";
import { prisma } from "../lib/prisma";

class PedidosRepository {
  private getClient(tx?: Prisma.TransactionClient) {
    return tx ?? prisma;
  }

  async executarTransacao<T>(
    operacao: (tx: Prisma.TransactionClient) => Promise<T>
  ) {
    return prisma.$transaction(operacao);
  }

  async buscarCarrinhoPorId(carrinhoId: string) {
    return prisma.carrinho.findUnique({
      where: {
        id: carrinhoId,
      },
      include: {
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
    });
  }

  async buscarClientePorId(clienteId: string) {
    return prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });
  }

  async criarPedido(
    data: {
      clienteId: string | null;
      subtotal: number;
      totalDesconto: number;
      totalFrete: number;
      total: number;
      status: StatusPedido;
      itens: Array<{
        produtoId: string;
        variacaoId: string;
        nomeProduto: string;
        quantidade: number;
        precoUnitario: unknown;
        subtotal: unknown;
      }>;
    },
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).pedido.create({
      data: {
        clienteId: data.clienteId,
        subtotal: data.subtotal,
        totalDesconto: data.totalDesconto,
        totalFrete: data.totalFrete,
        total: data.total,
        status: data.status,
        itens: {
          create: data.itens.map((item) => ({
            produtoId: item.produtoId,
            variacaoId: item.variacaoId,
            nomeProduto: item.nomeProduto,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario as any,
            subtotal: item.subtotal as any,
          })),
        },
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
        pagamento: true,
      },
    });
  }

  async atualizarCarrinhoAposCriacaoPedido(
    carrinhoId: string,
    data: {
      status: StatusCarrinho;
      clienteId: string | null;
    },
    tx?: Prisma.TransactionClient
  ) {
    return this.getClient(tx).carrinho.update({
      where: {
        id: carrinhoId,
      },
      data,
      include: {
        itens: true,
      },
    });
  }

  async listarPedidos() {
    return prisma.pedido.findMany({
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
        pagamento: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarPedidoPorId(id: string) {
    return prisma.pedido.findUnique({
      where: {
        id,
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
        pagamento: true,
      },
    });
  }

  async buscarPedidoComPagamentoPorId(id: string) {
    return prisma.pedido.findUnique({
      where: {
        id,
      },
      include: {
        pagamento: true,
      },
    });
  }

  async buscarPedidoSimplesPorId(id: string) {
    return prisma.pedido.findUnique({
      where: {
        id,
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
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
        pagamento: true,
      },
    });
  }
}

export const pedidosRepository = new PedidosRepository();
