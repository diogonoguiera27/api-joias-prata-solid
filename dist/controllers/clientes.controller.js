"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesController = void 0;
const clientes_service_1 = require("../services/clientes.service");
class ClientesController {
    async criar(request, response) {
        try {
            const { nome, email, telefone, documento } = request.body;
            const cliente = await clientes_service_1.clientesService.criar({
                nome,
                email,
                telefone,
                documento,
            });
            return response.status(201).json(cliente);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao criar cliente.";
            const status = message.includes("Já existe") ? 409 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async listar(request, response) {
        try {
            const clientes = await clientes_service_1.clientesService.listar();
            return response.status(200).json(clientes);
        }
        catch (error) {
            return response.status(500).json({
                message: "Erro interno ao listar clientes.",
            });
        }
    }
    async buscarPorId(request, response) {
        try {
            const id = String(request.params.id);
            const cliente = await clientes_service_1.clientesService.buscarPorId({
                id,
            });
            return response.status(200).json(cliente);
        }
        catch (error) {
            return response.status(404).json({
                message: error instanceof Error
                    ? error.message
                    : "Erro interno ao buscar cliente.",
            });
        }
    }
    async atualizar(request, response) {
        try {
            const id = String(request.params.id);
            const { nome, email, telefone, documento } = request.body;
            const cliente = await clientes_service_1.clientesService.atualizar({
                id,
                nome,
                email,
                telefone,
                documento,
            });
            return response.status(200).json(cliente);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao atualizar cliente.";
            const status = message === "Cliente não encontrado."
                ? 404
                : message.includes("Já existe")
                    ? 409
                    : 400;
            return response.status(status).json({
                message,
            });
        }
    }
    async remover(request, response) {
        try {
            const id = String(request.params.id);
            const resultado = await clientes_service_1.clientesService.remover({
                id,
            });
            return response.status(200).json(resultado);
        }
        catch (error) {
            const message = error instanceof Error
                ? error.message
                : "Erro interno ao remover cliente.";
            const status = message === "Cliente não encontrado." ? 404 : 400;
            return response.status(status).json({
                message,
            });
        }
    }
}
exports.clientesController = new ClientesController();
