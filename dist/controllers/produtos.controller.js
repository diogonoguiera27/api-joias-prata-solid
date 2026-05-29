"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtosController = void 0;
const produtos_service_1 = require("../services/produtos.service");
class ProdutosController {
    async criar(request, response) {
        try {
            const produto = await produtos_service_1.produtosService.criar(request.body);
            return response.status(201).json(produto);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar produto.";
            const status = message === "Categoria não encontrada."
                ? 404
                : message.includes("Já existe")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const produtos = await produtos_service_1.produtosService.listar();
            return response.status(200).json(produtos);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar produtos.",
            });
        }
    }
    async buscarPorSlug(request, response) {
        try {
            const slug = String(request.params.slug);
            const produto = await produtos_service_1.produtosService.buscarPorSlug({
                slug,
            });
            return response.status(200).json(produto);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar produto pelo slug.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const produto = await produtos_service_1.produtosService.buscarPorId({
                id,
            });
            return response.status(200).json(produto);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar produto.",
            });
        }
    }
    async atualizar(request, response) {
        try {
            const id = String(request.params.id);
            const produto = await produtos_service_1.produtosService.atualizar({
                id,
                ...request.body,
            });
            return response.status(200).json(produto);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar produto.";
            const status = message === "Produto não encontrado." ||
                message === "Categoria não encontrada."
                ? 404
                : message.includes("Já existe")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async desativar(request, response) {
        try {
            const id = String(request.params.id);
            const produto = await produtos_service_1.produtosService.desativar({
                id,
            });
            return response.status(200).json(produto);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao desativar produto.";
            const status = message === "Produto não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async ativar(request, response) {
        try {
            const id = String(request.params.id);
            const produto = await produtos_service_1.produtosService.ativar({
                id,
            });
            return response.status(200).json(produto);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao ativar produto.";
            const status = message === "Produto não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async remover(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await produtos_service_1.produtosService.remover({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao remover produto.",
            });
        }
    }
}
exports.produtosController = new ProdutosController();
