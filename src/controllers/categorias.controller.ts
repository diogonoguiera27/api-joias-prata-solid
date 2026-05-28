import { Request, Response } from "express";
import { categoriasService } from "../services/categorias.service";

class CategoriasController {
  async criar(request: Request, response: Response) {
    try {
      const { nome, descricao } = request.body;

      const categoria = await categoriasService.criar({
        nome,
        descricao,
      });

      return response.status(201).json(categoria);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao criar categoria.";
      const status = message.includes("Já existe") ? 409 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const categorias = await categoriasService.listar();

      return response.status(200).json(categorias);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar categorias.",
      });
    }
  }

  async buscarPorSlug(request: Request, response: Response) {
    try {
      const slug = String(request.params.slug);

      const categoria = await categoriasService.buscarPorSlug({
        slug,
      });

      return response.status(200).json(categoria);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar categoria pelo slug.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const categoria = await categoriasService.buscarPorId({
        id,
      });

      return response.status(200).json(categoria);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar categoria.",
      });
    }
  }

  async atualizar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);
      const { nome, descricao } = request.body;

      const categoria = await categoriasService.atualizar({
        id,
        nome,
        descricao,
      });

      return response.status(200).json(categoria);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar categoria.";
      const status = message === "Categoria não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async desativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const categoria = await categoriasService.desativar({
        id,
      });

      return response.status(200).json(categoria);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao desativar categoria.";
      const status = message === "Categoria não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async ativar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const categoria = await categoriasService.ativar({
        id,
      });

      return response.status(200).json(categoria);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao ativar categoria.";
      const status = message === "Categoria não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async remover(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await categoriasService.remover({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao remover categoria.",
      });
    }
  }
}

export const categoriasController = new CategoriasController();
