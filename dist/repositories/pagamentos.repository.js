"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagamentosRepository = void 0;
const enums_1 = require("../generated/prisma/enums");
const prisma_1 = require("../lib/prisma");
class PagamentosRepository {
    getClient(tx) {
        return tx ?? prisma_1.prisma;
    }
    async executarTransacao(operacao) {
        return prisma_1.prisma.$transaction(operacao);
    }
    async buscarPedidoPorId(pedidoId) {
        return prisma_1.prisma.pedido.findUnique({
            where: {
                id: pedidoId,
            },
            include: {
                pagamento: true,
            },
        });
    }
    async criarPagamento(data) {
        return prisma_1.prisma.pagamento.create({
            data: {
                pedidoId: data.pedidoId,
                metodo: data.metodo,
                status: enums_1.StatusPagamento.PENDENTE,
                valor: data.valor,
            },
            include: {
                pedido: true,
            },
        });
    }
    async listarPagamentos() {
        return prisma_1.prisma.pagamento.findMany({
            include: {
                pedido: {
                    include: {
                        cliente: true,
                        itens: true,
                    },
                },
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarPagamentoPorId(id) {
        return prisma_1.prisma.pagamento.findUnique({
            where: {
                id,
            },
            include: {
                pedido: {
                    include: {
                        cliente: true,
                        itens: {
                            include: {
                                produto: true,
                                variacao: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async buscarPagamentoParaAprovacao(id) {
        return prisma_1.prisma.pagamento.findUnique({
            where: {
                id,
            },
            include: {
                pedido: {
                    include: {
                        itens: {
                            include: {
                                variacao: true,
                                produto: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async buscarPagamentoComPedido(id) {
        return prisma_1.prisma.pagamento.findUnique({
            where: {
                id,
            },
            include: {
                pedido: true,
            },
        });
    }
    async buscarPagamentoSimplesPorId(id) {
        return prisma_1.prisma.pagamento.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarPagamentoParaReembolso(id) {
        return prisma_1.prisma.pagamento.findUnique({
            where: {
                id,
            },
            include: {
                pedido: {
                    include: {
                        itens: {
                            include: {
                                variacao: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async marcarPagamentoComoAprovado(id, tx) {
        return this.getClient(tx).pagamento.update({
            where: {
                id,
            },
            data: {
                status: enums_1.StatusPagamento.APROVADO,
                pagoEm: new Date(),
            },
        });
    }
    async atualizarStatusPagamento(id, status, includePedido = true) {
        return prisma_1.prisma.pagamento.update({
            where: {
                id,
            },
            data: {
                status,
            },
            include: includePedido
                ? {
                    pedido: true,
                }
                : undefined,
        });
    }
    async marcarPagamentoComoReembolsado(id, tx) {
        return this.getClient(tx).pagamento.update({
            where: {
                id,
            },
            data: {
                status: enums_1.StatusPagamento.REEMBOLSADO,
            },
        });
    }
    async atualizarStatusPedido(id, status, tx) {
        return this.getClient(tx).pedido.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });
    }
    async atualizarEstoqueVariacao(id, estoque, tx) {
        return this.getClient(tx).variacaoProduto.update({
            where: {
                id,
            },
            data: {
                estoque,
            },
        });
    }
    async criarMovimentacaoEstoque(data, tx) {
        return this.getClient(tx).movimentacaoEstoque.create({
            data,
        });
    }
}
exports.pagamentosRepository = new PagamentosRepository();
