"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagensProdutoRepository = void 0;
const prisma_1 = require("../lib/prisma");
class ImagensProdutoRepository {
    async buscarProdutoPorId(produtoId) {
        return prisma_1.prisma.produto.findUnique({
            where: {
                id: produtoId,
            },
        });
    }
    async criarImagem(data) {
        return prisma_1.prisma.imagemProduto.create({
            data,
            include: {
                produto: true,
            },
        });
    }
    async listarImagens() {
        return prisma_1.prisma.imagemProduto.findMany({
            include: {
                produto: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async listarImagensPorProduto(produtoId) {
        return prisma_1.prisma.imagemProduto.findMany({
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
    async buscarImagemPorId(id) {
        return prisma_1.prisma.imagemProduto.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarImagemDetalhadaPorId(id) {
        return prisma_1.prisma.imagemProduto.findUnique({
            where: {
                id,
            },
            include: {
                produto: true,
            },
        });
    }
    async removerPrincipalDasImagens(produtoId) {
        return prisma_1.prisma.imagemProduto.updateMany({
            where: {
                produtoId,
            },
            data: {
                principal: false,
            },
        });
    }
    async atualizarImagem(id, data) {
        return prisma_1.prisma.imagemProduto.update({
            where: {
                id,
            },
            data,
            include: {
                produto: true,
            },
        });
    }
    async definirImagemPrincipal(id) {
        return prisma_1.prisma.imagemProduto.update({
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
    async removerImagem(id) {
        return prisma_1.prisma.imagemProduto.delete({
            where: {
                id,
            },
        });
    }
}
exports.imagensProdutoRepository = new ImagensProdutoRepository();
