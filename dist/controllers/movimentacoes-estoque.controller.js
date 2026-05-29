"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movimentacoesEstoqueController = void 0;
const movimentacoes_estoque_service_1 = require("../services/movimentacoes-estoque.service");
class MovimentacoesEstoqueController {
    async criar(request, response) {
        try {
            const { variacaoId, tipo, quantidade, motivo } = request.body;
            const resultado = await movimentacoes_estoque_service_1.movimentacoesEstoqueService.criar({
                variacaoId,
                tipo,
                quantidade,
                motivo,
            });
            return response.status(201).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar movimentação de estoque.";
            const status = message === "Variação de produto não encontrada." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const movimentacoes = await movimentacoes_estoque_service_1.movimentacoesEstoqueService.listar();
            return response.status(200).json(movimentacoes);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar movimentações de estoque.",
            });
        }
    }
    async listarPorVariacao(request, response) {
        try {
            const variacaoId = String(request.params.variacaoId);
            const movimentacoes = await movimentacoes_estoque_service_1.movimentacoesEstoqueService.listarPorVariacao({
                variacaoId,
            });
            return response.status(200).json(movimentacoes);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao listar movimentações da variação.";
            const status = message === "Variação de produto não encontrada." ? 404 : 500;
            return response.status(status).json({
                message,
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const movimentacao = await movimentacoes_estoque_service_1.movimentacoesEstoqueService.buscarPorId({
                id,
            });
            return response.status(200).json(movimentacao);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar movimentação de estoque.",
            });
        }
    }
}
exports.movimentacoesEstoqueController = new MovimentacoesEstoqueController();
