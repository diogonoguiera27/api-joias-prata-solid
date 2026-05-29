"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosRepository = void 0;
const prisma_1 = require("../lib/prisma");
class PedidosRepository {
    getClient(tx) {
        return tx ?? prisma_1.prisma;
    }
    async executarTransacao(operacao) {
        return prisma_1.prisma.$transaction(operacao);
    }
    async buscarCarrinhoPorId(carrinhoId) {
        return prisma_1.prisma.carrinho.findUnique({
            where: {
                id: carrinhoId,
            },
            include: {
                itens: {
                    include: {
                        produto: true,
                        variacao: true,
                    },
                },
            },
        });
    }
    async buscarClientePorId(clienteId) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                id: clienteId,
            },
        });
    }
    async criarPedido(data, tx) {
        return this.getClient(tx).pedido.create({
            data: {
                clienteId: data.clienteId,
                subtotal: data.subtotal,
                totalDesconto: data.totalDesconto,
                totalFrete: data.totalFrete,
                total: data.total,
                status: data.status,
                itens: {
                    create: data.itens.map((item) => ({
                        produtoId: item.produtoId,
                        variacaoId: item.variacaoId,
                        nomeProduto: item.nomeProduto,
                        quantidade: item.quantidade,
                        precoUnitario: item.precoUnitario,
                        subtotal: item.subtotal,
                    })),
                },
            },
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        variacao: true,
                    },
                },
                pagamento: true,
            },
        });
    }
    async atualizarCarrinhoAposCriacaoPedido(carrinhoId, data, tx) {
        return this.getClient(tx).carrinho.update({
            where: {
                id: carrinhoId,
            },
            data,
            include: {
                itens: true,
            },
        });
    }
    async listarPedidos() {
        return prisma_1.prisma.pedido.findMany({
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        variacao: true,
                    },
                },
                pagamento: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarPedidoPorId(id) {
        return prisma_1.prisma.pedido.findUnique({
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
                pagamento: true,
            },
        });
    }
    async buscarPedidoComPagamentoPorId(id) {
        return prisma_1.prisma.pedido.findUnique({
            where: {
                id,
            },
            include: {
                pagamento: true,
            },
        });
    }
    async buscarPedidoSimplesPorId(id) {
        return prisma_1.prisma.pedido.findUnique({
            where: {
                id,
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
            include: {
                cliente: true,
                itens: {
                    include: {
                        produto: true,
                        variacao: true,
                    },
                },
                pagamento: true,
            },
        });
    }
}
exports.pedidosRepository = new PedidosRepository();
