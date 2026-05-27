import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";

const movimentacoesEstoqueRouter = Router();

function calcularNovoEstoque(
  estoqueAtual: number,
  tipo: TipoMovimentacaoEstoque,
  quantidade: number
) {
  if (tipo === "ENTRADA") {
    return estoqueAtual + quantidade;
  }

  if (tipo === "DEVOLUCAO_CANCELAMENTO") {
    return estoqueAtual + quantidade;
  }

  if (tipo === "SAIDA") {
    return estoqueAtual - quantidade;
  }

  if (tipo === "VENDA") {
    return estoqueAtual - quantidade;
  }

  if (tipo === "AJUSTE") {
    return quantidade;
  }

  return estoqueAtual;
}

function validarTipoMovimentacao(tipo: string) {
  const tiposPermitidos = [
    "ENTRADA",
    "SAIDA",
    "AJUSTE",
    "VENDA",
    "DEVOLUCAO_CANCELAMENTO",
  ];

  return tiposPermitidos.includes(tipo);
}

// CREATE - Criar movimentação de estoque
movimentacoesEstoqueRouter.post(
  "/",
  async (request: Request, response: Response) => {
    try {
      const { variacaoId, tipo, quantidade, motivo } = request.body;

      if (!variacaoId) {
        return response.status(400).json({
          message: "A variação do produto é obrigatória.",
        });
      }

      const variacao = await prisma.variacaoProduto.findUnique({
        where: {
          id: String(variacaoId),
        },
      });

      if (!variacao) {
        return response.status(404).json({
          message: "Variação de produto não encontrada.",
        });
      }

      if (!variacao.ativo) {
        return response.status(400).json({
          message: "Não é possível movimentar estoque de uma variação inativa.",
        });
      }

      if (!tipo) {
        return response.status(400).json({
          message: "O tipo da movimentação é obrigatório.",
        });
      }

      const tipoFormatado = String(tipo).toUpperCase();

      if (!validarTipoMovimentacao(tipoFormatado)) {
        return response.status(400).json({
          message:
            "Tipo de movimentação inválido. Use ENTRADA, SAIDA, AJUSTE, VENDA ou DEVOLUCAO_CANCELAMENTO.",
        });
      }

      if (quantidade === undefined || quantidade === null) {
        return response.status(400).json({
          message: "A quantidade é obrigatória.",
        });
      }

      const quantidadeNumber = Number(quantidade);

      if (Number.isNaN(quantidadeNumber)) {
        return response.status(400).json({
          message: "A quantidade deve ser um número válido.",
        });
      }

      if (!Number.isInteger(quantidadeNumber)) {
        return response.status(400).json({
          message: "A quantidade deve ser um número inteiro.",
        });
      }

      if (quantidadeNumber <= 0) {
        return response.status(400).json({
          message: "A quantidade deve ser maior que zero.",
        });
      }

      const novoEstoque = calcularNovoEstoque(
        variacao.estoque,
        tipoFormatado as TipoMovimentacaoEstoque,
        quantidadeNumber
      );

      if (novoEstoque < 0) {
        return response.status(400).json({
          message: "A movimentação deixaria o estoque negativo.",
        });
      }

      const resultado = await prisma.$transaction(async (tx) => {
        const movimentacao = await tx.movimentacaoEstoque.create({
          data: {
            variacaoId: String(variacaoId),
            tipo: tipoFormatado as TipoMovimentacaoEstoque,
            quantidade: quantidadeNumber,
            motivo,
          },
        });

        const variacaoAtualizada = await tx.variacaoProduto.update({
          where: {
            id: String(variacaoId),
          },
          data: {
            estoque: novoEstoque,
          },
          include: {
            produto: true,
            movimentacoesEstoque: true,
          },
        });

        return {
          movimentacao,
          variacao: variacaoAtualizada,
        };
      });

      return response.status(201).json(resultado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao criar movimentação de estoque.",
      });
    }
  }
);

// READ - Listar todas as movimentações
movimentacoesEstoqueRouter.get(
  "/",
  async (request: Request, response: Response) => {
    try {
      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        include: {
          variacao: {
            include: {
              produto: true,
            },
          },
        },
        orderBy: {
          criadoEm: "desc",
        },
      });

      return response.status(200).json(movimentacoes);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao listar movimentações de estoque.",
      });
    }
  }
);

// READ - Listar movimentações por variação
// Precisa vir antes de "/:id"
movimentacoesEstoqueRouter.get(
  "/variacao/:variacaoId",
  async (request: Request, response: Response) => {
    try {
      const variacaoId = String(request.params.variacaoId);

      const variacao = await prisma.variacaoProduto.findUnique({
        where: {
          id: variacaoId,
        },
      });

      if (!variacao) {
        return response.status(404).json({
          message: "Variação de produto não encontrada.",
        });
      }

      const movimentacoes = await prisma.movimentacaoEstoque.findMany({
        where: {
          variacaoId,
        },
        include: {
          variacao: {
            include: {
              produto: true,
            },
          },
        },
        orderBy: {
          criadoEm: "desc",
        },
      });

      return response.status(200).json(movimentacoes);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao listar movimentações da variação.",
      });
    }
  }
);

// READ - Buscar movimentação pelo ID
movimentacoesEstoqueRouter.get(
  "/:id",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const movimentacao = await prisma.movimentacaoEstoque.findUnique({
        where: {
          id,
        },
        include: {
          variacao: {
            include: {
              produto: true,
            },
          },
        },
      });

      if (!movimentacao) {
        return response.status(404).json({
          message: "Movimentação de estoque não encontrada.",
        });
      }

      return response.status(200).json(movimentacao);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao buscar movimentação de estoque.",
      });
    }
  }
);

export { movimentacoesEstoqueRouter };