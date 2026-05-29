"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesRepository = void 0;
const prisma_1 = require("../lib/prisma");
class ClientesRepository {
    async criarCliente(data) {
        return prisma_1.prisma.cliente.create({
            data,
            include: {
                carrinhos: true,
                pedidos: true,
            },
        });
    }
    async listarClientes() {
        return prisma_1.prisma.cliente.findMany({
            include: {
                carrinhos: true,
                pedidos: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarClientePorId(id) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarClienteDetalhadoPorId(id) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                id,
            },
            include: {
                carrinhos: {
                    include: {
                        itens: true,
                    },
                },
                pedidos: {
                    include: {
                        itens: true,
                        pagamento: true,
                    },
                },
            },
        });
    }
    async buscarClientePorEmail(email) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                email,
            },
        });
    }
    async buscarClienteComVinculosPorId(id) {
        return prisma_1.prisma.cliente.findUnique({
            where: {
                id,
            },
            include: {
                carrinhos: true,
                pedidos: true,
            },
        });
    }
    async atualizarCliente(id, data) {
        return prisma_1.prisma.cliente.update({
            where: {
                id,
            },
            data,
            include: {
                carrinhos: true,
                pedidos: true,
            },
        });
    }
    async removerCliente(id) {
        return prisma_1.prisma.cliente.delete({
            where: {
                id,
            },
        });
    }
}
exports.clientesRepository = new ClientesRepository();
