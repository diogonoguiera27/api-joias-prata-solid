import { Request, Response } from "express";
import { movimentacoesEstoqueService } from "../services/movimentacoes-estoque.service";

class MovimentacoesEstoqueController {
  async criar(request: Request, response: Response) {
    try {
      const { variacaoId, tipo, quantidade, motivo } = request.body;

      const resultado = await movimentacoesEstoqueService.criar({
        variacaoId,
        tipo,
        quantidade,
        motivo,
      });

      return response.status(201).json(resultado);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao criar movimentação de estoque.";
      const status =
        message === "Variação de produto não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const movimentacoes = await movimentacoesEstoqueService.listar();

      return response.status(200).json(movimentacoes);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar movimentações de estoque.",
      });
    }
  }

  async listarPorVariacao(request: Request, response: Response) {
    try {
      const variacaoId = String(request.params.variacaoId);

      const movimentacoes =
        await movimentacoesEstoqueService.listarPorVariacao({
          variacaoId,
        });

      return response.status(200).json(movimentacoes);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao listar movimentações da variação.";
      const status =
        message === "Variação de produto não encontrada." ? 404 : 500;

      return response.status(status).json({
        message,
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const movimentacao = await movimentacoesEstoqueService.buscarPorId({
        id,
      });

      return response.status(200).json(movimentacao);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar movimentação de estoque.",
      });
    }
  }
}

export const movimentacoesEstoqueController =
  new MovimentacoesEstoqueController();
