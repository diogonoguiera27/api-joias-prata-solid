"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriasRepository = void 0;
const prisma_1 = require("../lib/prisma");
class CategoriasRepository {
    async criarCategoria(data) {
        return prisma_1.prisma.categoria.create({
            data,
        });
    }
    async listarCategoriasAtivas() {
        return prisma_1.prisma.categoria.findMany({
            where: {
                ativo: true,
            },
            orderBy: {
                criadoEm: "desc",
            },
        });
    }
    async buscarCategoriaPorId(id) {
        return prisma_1.prisma.categoria.findUnique({
            where: {
                id,
            },
        });
    }
    async buscarCategoriaPorSlug(slug) {
        return prisma_1.prisma.categoria.findUnique({
            where: {
                slug,
            },
        });
    }
    async atualizarCategoria(id, data) {
        return prisma_1.prisma.categoria.update({
            where: {
                id,
            },
            data,
        });
    }
    async atualizarStatusCategoria(id, ativo) {
        return prisma_1.prisma.categoria.update({
            where: {
                id,
            },
            data: {
                ativo,
            },
        });
    }
}
exports.categoriasRepository = new CategoriasRepository();
