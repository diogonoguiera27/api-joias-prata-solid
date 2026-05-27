import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const variacoesProdutoRouter = Router();

// CREATE - Criar variação de produto
variacoesProdutoRouter.post("/", async (request: Request, response: Response) => {
  try {
    const {
      produtoId,
      nome,
      sku,
      tamanho,
      cor,
      precoAdicional = 0,
      estoque = 0,
    } = request.body;

    if (!produtoId) {
      return response.status(400).json({
        message: "O produto é obrigatório.",
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
        message: "Não é possível criar variação para um produto inativo.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        message: "O nome da variação é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome da variação deve ser um texto.",
      });
    }

    if (nome.trim().length < 2) {
      return response.status(400).json({
        message: "O nome da variação deve ter pelo menos 2 caracteres.",
      });
    }

    if (!sku) {
      return response.status(400).json({
        message: "O SKU da variação é obrigatório.",
      });
    }

    if (typeof sku !== "string") {
      return response.status(400).json({
        message: "O SKU deve ser um texto.",
      });
    }

    const skuFormatado = sku.trim().toUpperCase();

    const variacaoComMesmoSku = await prisma.variacaoProduto.findUnique({
      where: {
        sku: skuFormatado,
      },
    });

    if (variacaoComMesmoSku) {
      return response.status(409).json({
        message: "Já existe uma variação com esse SKU.",
      });
    }

    const precoAdicionalNumber = Number(precoAdicional);

    if (Number.isNaN(precoAdicionalNumber)) {
      return response.status(400).json({
        message: "O preço adicional deve ser um número válido.",
      });
    }

    if (precoAdicionalNumber < 0) {
      return response.status(400).json({
        message: "O preço adicional não pode ser negativo.",
      });
    }

    const estoqueNumber = Number(estoque);

    if (Number.isNaN(estoqueNumber)) {
      return response.status(400).json({
        message: "O estoque deve ser um número válido.",
      });
    }

    if (!Number.isInteger(estoqueNumber)) {
      return response.status(400).json({
        message: "O estoque deve ser um número inteiro.",
      });
    }

    if (estoqueNumber < 0) {
      return response.status(400).json({
        message: "O estoque não pode ser negativo.",
      });
    }

    const variacao = await prisma.variacaoProduto.create({
      data: {
        produtoId: String(produtoId),
        nome: nome.trim(),
        sku: skuFormatado,
        tamanho,
        cor,
        precoAdicional: precoAdicionalNumber,
        estoque: estoqueNumber,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });

    if (estoqueNumber > 0) {
      await prisma.movimentacaoEstoque.create({
        data: {
          variacaoId: variacao.id,
          tipo: "ENTRADA",
          quantidade: estoqueNumber,
          motivo: "Estoque inicial da variação.",
        },
      });
    }

    return response.status(201).json(variacao);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar variação de produto.",
    });
  }
});

// READ - Listar todas as variações ativas
variacoesProdutoRouter.get("/", async (request: Request, response: Response) => {
  try {
    const variacoes = await prisma.variacaoProduto.findMany({
      where: {
        ativo: true,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(variacoes);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar variações de produto.",
    });
  }
});

// READ - Listar variações de um produto
// Precisa vir antes de "/:id"
variacoesProdutoRouter.get(
  "/produto/:produtoId",
  async (request: Request, response: Response) => {
    try {
      const produtoId = String(request.params.produtoId);

      const produto = await prisma.produto.findUnique({
        where: {
          id: produtoId,
        },
      });

      if (!produto) {
        return response.status(404).json({
          message: "Produto não encontrado.",
        });
      }

      const variacoes = await prisma.variacaoProduto.findMany({
        where: {
          produtoId,
          ativo: true,
        },
        include: {
          produto: true,
          movimentacoesEstoque: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      });

      return response.status(200).json(variacoes);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao listar variações do produto.",
      });
    }
  }
);

// READ - Buscar variação pelo ID
variacoesProdutoRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const variacao = await prisma.variacaoProduto.findUnique({
      where: {
        id,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });

    if (!variacao) {
      return response.status(404).json({
        message: "Variação de produto não encontrada.",
      });
    }

    return response.status(200).json(variacao);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar variação de produto.",
    });
  }
});

// UPDATE - Atualizar variação de produto
variacoesProdutoRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const {
      produtoId,
      nome,
      sku,
      tamanho,
      cor,
      precoAdicional = 0,
      estoque = 0,
    } = request.body;

    const variacao = await prisma.variacaoProduto.findUnique({
      where: {
        id,
      },
    });

    if (!variacao) {
      return response.status(404).json({
        message: "Variação de produto não encontrada.",
      });
    }

    if (!produtoId) {
      return response.status(400).json({
        message: "O produto é obrigatório.",
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
        message: "Não é possível vincular a variação a um produto inativo.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        message: "O nome da variação é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome da variação deve ser um texto.",
      });
    }

    if (nome.trim().length < 2) {
      return response.status(400).json({
        message: "O nome da variação deve ter pelo menos 2 caracteres.",
      });
    }

    if (!sku) {
      return response.status(400).json({
        message: "O SKU da variação é obrigatório.",
      });
    }

    if (typeof sku !== "string") {
      return response.status(400).json({
        message: "O SKU deve ser um texto.",
      });
    }

    const skuFormatado = sku.trim().toUpperCase();

    const variacaoComMesmoSku = await prisma.variacaoProduto.findUnique({
      where: {
        sku: skuFormatado,
      },
    });

    if (variacaoComMesmoSku && variacaoComMesmoSku.id !== id) {
      return response.status(409).json({
        message: "Já existe outra variação com esse SKU.",
      });
    }

    const precoAdicionalNumber = Number(precoAdicional);

    if (Number.isNaN(precoAdicionalNumber)) {
      return response.status(400).json({
        message: "O preço adicional deve ser um número válido.",
      });
    }

    if (precoAdicionalNumber < 0) {
      return response.status(400).json({
        message: "O preço adicional não pode ser negativo.",
      });
    }

    const estoqueNumber = Number(estoque);

    if (Number.isNaN(estoqueNumber)) {
      return response.status(400).json({
        message: "O estoque deve ser um número válido.",
      });
    }

    if (!Number.isInteger(estoqueNumber)) {
      return response.status(400).json({
        message: "O estoque deve ser um número inteiro.",
      });
    }

    if (estoqueNumber < 0) {
      return response.status(400).json({
        message: "O estoque não pode ser negativo.",
      });
    }

    const variacaoAtualizada = await prisma.variacaoProduto.update({
      where: {
        id,
      },
      data: {
        produtoId: String(produtoId),
        nome: nome.trim(),
        sku: skuFormatado,
        tamanho,
        cor,
        precoAdicional: precoAdicionalNumber,
        estoque: estoqueNumber,
      },
      include: {
        produto: true,
        movimentacoesEstoque: true,
      },
    });

    return response.status(200).json(variacaoAtualizada);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar variação de produto.",
    });
  }
});

// PATCH - Atualizar somente o estoque da variação
variacoesProdutoRouter.patch(
  "/:id/estoque",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);
      const { estoque, motivo } = request.body;

      const variacao = await prisma.variacaoProduto.findUnique({
        where: {
          id,
        },
      });

      if (!variacao) {
        return response.status(404).json({
          message: "Variação de produto não encontrada.",
        });
      }

      if (estoque === undefined || estoque === null) {
        return response.status(400).json({
          message: "O estoque é obrigatório.",
        });
      }

      const novoEstoque = Number(estoque);

      if (Number.isNaN(novoEstoque)) {
        return response.status(400).json({
          message: "O estoque deve ser um número válido.",
        });
      }

      if (!Number.isInteger(novoEstoque)) {
        return response.status(400).json({
          message: "O estoque deve ser um número inteiro.",
        });
      }

      if (novoEstoque < 0) {
        return response.status(400).json({
          message: "O estoque não pode ser negativo.",
        });
      }

      const estoqueAtual = variacao.estoque;
      const diferenca = novoEstoque - estoqueAtual;

      const variacaoAtualizada = await prisma.variacaoProduto.update({
        where: {
          id,
        },
        data: {
          estoque: novoEstoque,
        },
        include: {
          produto: true,
          movimentacoesEstoque: true,
        },
      });

      if (diferenca !== 0) {
        await prisma.movimentacaoEstoque.create({
          data: {
            variacaoId: id,
            tipo: "AJUSTE",
            quantidade: Math.abs(diferenca),
            motivo:
              motivo ||
              `Ajuste manual de estoque. Estoque anterior: ${estoqueAtual}. Novo estoque: ${novoEstoque}.`,
          },
        });
      }

      return response.status(200).json(variacaoAtualizada);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao atualizar estoque da variação.",
      });
    }
  }
);

// PATCH - Desativar variação
variacoesProdutoRouter.patch(
  "/:id/desativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const variacao = await prisma.variacaoProduto.findUnique({
        where: {
          id,
        },
      });

      if (!variacao) {
        return response.status(404).json({
          message: "Variação de produto não encontrada.",
        });
      }

      if (!variacao.ativo) {
        return response.status(400).json({
          message: "Variação já está desativada.",
        });
      }

      const variacaoDesativada = await prisma.variacaoProduto.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return response.status(200).json(variacaoDesativada);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao desativar variação.",
      });
    }
  }
);

// PATCH - Ativar variação
variacoesProdutoRouter.patch(
  "/:id/ativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const variacao = await prisma.variacaoProduto.findUnique({
        where: {
          id,
        },
      });

      if (!variacao) {
        return response.status(404).json({
          message: "Variação de produto não encontrada.",
        });
      }

      if (variacao.ativo) {
        return response.status(400).json({
          message: "Variação já está ativa.",
        });
      }

      const variacaoAtivada = await prisma.variacaoProduto.update({
        where: {
          id,
        },
        data: {
          ativo: true,
        },
      });

      return response.status(200).json(variacaoAtivada);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao ativar variação.",
      });
    }
  }
);

// DELETE - Exclusão lógica da variação
variacoesProdutoRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const variacao = await prisma.variacaoProduto.findUnique({
      where: {
        id,
      },
    });

    if (!variacao) {
      return response.status(404).json({
        message: "Variação de produto não encontrada.",
      });
    }

    const variacaoRemovida = await prisma.variacaoProduto.update({
      where: {
        id,
      },
      data: {
        ativo: false,
      },
    });

    return response.status(200).json({
      message: "Variação removida com sucesso.",
      variacao: variacaoRemovida,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao remover variação.",
    });
  }
});

export { variacoesProdutoRouter };