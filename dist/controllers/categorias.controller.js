"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriasController = void 0;
const categorias_service_1 = require("../services/categorias.service");
class CategoriasController {
    async criar(request, response) {
        try {
            const { nome, descricao } = request.body;
            const categoria = await categorias_service_1.categoriasService.criar({
                nome,
                descricao,
            });
            return response.status(201).json(categoria);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar categoria.";
            const status = message.includes("Já existe") ? 409 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const categorias = await categorias_service_1.categoriasService.listar();
            return response.status(200).json(categorias);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar categorias.",
            });
        }
    }
    async buscarPorSlug(request, response) {
        try {
            const slug = String(request.params.slug);
            const categoria = await categorias_service_1.categoriasService.buscarPorSlug({
                slug,
            });
            return response.status(200).json(categoria);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar categoria pelo slug.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const categoria = await categorias_service_1.categoriasService.buscarPorId({
                id,
            });
            return response.status(200).json(categoria);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar categoria.",
            });
        }
    }
    async atualizar(request, response) {
        try {
            const id = String(request.params.id);
            const { nome, descricao } = request.body;
            const categoria = await categorias_service_1.categoriasService.atualizar({
                id,
                nome,
                descricao,
            });
            return response.status(200).json(categoria);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar categoria.";
            const status = message === "Categoria não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async desativar(request, response) {
        try {
            const id = String(request.params.id);
            const categoria = await categorias_service_1.categoriasService.desativar({
                id,
            });
            return response.status(200).json(categoria);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao desativar categoria.";
            const status = message === "Categoria não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async ativar(request, response) {
        try {
            const id = String(request.params.id);
            const categoria = await categorias_service_1.categoriasService.ativar({
                id,
            });
            return response.status(200).json(categoria);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao ativar categoria.";
            const status = message === "Categoria não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async remover(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await categorias_service_1.categoriasService.remover({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao remover categoria.",
            });
        }
    }
}
exports.categoriasController = new CategoriasController();
