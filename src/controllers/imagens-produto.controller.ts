import { Request, Response } from "express";
import { imagensProdutoService } from "../services/imagens-produto.service";

class ImagensProdutoController {
  async criar(request: Request, response: Response) {
    try {
      const { produtoId, url, textoAlt, principal = false } = request.body;

      const imagem = await imagensProdutoService.criar({
        produtoId,
        url,
        textoAlt,
        principal,
      });

      return response.status(201).json(imagem);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao adicionar imagem ao produto.";
      const status = message === "Produto não encontrado." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const imagens = await imagensProdutoService.listar();

      return response.status(200).json(imagens);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar imagens.",
      });
    }
  }

  async listarPorProduto(request: Request, response: Response) {
    try {
      const produtoId = String(request.params.produtoId);

      const imagens = await imagensProdutoService.listarPorProduto({
        produtoId,
      });

      return response.status(200).json(imagens);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao listar imagens do produto.";
      const status = message === "Produto não encontrado." ? 404 : 500;

      return response.status(status).json({
        message,
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const imagem = await imagensProdutoService.buscarPorId({
        id,
      });

      return response.status(200).json(imagem);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar imagem.",
      });
    }
  }

  async atualizar(request: Request, response: Response) {
    try {
      const id = String(request.params.id);
      const { url, textoAlt, principal } = request.body;

      const imagem = await imagensProdutoService.atualizar({
        id,
        url,
        textoAlt,
        principal,
      });

      return response.status(200).json(imagem);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro interno ao atualizar imagem.";
      const status = message === "Imagem não encontrada." ? 404 : 400;

      return response.status(status).json({
        message,
      });
    }
  }

  async definirPrincipal(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const imagem = await imagensProdutoService.definirPrincipal({
        id,
      });

      return response.status(200).json(imagem);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao definir imagem principal.",
      });
    }
  }

  async remover(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const resultado = await imagensProdutoService.remover({
        id,
      });

      return response.status(200).json(resultado);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao remover imagem.",
      });
    }
  }
}

export const imagensProdutoController = new ImagensProdutoController();
