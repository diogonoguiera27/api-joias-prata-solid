import { Request, Response } from "express";
import { cuponsService } from "../services/cupons.service";

class CuponsController {
  async criar(request: Request, response: Response) {
    try {
      const cupom = await cuponsService.criar(request.body);

      return response.status(201).json(cupom);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro interno ao criar cupom.";
      const status = message.includes("Já existe") ? 409 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const cupons = await cuponsService.listar();

      return response.status(200).json(cupons);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar cupons.",
      });
    }
  }

  async buscarPorCodigo(request: Request, response: Response) {
    try {
      const codigo = String(request.params.codigo);

      const cupom = await cuponsService.buscarPorCodigo({
        codigo,
      });

      return response.status(200).json(cupom);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar cupom pelo código.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const cupom = await cuponsService.buscarPorId({
        id,
      });

      return response.status(200).json(cupom);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar cupom.",
      });
    }
  }

  async aplicar(request: Request, response: Response) {
    try {
      const { codigo, subtotal, frete = 0 } = request.body;

      const resultado = await cuponsService.aplicar({
        codigo,
        subtotal,
        frete,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao aplicar cupom.";
      const status = message === "Cupom não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async atualizar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const cupom = await cuponsService.atualizar({
        id,
        ...request.body,
      });

      return response.status(200).json(cupom);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar cupom.";
      const status =
        message === "Cupom não encontrado."
          ? 404
          : message.includes("Já existe")
            ? 409
            : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async ativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const cupom = await cuponsService.ativar({
        id,
      });

      return response.status(200).json(cupom);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro interno ao ativar cupom.";
      const status = message === "Cupom não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async desativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const cupom = await cuponsService.desativar({
        id,
      });

      return response.status(200).json(cupom);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao desativar cupom.";
      const status = message === "Cupom não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async remover(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await cuponsService.remover({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao remover cupom.",
      });
    }
  }
}

export const cuponsController = new CuponsController();
