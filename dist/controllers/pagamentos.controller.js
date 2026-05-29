"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagamentosController = void 0;
const pagamentos_service_1 = require("../services/pagamentos.service");
class PagamentosController {
    async criar(request, response) {
        try {
            const { pedidoId, metodo } = request.body;
            const pagamento = await pagamentos_service_1.pagamentosService.criar({
                pedidoId,
                metodo,
            });
            return response.status(201).json(pagamento);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar pagamento.";
            const status = message === "Pedido não encontrado."
                ? 404
                : message.includes("já possui")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const pagamentos = await pagamentos_service_1.pagamentosService.listar();
            return response.status(200).json(pagamentos);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar pagamentos.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const pagamento = await pagamentos_service_1.pagamentosService.buscarPorId({
                id,
            });
            return response.status(200).json(pagamento);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar pagamento.",
            });
        }
    }
    async aprovar(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await pagamentos_service_1.pagamentosService.aprovar({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao aprovar pagamento.";
            const status = message === "Pagamento não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async recusar(request, response) {
        try {
            const id = String(request.params.id);
            const pagamento = await pagamentos_service_1.pagamentosService.recusar({
                id,
            });
            return response.status(200).json(pagamento);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao recusar pagamento.";
            const status = message === "Pagamento não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async cancelar(request, response) {
        try {
            const id = String(request.params.id);
            const pagamento = await pagamentos_service_1.pagamentosService.cancelar({
                id,
            });
            return response.status(200).json(pagamento);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao cancelar pagamento.";
            const status = message === "Pagamento não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async reembolsar(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await pagamentos_service_1.pagamentosService.reembolsar({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao reembolsar pagamento.";
            const status = message === "Pagamento não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
}
exports.pagamentosController = new PagamentosController();
