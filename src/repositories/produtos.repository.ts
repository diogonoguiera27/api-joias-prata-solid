import { prisma } from "../lib/prisma";

class ProdutosRepository {
  async criarProduto(data: {
    nome: string;
    slug: string;
    descricao?: string | null;
    precoBase: number;
    percentualDesconto: number;
    precoFinal: number;
    material?: string | null;
    colecao?: string | null;
    categoriaId: string;
  }) {
    return prisma.produto.create({
      data,
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });
  }

  async listarProdutosAtivos() {
    return prisma.produto.findMany({
      where: {
        ativo: true,
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarProdutoPorSlug(slug: string) {
    return prisma.produto.findUnique({
      where: {
        slug,
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });
  }

  async buscarProdutoSimplesPorSlug(slug: string) {
    return prisma.produto.findUnique({
      where: {
        slug,
      },
    });
  }

  async buscarProdutoPorId(id: string) {
    return prisma.produto.findUnique({
      where: {
        id,
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });
  }

  async buscarProdutoSimplesPorId(id: string) {
    return prisma.produto.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarCategoriaPorId(categoriaId: string) {
    return prisma.categoria.findUnique({
      where: {
        id: categoriaId,
      },
    });
  }

  async atualizarProduto(
    id: string,
    data: {
      nome: string;
      slug: string;
      descricao?: string | null;
      precoBase: number;
      percentualDesconto: number;
      precoFinal: number;
      material?: string | null;
      colecao?: string | null;
      categoriaId: string;
    }
  ) {
    return prisma.produto.update({
      where: {
        id,
      },
      data,
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });
  }

  async atualizarStatusProduto(id: string, ativo: boolean) {
    return prisma.produto.update({
      where: {
        id,
      },
      data: {
        ativo,
      },
    });
  }
}

export const produtosRepository = new ProdutosRepository();
