"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variacoesProdutoController = void 0;
const variacoes_produto_service_1 = require("../services/variacoes-produto.service");
class VariacoesProdutoController {
    async criar(request, response) {
        try {
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.criar(request.body);
            return response.status(201).json(variacao);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar variação de produto.";
            const status = message === "Produto não encontrado."
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
            const variacoes = await variacoes_produto_service_1.variacoesProdutoService.listar();
            return response.status(200).json(variacoes);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar variações de produto.",
            });
        }
    }
    async listarPorProduto(request, response) {
        try {
            const produtoId = String(request.params.produtoId);
            const variacoes = await variacoes_produto_service_1.variacoesProdutoService.listarPorProduto({
                produtoId,
            });
            return response.status(200).json(variacoes);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao listar variações do produto.";
            const status = message === "Produto não encontrado." ? 404 : 500;
            return response.status(status).json({
                message,
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.buscarPorId({
                id,
            });
            return response.status(200).json(variacao);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar variação de produto.",
            });
        }
    }
    async atualizar(request, response) {
        try {
            const id = String(request.params.id);
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.atualizar({
                id,
                ...request.body,
            });
            return response.status(200).json(variacao);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar variação de produto.";
            const status = message === "Variação de produto não encontrada." ||
                message === "Produto não encontrado."
                ? 404
                : message.includes("Já existe")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async atualizarEstoque(request, response) {
        try {
            const id = String(request.params.id);
            const { estoque, motivo } = request.body;
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.atualizarEstoque({
                id,
                estoque,
                motivo,
            });
            return response.status(200).json(variacao);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar estoque da variação.";
            const status = message === "Variação de produto não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async desativar(request, response) {
        try {
            const id = String(request.params.id);
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.desativar({
                id,
            });
            return response.status(200).json(variacao);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao desativar variação.";
            const status = message === "Variação de produto não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async ativar(request, response) {
        try {
            const id = String(request.params.id);
            const variacao = await variacoes_produto_service_1.variacoesProdutoService.ativar({
                id,
            });
            return response.status(200).json(variacao);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao ativar variação.";
            const status = message === "Variação de produto não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async remover(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await variacoes_produto_service_1.variacoesProdutoService.remover({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao remover variação.",
            });
        }
    }
}
exports.variacoesProdutoController = new VariacoesProdutoController();
