import { StatusCarrinho } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";


class CarrinhosRepository {
  async buscarClientePorId(clienteId: string) {
    return prisma.cliente.findUnique({
      where: {
        id: clienteId,
      },
    });
  }

  async criarCarrinho(clienteId?: string | null) {
    return prisma.carrinho.create({
      data: {
        clienteId: clienteId ?? null,
        status: "ATIVO",
      },
      include: {
        cliente: true,
        itens: true,
      },
    });
  }

  async listarCarrinhos() {
    return prisma.carrinho.findMany({
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarCarrinhoPorId(id: string) {
    return prisma.carrinho.findUnique({
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
      },
    });
  }

  async buscarCarrinhoSimplesPorId(id: string) {
    return prisma.carrinho.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarProdutoPorId(produtoId: string) {
    return prisma.produto.findUnique({
      where: {
        id: produtoId,
      },
    });
  }

  async buscarVariacaoPorId(variacaoId: string) {
    return prisma.variacaoProduto.findUnique({
      where: {
        id: variacaoId,
      },
    });
  }

  async buscarItemExistente(
    carrinhoId: string,
    produtoId: string,
    variacaoId: string,
  ) {
    return prisma.itemCarrinho.findFirst({
      where: {
        carrinhoId,
        produtoId,
        variacaoId,
      },
    });
  }

  async atualizarItemCarrinho(
    itemId: string,
    data: {
      quantidade: number;
      precoUnitario: number;
      subtotal: number;
    },
  ) {
    return prisma.itemCarrinho.update({
      where: {
        id: itemId,
      },
      data,
      include: {
        produto: true,
        variacao: true,
      },
    });
  }

  async criarItemCarrinho(data: {
    carrinhoId: string;
    produtoId: string;
    variacaoId: string;
    quantidade: number;
    precoUnitario: number;
    subtotal: number;
  }) {
    return prisma.itemCarrinho.create({
      data,
      include: {
        produto: true,
        variacao: true,
      },
    });
  }

  async buscarItemPorId(itemId: string) {
    return prisma.itemCarrinho.findUnique({
      where: {
        id: itemId,
      },
      include: {
        produto: true,
        variacao: true,
      },
    });
  }

  async removerItemCarrinho(itemId: string) {
    return prisma.itemCarrinho.delete({
      where: {
        id: itemId,
      },
    });
  }

  async limparItensDoCarrinho(carrinhoId: string) {
  return prisma.itemCarrinho.deleteMany({
    where: {
      carrinhoId,
    },
  });
}

async atualizarStatusCarrinho(carrinhoId: string, status: StatusCarrinho) {
  return prisma.carrinho.update({
    where: {
      id: carrinhoId,
    },
    data: {
      status,
    },
  });
}

}

export const carrinhosRepository = new CarrinhosRepository();
