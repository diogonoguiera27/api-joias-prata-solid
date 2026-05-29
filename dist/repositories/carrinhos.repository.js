"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carrinhosRepository = void 0;
const prisma_1 = require("../lib/prisma");
class CarrinhosRepository {
    async buscarClientePorId(clienteId) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                id: clienteId,
            },
        });
    }
    async criarCarrinho(clienteId) {
        return prisma_1.prisma.carrinho.create({
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
        return prisma_1.prisma.carrinho.findMany({
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
    async buscarCarrinhoPorId(id) {
        return prisma_1.prisma.carrinho.findUnique({
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
    async buscarCarrinhoSimplesPorId(id) {
        return prisma_1.prisma.carrinho.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarProdutoPorId(produtoId) {
        return prisma_1.prisma.produto.findUnique({
            where: {
                id: produtoId,
            },
        });
    }
    async buscarVariacaoPorId(variacaoId) {
        return prisma_1.prisma.variacaoProduto.findUnique({
            where: {
                id: variacaoId,
            },
        });
    }
    async buscarItemExistente(carrinhoId, produtoId, variacaoId) {
        return prisma_1.prisma.itemCarrinho.findFirst({
            where: {
                carrinhoId,
                produtoId,
                variacaoId,
            },
        });
    }
    async atualizarItemCarrinho(itemId, data) {
        return prisma_1.prisma.itemCarrinho.update({
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
    async criarItemCarrinho(data) {
        return prisma_1.prisma.itemCarrinho.create({
            data,
            include: {
                produto: true,
                variacao: true,
            },
        });
    }
    async buscarItemPorId(itemId) {
        return prisma_1.prisma.itemCarrinho.findUnique({
            where: {
                id: itemId,
            },
            include: {
                produto: true,
                variacao: true,
            },
        });
    }
    async removerItemCarrinho(itemId) {
        return prisma_1.prisma.itemCarrinho.delete({
            where: {
                id: itemId,
            },
        });
    }
    async limparItensDoCarrinho(carrinhoId) {
        return prisma_1.prisma.itemCarrinho.deleteMany({
            where: {
                carrinhoId,
            },
        });
    }
    async atualizarStatusCarrinho(carrinhoId, status) {
        return prisma_1.prisma.carrinho.update({
            where: {
                id: carrinhoId,
            },
            data: {
                status,
            },
        });
    }
}
exports.carrinhosRepository = new CarrinhosRepository();
