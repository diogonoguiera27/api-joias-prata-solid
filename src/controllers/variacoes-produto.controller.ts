import { Request, Response } from "express";
import { variacoesProdutoService } from "../services/variacoes-produto.service";

class VariacoesProdutoController {
  async criar(request: Request, response: Response) {
    try {
      const variacao = await variacoesProdutoService.criar(request.body);

      return response.status(201).json(variacao);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao criar variação de produto.";
      const status =
        message === "Produto não encontrado."
          ? 404
          : message.includes("Já existe")
            ? 409
            : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const variacoes = await variacoesProdutoService.listar();

      return response.status(200).json(variacoes);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar variações de produto.",
      });
    }
  }

  async listarPorProduto(request: Request, response: Response) {
    try {
      const produtoId = String(request.params.produtoId);

      const variacoes = await variacoesProdutoService.listarPorProduto({
        produtoId,
      });

      return response.status(200).json(variacoes);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao listar variações do produto.";
      const status = message === "Produto não encontrado." ? 404 : 500;

      return response.status(status).json({
        message,
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const variacao = await variacoesProdutoService.buscarPorId({
        id,
      });

      return response.status(200).json(variacao);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar variação de produto.",
      });
    }
  }

  async atualizar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const variacao = await variacoesProdutoService.atualizar({
        id,
        ...request.body,
      });

      return response.status(200).json(variacao);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar variação de produto.";
      const status =
        message === "Variação de produto não encontrada." ||
        message === "Produto não encontrado."
          ? 404
          : message.includes("Já existe")
            ? 409
            : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async atualizarEstoque(request: Request, response: Response) {
    try {
      const id = String(request.params.id);
      const { estoque, motivo } = request.body;

      const variacao = await variacoesProdutoService.atualizarEstoque({
        id,
        estoque,
        motivo,
      });

      return response.status(200).json(variacao);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar estoque da variação.";
      const status =
        message === "Variação de produto não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async desativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const variacao = await variacoesProdutoService.desativar({
        id,
      });

      return response.status(200).json(variacao);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao desativar variação.";
      const status =
        message === "Variação de produto não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async ativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const variacao = await variacoesProdutoService.ativar({
        id,
      });

      return response.status(200).json(variacao);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao ativar variação.";
      const status =
        message === "Variação de produto não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async remover(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await variacoesProdutoService.remover({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao remover variação.",
      });
    }
  }
}

export const variacoesProdutoController = new VariacoesProdutoController();
