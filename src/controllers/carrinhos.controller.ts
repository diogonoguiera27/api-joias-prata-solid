import { Request, Response } from "express";
import { carrinhosService } from "../services/carrinhos.service";

class CarrinhosController {
  async criar(request: Request, response: Response) {
    try {
      const { clienteId } = request.body;

      const carrinho = await carrinhosService.criar({
        clienteId: clienteId ? String(clienteId) : null,
      });

      return response.status(201).json(carrinho);
    } catch (error) {
      return response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao criar carrinho.",
      });
    }
  }

  async listar(request: Request, response: Response) {
    try {
      const carrinhos = await carrinhosService.listar();

      return response.status(200).json(carrinhos);
    } catch (error) {
      return response.status(500).json({
        message: "Erro interno ao listar carrinhos.",
      });
    }
  }

  async buscarPorId(request: Request, response: Response) {
    try {
      const id = String(request.params.id);

      const carrinho = await carrinhosService.buscarPorId(id);

      return response.status(200).json(carrinho);
    } catch (error) {
      return response.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar carrinho.",
      });
    }
  }

  async adicionarItem(request: Request, response: Response) {
    try {
      const carrinhoId = String(request.params.id);
      const { produtoId, variacaoId, quantidade } = request.body;

      const item = await carrinhosService.adicionarItem({
        carrinhoId,
        produtoId: String(produtoId),
        variacaoId: String(variacaoId),
        quantidade,
      });

      return response.status(201).json(item);
    } catch (error) {
      return response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao adicionar item ao carrinho.",
      });
    }
  }

  async atualizarQuantidadeItem(request: Request, response: Response) {
    try {
      const carrinhoId = String(request.params.id);
      const itemId = String(request.params.itemId);
      const { quantidade } = request.body;

      const itemAtualizado = await carrinhosService.atualizarQuantidadeItem({
        carrinhoId,
        itemId,
        quantidade,
      });

      return response.status(200).json(itemAtualizado);
    } catch (error) {
      return response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao atualizar item do carrinho.",
      });
    }
  }

  async removerItem(request: Request, response: Response) {
  try {
    const carrinhoId = String(request.params.id);
    const itemId = String(request.params.itemId);

    const resultado = await carrinhosService.removerItem({
      carrinhoId,
      itemId,
    });

    return response.status(200).json(resultado);
  } catch (error) {
    return response.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao remover item do carrinho.",
    });
  }
}

async limpar(request: Request, response: Response) {
  try {
    const carrinhoId = String(request.params.id);

    const resultado = await carrinhosService.limpar({
      carrinhoId,
    });

    return response.status(200).json(resultado);
  } catch (error) {
    return response.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro interno ao limpar carrinho.",
    });
  }
}

async abandonar(request: Request, response: Response) {
    try {
      const carrinhoId = String(request.params.id);

      const carrinho = await carrinhosService.abandonar({
        carrinhoId,
      });

      return response.status(200).json(carrinho);
    } catch (error) {
      return response.status(400).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro interno ao abandonar carrinho.",
      });
    }
  }
}

export const carrinhosController = new CarrinhosController();
