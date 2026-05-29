"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtosRepository = void 0;
const prisma_1 = require("../lib/prisma");
class ProdutosRepository {
    async criarProduto(data) {
        return prisma_1.prisma.produto.create({
            data,
            include: {
                categoria: true,
                variacoes: true,
                imagens: true,
            },
        });
    }
    async listarProdutosAtivos() {
        return prisma_1.prisma.produto.findMany({
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
    async buscarProdutoPorSlug(slug) {
        return prisma_1.prisma.produto.findUnique({
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
    async buscarProdutoSimplesPorSlug(slug) {
        return prisma_1.prisma.produto.findUnique({
            where: {
                slug,
            },
        });
    }
    async buscarProdutoPorId(id) {
        return prisma_1.prisma.produto.findUnique({
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
    async buscarProdutoSimplesPorId(id) {
        return prisma_1.prisma.produto.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarCategoriaPorId(categoriaId) {
        return prisma_1.prisma.categoria.findUnique({
            where: {
                id: categoriaId,
            },
        });
    }
    async atualizarProduto(id, data) {
        return prisma_1.prisma.produto.update({
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
    async atualizarStatusProduto(id, ativo) {
        return prisma_1.prisma.produto.update({
            where: {
                id,
            },
            data: {
                ativo,
            },
        });
    }
}
exports.produtosRepository = new ProdutosRepository();
