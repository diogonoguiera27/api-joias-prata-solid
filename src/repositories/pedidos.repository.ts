import { StatusCarrinho, StatusPedido } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

class PedidosRepository {
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

  async criarPedidoDoCarrinho(data: {
    carrinho: Awaited<ReturnType<PedidosRepository["buscarCarrinhoPorId"]>>;
    clienteId: string | null;
    subtotal: number;
    totalDesconto: number;
    totalFrete: number;
    total: number;
  }) {
    if (!data.carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    const carrinho = data.carrinho;

    return prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          clienteId: data.clienteId,
          subtotal: data.subtotal,
          totalDesconto: data.totalDesconto,
          totalFrete: data.totalFrete,
          total: data.total,
          status: StatusPedido.PENDENTE_PAGAMENTO,
          itens: {
            create: carrinho.itens.map((item) => ({
              produtoId: item.produtoId,
              variacaoId: item.variacaoId,
              nomeProduto: item.produto.nome,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              subtotal: item.subtotal,
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

      const carrinhoAtualizado = await tx.carrinho.update({
        where: {
          id: carrinho.id,
        },
        data: {
          status: StatusCarrinho.CONVERTIDO_EM_PEDIDO,
          clienteId: data.clienteId,
        },
        include: {
          itens: true,
        },
      });

      return {
        pedido,
        carrinho: carrinhoAtualizado,
      };
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

  async atualizarStatusPedido(id: string, status: StatusPedido) {
    return prisma.pedido.update({
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

  async cancelarPedido(id: string) {
    return prisma.pedido.update({
      where: {
        id,
      },
      data: {
        status: StatusPedido.CANCELADO,
      },
      include: {
        cliente: true,
        itens: true,
        pagamento: true,
      },
    });
  }
}

export const pedidosRepository = new PedidosRepository();
