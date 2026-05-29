"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosController = void 0;
const pedidos_service_1 = require("../services/pedidos.service");
class PedidosController {
    async criar(request, response) {
        try {
            const { carrinhoId, clienteId } = request.body;
            const resultado = await pedidos_service_1.pedidosService.criar({
                carrinhoId,
                clienteId,
            });
            return response.status(201).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro interno ao criar pedido.";
            const status = message === "Carrinho não encontrado." ||
                message === "Cliente informado não encontrado."
                ? 404
                : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const pedidos = await pedidos_service_1.pedidosService.listar();
            return response.status(200).json(pedidos);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar pedidos.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const pedido = await pedidos_service_1.pedidosService.buscarPorId({
                id,
            });
            return response.status(200).json(pedido);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar pedido.",
            });
        }
    }
    async atualizarStatus(request, response) {
        try {
            const id = String(request.params.id);
            const { status } = request.body;
            const pedido = await pedidos_service_1.pedidosService.atualizarStatus({
                id,
                status,
            });
            return response.status(200).json(pedido);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar status do pedido.";
            const status = message === "Pedido não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async cancelar(request, response) {
        try {
            const id = String(request.params.id);
            const pedido = await pedidos_service_1.pedidosService.cancelar({
                id,
            });
            return response.status(200).json(pedido);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao cancelar pedido.";
            const status = message === "Pedido não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
}
exports.pedidosController = new PedidosController();
