import { prisma } from "../lib/prisma";

class ImagensProdutoRepository {
  async buscarProdutoPorId(produtoId: string) {
    return prisma.produto.findUnique({
      where: {
        id: produtoId,
      },
    });
  }

  async criarImagem(data: {
    produtoId: string;
    url: string;
    textoAlt?: string | null;
    principal: boolean;
  }) {
    return prisma.imagemProduto.create({
      data,
      include: {
        produto: true,
      },
    });
  }

  async listarImagens() {
    return prisma.imagemProduto.findMany({
      include: {
        produto: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async listarImagensPorProduto(produtoId: string) {
    return prisma.imagemProduto.findMany({
      where: {
        produtoId,
      },
      include: {
        produto: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarImagemPorId(id: string) {
    return prisma.imagemProduto.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarImagemDetalhadaPorId(id: string) {
    return prisma.imagemProduto.findUnique({
      where: {
        id,
      },
      include: {
        produto: true,
      },
    });
  }

  async removerPrincipalDasImagens(produtoId: string) {
    return prisma.imagemProduto.updateMany({
      where: {
        produtoId,
      },
      data: {
        principal: false,
      },
    });
  }

  async atualizarImagem(
    id: string,
    data: {
      url: string;
      textoAlt?: string | null;
      principal: boolean;
    }
  ) {
    return prisma.imagemProduto.update({
      where: {
        id,
      },
      data,
      include: {
        produto: true,
      },
    });
  }

  async definirImagemPrincipal(id: string) {
    return prisma.imagemProduto.update({
      where: {
        id,
      },
      data: {
        principal: true,
      },
      include: {
        produto: true,
      },
    });
  }

  async removerImagem(id: string) {
    return prisma.imagemProduto.delete({
      where: {
        id,
      },
    });
  }
}

export const imagensProdutoRepository = new ImagensProdutoRepository();
