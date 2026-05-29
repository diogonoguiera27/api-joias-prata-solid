"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carrinhosController = void 0;
const carrinhos_service_1 = require("../services/carrinhos.service");
class CarrinhosController {
    async criar(request, response) {
        try {
            const { clienteId } = request.body;
            const carrinho = await carrinhos_service_1.carrinhosService.criar({
                clienteId: clienteId ? String(clienteId) : null,
            });
            return response.status(201).json(carrinho);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao criar carrinho.",
            });
        }
    }
    async listar(request, response) {
        try {
            const carrinhos = await carrinhos_service_1.carrinhosService.listar();
            return response.status(200).json(carrinhos);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar carrinhos.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const carrinho = await carrinhos_service_1.carrinhosService.buscarPorId(id);
            return response.status(200).json(carrinho);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar carrinho.",
            });
        }
    }
    async adicionarItem(request, response) {
        try {
            const carrinhoId = String(request.params.id);
            const { produtoId, variacaoId, quantidade } = request.body;
            const item = await carrinhos_service_1.carrinhosService.adicionarItem({
                carrinhoId,
                produtoId: String(produtoId),
                variacaoId: String(variacaoId),
                quantidade,
            });
            return response.status(201).json(item);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao adicionar item ao carrinho.",
            });
        }
    }
    async atualizarQuantidadeItem(request, response) {
        try {
            const carrinhoId = String(request.params.id);
            const itemId = String(request.params.itemId);
            const { quantidade } = request.body;
            const itemAtualizado = await carrinhos_service_1.carrinhosService.atualizarQuantidadeItem({
                carrinhoId,
                itemId,
                quantidade,
            });
            return response.status(200).json(itemAtualizado);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao atualizar item do carrinho.",
            });
        }
    }
    async removerItem(request, response) {
        try {
            const carrinhoId = String(request.params.id);
            const itemId = String(request.params.itemId);
            const resultado = await carrinhos_service_1.carrinhosService.removerItem({
                carrinhoId,
                itemId,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao remover item do carrinho.",
            });
        }
    }
    async limpar(request, response) {
        try {
            const carrinhoId = String(request.params.id);
            const resultado = await carrinhos_service_1.carrinhosService.limpar({
                carrinhoId,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao limpar carrinho.",
            });
        }
    }
    async abandonar(request, response) {
        try {
            const carrinhoId = String(request.params.id);
            const carrinho = await carrinhos_service_1.carrinhosService.abandonar({
                carrinhoId,
            });
            return response.status(200).json(carrinho);
        }
        catch (error) {
            return response.status(400).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao abandonar carrinho.",
            });
        }
    }
}
exports.carrinhosController = new CarrinhosController();
