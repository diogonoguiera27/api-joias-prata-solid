import { Request, Response } from "express";
import { produtosService } from "../services/produtos.service";

class ProdutosController {
  async criar(request: Request, response: Response) {
    try {
      const produto = await produtosService.criar(request.body);

      return response.status(201).json(produto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao criar produto.";
      const status =
        message === "Categoria não encontrada."
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
      const produtos = await produtosService.listar();

      return response.status(200).json(produtos);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar produtos.",
      });
    }
  }

  async buscarPorSlug(request: Request, response: Response) {
    try {
      const slug = String(request.params.slug);

      const produto = await produtosService.buscarPorSlug({
        slug,
      });

      return response.status(200).json(produto);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar produto pelo slug.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const produto = await produtosService.buscarPorId({
        id,
      });

      return response.status(200).json(produto);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar produto.",
      });
    }
  }

  async atualizar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const produto = await produtosService.atualizar({
        id,
        ...request.body,
      });

      return response.status(200).json(produto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar produto.";
      const status =
        message === "Produto não encontrado." ||
        message === "Categoria não encontrada."
          ? 404
          : message.includes("Já existe")
            ? 409
            : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async desativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const produto = await produtosService.desativar({
        id,
      });

      return response.status(200).json(produto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao desativar produto.";
      const status = message === "Produto não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async ativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const produto = await produtosService.ativar({
        id,
      });

      return response.status(200).json(produto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao ativar produto.";
      const status = message === "Produto não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async remover(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await produtosService.remover({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao remover produto.",
      });
    }
  }
}

export const produtosController = new ProdutosController();
