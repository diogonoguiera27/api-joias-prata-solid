"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuponsController = void 0;
const cupons_service_1 = require("../services/cupons.service");
class CuponsController {
    async criar(request, response) {
        try {
            const cupom = await cupons_service_1.cuponsService.criar(request.body);
            return response.status(201).json(cupom);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro interno ao criar cupom.";
            const status = message.includes("Já existe") ? 409 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const cupons = await cupons_service_1.cuponsService.listar();
            return response.status(200).json(cupons);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar cupons.",
            });
        }
    }
    async buscarPorCodigo(request, response) {
        try {
            const codigo = String(request.params.codigo);
            const cupom = await cupons_service_1.cuponsService.buscarPorCodigo({
                codigo,
            });
            return response.status(200).json(cupom);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar cupom pelo código.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const cupom = await cupons_service_1.cuponsService.buscarPorId({
                id,
            });
            return response.status(200).json(cupom);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar cupom.",
            });
        }
    }
    async aplicar(request, response) {
        try {
            const { codigo, subtotal, frete = 0 } = request.body;
            const resultado = await cupons_service_1.cuponsService.aplicar({
                codigo,
                subtotal,
                frete,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao aplicar cupom.";
            const status = message === "Cupom não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async atualizar(request, response) {
        try {
            const id = String(request.params.id);
            const cupom = await cupons_service_1.cuponsService.atualizar({
                id,
                ...request.body,
            });
            return response.status(200).json(cupom);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar cupom.";
            const status = message === "Cupom não encontrado."
                ? 404
                : message.includes("Já existe")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async ativar(request, response) {
        try {
            const id = String(request.params.id);
            const cupom = await cupons_service_1.cuponsService.ativar({
                id,
            });
            return response.status(200).json(cupom);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : "Erro interno ao ativar cupom.";
            const status = message === "Cupom não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async desativar(request, response) {
        try {
            const id = String(request.params.id);
            const cupom = await cupons_service_1.cuponsService.desativar({
                id,
            });
            return response.status(200).json(cupom);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao desativar cupom.";
            const status = message === "Cupom não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async remover(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await cupons_service_1.cuponsService.remover({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao remover cupom.",
            });
        }
    }
}
exports.cuponsController = new CuponsController();
