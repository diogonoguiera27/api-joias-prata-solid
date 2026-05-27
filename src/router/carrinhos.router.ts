import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const carrinhosRouter = Router();

function calcularSubtotalItem(
  precoFinalProduto: unknown,
  precoAdicionalVariacao: unknown,
  quantidade: number
) {
  const precoProduto = Number(precoFinalProduto);
  const precoAdicional = Number(precoAdicionalVariacao);
  const precoUnitario = precoProduto + precoAdicional;
  const subtotal = precoUnitario * quantidade;

  return {
    precoUnitario: Number(precoUnitario.toFixed(2)),
    subtotal: Number(subtotal.toFixed(2)),
  };
}

// CREATE - Criar carrinho
carrinhosRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { clienteId } = request.body;

    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          id: String(clienteId),
        },
      });

      if (!cliente) {
        return response.status(404).json({
          message: "Cliente não encontrado.",
        });
      }
    }

    const carrinho = await prisma.carrinho.create({
      data: {
        clienteId: clienteId ? String(clienteId) : null,
        status: "ATIVO",
      },
      include: {
        cliente: true,
        itens: true,
      },
    });

    return response.status(201).json(carrinho);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar carrinho.",
    });
  }
});

// READ - Listar carrinhos
carrinhosRouter.get("/", async (request: Request, response: Response) => {
  try {
    const carrinhos = await prisma.carrinho.findMany({
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(carrinhos);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar carrinhos.",
    });
  }
});

// READ - Buscar carrinho por ID
carrinhosRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const carrinho = await prisma.carrinho.findUnique({
      where: {
        id,
      },
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
      },
    });

    if (!carrinho) {
      return response.status(404).json({
        message: "Carrinho não encontrado.",
      });
    }

    return response.status(200).json(carrinho);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar carrinho.",
    });
  }
});

// CREATE - Adicionar item ao carrinho
carrinhosRouter.post(
  "/:id/itens",
  async (request: Request, response: Response) => {
    try {
      const carrinhoId = String(request.params.id);
      const { produtoId, variacaoId, quantidade } = request.body;

      const carrinho = await prisma.carrinho.findUnique({
        where: {
          id: carrinhoId,
        },
      });

      if (!carrinho) {
        return response.status(404).json({
          message: "Carrinho não encontrado.",
        });
      }

      if (carrinho.status !== "ATIVO") {
        return response.status(400).json({
          message: "Não é possível alterar um carrinho que não está ativo.",
        });
      }

      if (!produtoId) {
        return response.status(400).json({
          message: "O produto é obrigatório.",
        });
      }

      if (!variacaoId) {
        return response.status(400).json({
          message: "A variação do produto é obrigatória.",
        });
      }

      if (!quantidade) {
        return response.status(400).json({
          message: "A quantidade é obrigatória.",
        });
      }

      const quantidadeNumber = Number(quantidade);

      if (Number.isNaN(quantidadeNumber) || !Number.isInteger(quantidadeNumber)) {
        return response.status(400).json({
          message: "A quantidade deve ser um número inteiro.",
        });
      }

      if (quantidadeNumber < 1) {
        return response.status(400).json({
          message: "A quantidade deve ser maior ou igual a 1.",
        });
      }

      const produto = await prisma.produto.findUnique({
        where: {
          id: String(produtoId),
        },
      });

      if (!produto) {
        return response.status(404).json({
          message: "Produto não encontrado.",
        });
      }

      if (!produto.ativo) {
        return response.status(400).json({
          message: "Produto inativo não pode ser adicionado ao carrinho.",
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
          message: "Variação inativa não pode ser adicionada ao carrinho.",
        });
      }

      if (variacao.produtoId !== produto.id) {
        return response.status(400).json({
          message: "A variação informada não pertence ao produto informado.",
        });
      }

      const itemExistente = await prisma.itemCarrinho.findFirst({
        where: {
          carrinhoId,
          produtoId: String(produtoId),
          variacaoId: String(variacaoId),
        },
      });

      const quantidadeFinal = itemExistente
        ? itemExistente.quantidade + quantidadeNumber
        : quantidadeNumber;

      if (quantidadeFinal > variacao.estoque) {
        return response.status(400).json({
          message: "Quantidade solicitada maior que o estoque disponível.",
        });
      }

      const { precoUnitario, subtotal } = calcularSubtotalItem(
        produto.precoFinal,
        variacao.precoAdicional,
        quantidadeFinal
      );

      if (itemExistente) {
        const itemAtualizado = await prisma.itemCarrinho.update({
          where: {
            id: itemExistente.id,
          },
          data: {
            quantidade: quantidadeFinal,
            precoUnitario,
            subtotal,
          },
          include: {
            produto: true,
            variacao: true,
          },
        });

        return response.status(200).json(itemAtualizado);
      }

      const item = await prisma.itemCarrinho.create({
        data: {
          carrinhoId,
          produtoId: String(produtoId),
          variacaoId: String(variacaoId),
          quantidade: quantidadeNumber,
          precoUnitario,
          subtotal,
        },
        include: {
          produto: true,
          variacao: true,
        },
      });

      return response.status(201).json(item);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao adicionar item ao carrinho.",
      });
    }
  }
);

// UPDATE - Atualizar quantidade do item
carrinhosRouter.patch(
  "/:id/itens/:itemId",
  async (request: Request, response: Response) => {
    try {
      const carrinhoId = String(request.params.id);
      const itemId = String(request.params.itemId);
      const { quantidade } = request.body;

      const carrinho = await prisma.carrinho.findUnique({
        where: {
          id: carrinhoId,
        },
      });

      if (!carrinho) {
        return response.status(404).json({
          message: "Carrinho não encontrado.",
        });
      }

      if (carrinho.status !== "ATIVO") {
        return response.status(400).json({
          message: "Não é possível alterar um carrinho que não está ativo.",
        });
      }

      const item = await prisma.itemCarrinho.findUnique({
        where: {
          id: itemId,
        },
        include: {
          produto: true,
          variacao: true,
        },
      });

      if (!item || item.carrinhoId !== carrinhoId) {
        return response.status(404).json({
          message: "Item do carrinho não encontrado.",
        });
      }

      const quantidadeNumber = Number(quantidade);

      if (Number.isNaN(quantidadeNumber) || !Number.isInteger(quantidadeNumber)) {
        return response.status(400).json({
          message: "A quantidade deve ser um número inteiro.",
        });
      }

      if (quantidadeNumber < 1) {
        return response.status(400).json({
          message: "A quantidade deve ser maior ou igual a 1.",
        });
      }

      if (quantidadeNumber > item.variacao.estoque) {
        return response.status(400).json({
          message: "Quantidade solicitada maior que o estoque disponível.",
        });
      }

      const { precoUnitario, subtotal } = calcularSubtotalItem(
        item.produto.precoFinal,
        item.variacao.precoAdicional,
        quantidadeNumber
      );

      const itemAtualizado = await prisma.itemCarrinho.update({
        where: {
          id: itemId,
        },
        data: {
          quantidade: quantidadeNumber,
          precoUnitario,
          subtotal,
        },
        include: {
          produto: true,
          variacao: true,
        },
      });

      return response.status(200).json(itemAtualizado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao atualizar item do carrinho.",
      });
    }
  }
);

// DELETE - Remover item do carrinho
carrinhosRouter.delete(
  "/:id/itens/:itemId",
  async (request: Request, response: Response) => {
    try {
      const carrinhoId = String(request.params.id);
      const itemId = String(request.params.itemId);

      const carrinho = await prisma.carrinho.findUnique({
        where: {
          id: carrinhoId,
        },
      });

      if (!carrinho) {
        return response.status(404).json({
          message: "Carrinho não encontrado.",
        });
      }

      if (carrinho.status !== "ATIVO") {
        return response.status(400).json({
          message: "Não é possível alterar um carrinho que não está ativo.",
        });
      }

      const item = await prisma.itemCarrinho.findUnique({
        where: {
          id: itemId,
        },
      });

      if (!item || item.carrinhoId !== carrinhoId) {
        return response.status(404).json({
          message: "Item do carrinho não encontrado.",
        });
      }

      await prisma.itemCarrinho.delete({
        where: {
          id: itemId,
        },
      });

      return response.status(200).json({
        message: "Item removido do carrinho com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao remover item do carrinho.",
      });
    }
  }
);

// DELETE - Limpar carrinho
carrinhosRouter.delete(
  "/:id/limpar",
  async (request: Request, response: Response) => {
    try {
      const carrinhoId = String(request.params.id);

      const carrinho = await prisma.carrinho.findUnique({
        where: {
          id: carrinhoId,
        },
      });

      if (!carrinho) {
        return response.status(404).json({
          message: "Carrinho não encontrado.",
        });
      }

      if (carrinho.status !== "ATIVO") {
        return response.status(400).json({
          message: "Não é possível limpar um carrinho que não está ativo.",
        });
      }

      await prisma.itemCarrinho.deleteMany({
        where: {
          carrinhoId,
        },
      });

      return response.status(200).json({
        message: "Carrinho limpo com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao limpar carrinho.",
      });
    }
  }
);

// PATCH - Abandonar carrinho
carrinhosRouter.patch(
  "/:id/abandonar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const carrinho = await prisma.carrinho.findUnique({
        where: {
          id,
        },
      });

      if (!carrinho) {
        return response.status(404).json({
          message: "Carrinho não encontrado.",
        });
      }

      if (carrinho.status !== "ATIVO") {
        return response.status(400).json({
          message: "Somente carrinho ativo pode ser abandonado.",
        });
      }

      const carrinhoAtualizado = await prisma.carrinho.update({
        where: {
          id,
        },
        data: {
          status: "ABANDONADO",
        },
      });

      return response.status(200).json(carrinhoAtualizado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao abandonar carrinho.",
      });
    }
  }
);

export { carrinhosRouter };