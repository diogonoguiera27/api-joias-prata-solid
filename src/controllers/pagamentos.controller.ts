import { Request, Response } from "express";
import { pagamentosService } from "../services/pagamentos.service";

class PagamentosController {
  async criar(request: Request, response: Response) {
    try {
      const { pedidoId, metodo } = request.body;

      const pagamento = await pagamentosService.criar({
        pedidoId,
        metodo,
      });

      return response.status(201).json(pagamento);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao criar pagamento.";
      const status =
        message === "Pedido não encontrado."
          ? 404
          : message.includes("já possui")
            ? 409
            : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const pagamentos = await pagamentosService.listar();

      return response.status(200).json(pagamentos);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar pagamentos.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const pagamento = await pagamentosService.buscarPorId({
        id,
      });

      return response.status(200).json(pagamento);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar pagamento.",
      });
    }
  }

  async aprovar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await pagamentosService.aprovar({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao aprovar pagamento.";
      const status = message === "Pagamento não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async recusar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const pagamento = await pagamentosService.recusar({
        id,
      });

      return response.status(200).json(pagamento);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao recusar pagamento.";
      const status = message === "Pagamento não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async cancelar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const pagamento = await pagamentosService.cancelar({
        id,
      });

      return response.status(200).json(pagamento);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao cancelar pagamento.";
      const status = message === "Pagamento não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async reembolsar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await pagamentosService.reembolsar({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao reembolsar pagamento.";
      const status = message === "Pagamento não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }
}

export const pagamentosController = new PagamentosController();
