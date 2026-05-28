import { Request, Response } from "express";
import { pedidosService } from "../services/pedidos.service";

class PedidosController {
  async criar(request: Request, response: Response) {
    try {
      const { carrinhoId, clienteId } = request.body;

      const resultado = await pedidosService.criar({
        carrinhoId,
        clienteId,
      });

      return response.status(201).json(resultado);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro interno ao criar pedido.";
      const status =
        message === "Carrinho não encontrado." ||
        message === "Cliente informado não encontrado."
          ? 404
          : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const pedidos = await pedidosService.listar();

      return response.status(200).json(pedidos);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar pedidos.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const pedido = await pedidosService.buscarPorId({
        id,
      });

      return response.status(200).json(pedido);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar pedido.",
      });
    }
  }

  async atualizarStatus(request: Request, response: Response) {
    try {
      const id = String(request.params.id);
      const { status } = request.body;

      const pedido = await pedidosService.atualizarStatus({
        id,
        status,
      });

      return response.status(200).json(pedido);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar status do pedido.";
      const status = message === "Pedido não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async cancelar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const pedido = await pedidosService.cancelar({
        id,
      });

      return response.status(200).json(pedido);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao cancelar pedido.";
      const status = message === "Pedido não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }
}

export const pedidosController = new PedidosController();
