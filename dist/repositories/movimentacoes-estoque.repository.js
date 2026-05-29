"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movimentacoesEstoqueRepository = void 0;
const prisma_1 = require("../lib/prisma");
class MovimentacoesEstoqueRepository {
    getClient(tx) {
        return tx ?? prisma_1.prisma;
    }
    async executarTransacao(operacao) {
        return prisma_1.prisma.$transaction(operacao);
    }
    async buscarVariacaoPorId(variacaoId) {
        return prisma_1.prisma.variacaoProduto.findUnique({
            where: {
                id: variacaoId,
            },
        });
    }
    async criarMovimentacaoEstoque(data, tx) {
        return this.getClient(tx).movimentacaoEstoque.create({
            data,
        });
    }
    async atualizarEstoqueVariacao(variacaoId, novoEstoque, tx) {
        return this.getClient(tx).variacaoProduto.update({
            where: {
                id: variacaoId,
            },
            data: {
                estoque: novoEstoque,
            },
            include: {
                produto: true,
                movimentacoesEstoque: true,
            },
        });
    }
    async listarMovimentacoes() {
        return prisma_1.prisma.movimentacaoEstoque.findMany({
            include: {
                variacao: {
                    include: {
                        produto: true,
                    },
                },
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async listarMovimentacoesPorVariacao(variacaoId) {
        return prisma_1.prisma.movimentacaoEstoque.findMany({
            where: {
                variacaoId,
            },
            include: {
                variacao: {
                    include: {
                        produto: true,
                    },
                },
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarMovimentacaoPorId(id) {
        return prisma_1.prisma.movimentacaoEstoque.findUnique({
            where: {
                id,
            },
            include: {
                variacao: {
                    include: {
                        produto: true,
                    },
                },
            },
        });
    }
}
exports.movimentacoesEstoqueRepository = new MovimentacoesEstoqueRepository();
