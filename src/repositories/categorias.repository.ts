import { prisma } from "../lib/prisma";

class CategoriasRepository {
  async criarCategoria(data: {
    nome: string;
    slug: string;
    descricao?: string | null;
  }) {
    return prisma.categoria.create({
      data,
    });
  }

  async listarCategoriasAtivas() {
    return prisma.categoria.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarCategoriaPorId(id: string) {
    return prisma.categoria.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarCategoriaPorSlug(slug: string) {
    return prisma.categoria.findUnique({
      where: {
        slug,
      },
    });
  }

  async atualizarCategoria(
    id: string,
    data: {
      nome: string;
      slug: string;
      descricao?: string | null;
    }
  ) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data,
    });
  }

  async atualizarStatusCategoria(id: string, ativo: boolean) {
    return prisma.categoria.update({
      where: {
        id,
      },
      data: {
        ativo,
      },
    });
  }
}

export const categoriasRepository = new CategoriasRepository();
