import { prisma } from "../lib/prisma";

class ClientesRepository {
  async criarCliente(data: {
    nome: string;
    email: string;
    telefone?: string | null;
    documento?: string | null;
  }) {
    return prisma.cliente.create({
      data,
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });
  }

  async listarClientes() {
    return prisma.cliente.findMany({
      include: {
        carrinhos: true,
        pedidos: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarClientePorId(id: string) {
    return prisma.cliente.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarClienteDetalhadoPorId(id: string) {
    return prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        carrinhos: {
          include: {
            itens: true,
          },
        },
        pedidos: {
          include: {
            itens: true,
            pagamento: true,
          },
        },
      },
    });
  }

  async buscarClientePorEmail(email: string) {
    return prisma.cliente.findUnique({
      where: {
        email,
      },
    });
  }

  async buscarClienteComVinculosPorId(id: string) {
    return prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });
  }

  async atualizarCliente(
    id: string,
    data: {
      nome: string;
      email: string;
      telefone?: string | null;
      documento?: string | null;
    }
  ) {
    return prisma.cliente.update({
      where: {
        id,
      },
      data,
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });
  }

  async removerCliente(id: string) {
    return prisma.cliente.delete({
      where: {
        id,
      },
    });
  }
}

export const clientesRepository = new ClientesRepository();
