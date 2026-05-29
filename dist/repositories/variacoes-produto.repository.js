"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variacoesProdutoRepository = void 0;
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
class VariacoesProdutoRepository {
    async buscarProdutoPorId(produtoId) {
        return prisma_1.prisma.produto.findUnique({
            where: {
                id: produtoId,
            },
        });
    }
    async buscarVariacaoPorSku(sku) {
        return prisma_1.prisma.variacaoProduto.findUnique({
            where: {
                sku,
            },
        });
    }
    async criarVariacao(data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const variacao = await tx.variacaoProduto.create({
                data,
                include: {
                    produto: true,
                    movimentacoesEstoque: true,
                },
            });
            if (data.estoque > 0) {
                await tx.movimentacaoEstoque.create({
                    data: {
                        variacaoId: variacao.id,
                        tipo: enums_1.TipoMovimentacaoEstoque.ENTRADA,
                        quantidade: data.estoque,
                        motivo: "Estoque inicial da variação.",
                    },
                });
            }
            return variacao;
        });
    }
    async listarVariacoesAtivas() {
        return prisma_1.prisma.variacaoProduto.findMany({
            where: {
                ativo: true,
            },
            include: {
                produto: true,
                movimentacoesEstoque: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async listarVariacoesPorProduto(produtoId) {
        return prisma_1.prisma.variacaoProduto.findMany({
            where: {
                produtoId,
                ativo: true,
            },
            include: {
                produto: true,
                movimentacoesEstoque: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarVariacaoPorId(id) {
        return prisma_1.prisma.variacaoProduto.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarVariacaoDetalhadaPorId(id) {
        return prisma_1.prisma.variacaoProduto.findUnique({
            where: {
                id,
            },
            include: {
                produto: true,
                movimentacoesEstoque: true,
            },
        });
    }
    async atualizarVariacao(id, data) {
        return prisma_1.prisma.variacaoProduto.update({
            where: {
                id,
            },
            data,
            include: {
                produto: true,
                movimentacoesEstoque: true,
            },
        });
    }
    async atualizarEstoque(id, data) {
        return prisma_1.prisma.$transaction(async (tx) => {
            const variacao = await tx.variacaoProduto.update({
                where: {
                    id,
                },
                data: {
                    estoque: data.novoEstoque,
                },
                include: {
                    produto: true,
                    movimentacoesEstoque: true,
                },
            });
            if (data.diferenca !== 0) {
                await tx.movimentacaoEstoque.create({
                    data: {
                        variacaoId: id,
                        tipo: enums_1.TipoMovimentacaoEstoque.AJUSTE,
                        quantidade: Math.abs(data.diferenca),
                        motivo: data.motivo ||
                            `Ajuste manual de estoque. Estoque anterior: ${data.estoqueAtual}. Novo estoque: ${data.novoEstoque}.`,
                    },
                });
            }
            return variacao;
        });
    }
    async atualizarStatusVariacao(id, ativo) {
        return prisma_1.prisma.variacaoProduto.update({
            where: {
                id,
            },
            data: {
                ativo,
            },
        });
    }
}
exports.variacoesProdutoRepository = new VariacoesProdutoRepository();
