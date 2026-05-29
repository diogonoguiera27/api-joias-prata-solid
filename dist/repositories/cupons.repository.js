"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuponsRepository = void 0;
const prisma_1 = require("../lib/prisma");
class CuponsRepository {
    async criarCupom(data) {
        return prisma_1.prisma.cupom.create({
            data,
        });
    }
    async listarCupons() {
        return prisma_1.prisma.cupom.findMany({
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarCupomPorId(id) {
        return prisma_1.prisma.cupom.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarCupomPorCodigo(codigo) {
        return prisma_1.prisma.cupom.findUnique({
            where: {
                codigo,
            },
        });
    }
    async atualizarCupom(id, data) {
        return prisma_1.prisma.cupom.update({
            where: {
                id,
            },
            data,
        });
    }
    async atualizarStatusCupom(id, ativo) {
        return prisma_1.prisma.cupom.update({
            where: {
                id,
            },
            data: {
                ativo,
            },
        });
    }
}
exports.cuponsRepository = new CuponsRepository();
