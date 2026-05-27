import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const produtosRouter = Router();

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function calcularPrecoFinal(precoBase: number, percentualDesconto: number) {
  const desconto = precoBase * (percentualDesconto / 100);
  return Number((precoBase - desconto).toFixed(2));
}

// CREATE - Criar produto
produtosRouter.post("/", async (request: Request, response: Response) => {
  try {
    const {
      nome,
      descricao,
      precoBase,
      percentualDesconto = 0,
      material,
      colecao,
      categoriaId,
    } = request.body;

    if (!nome) {
      return response.status(400).json({
        message: "O nome do produto é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome do produto deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome do produto deve ter pelo menos 3 caracteres.",
      });
    }

    if (!precoBase) {
      return response.status(400).json({
        message: "O preço base do produto é obrigatório.",
      });
    }

    const precoBaseNumber = Number(precoBase);

    if (Number.isNaN(precoBaseNumber)) {
      return response.status(400).json({
        message: "O preço base deve ser um número válido.",
      });
    }

    if (precoBaseNumber <= 0) {
      return response.status(400).json({
        message: "O preço base deve ser maior que zero.",
      });
    }

    const percentualDescontoNumber = Number(percentualDesconto);

    if (Number.isNaN(percentualDescontoNumber)) {
      return response.status(400).json({
        message: "O percentual de desconto deve ser um número válido.",
      });
    }

    if (percentualDescontoNumber < 0) {
      return response.status(400).json({
        message: "O desconto não pode ser menor que 0%.",
      });
    }

    if (percentualDescontoNumber > 70) {
      return response.status(400).json({
        message: "O desconto não pode ser maior que 70%.",
      });
    }

    if (!categoriaId) {
      return response.status(400).json({
        message: "A categoria do produto é obrigatória.",
      });
    }

    const categoria = await prisma.categoria.findUnique({
      where: {
        id: String(categoriaId),
      },
    });

    if (!categoria) {
      return response.status(404).json({
        message: "Categoria não encontrada.",
      });
    }

    if (!categoria.ativo) {
      return response.status(400).json({
        message: "Não é possível criar produto em uma categoria inativa.",
      });
    }

    const slug = gerarSlug(nome);

    const produtoExistente = await prisma.produto.findUnique({
      where: {
        slug,
      },
    });

    if (produtoExistente) {
      return response.status(409).json({
        message: "Já existe um produto com esse nome.",
      });
    }

    const precoFinal = calcularPrecoFinal(
      precoBaseNumber,
      percentualDescontoNumber
    );

    const produto = await prisma.produto.create({
      data: {
        nome: nome.trim(),
        slug,
        descricao,
        precoBase: precoBaseNumber,
        percentualDesconto: percentualDescontoNumber,
        precoFinal,
        material,
        colecao,
        categoriaId: String(categoriaId),
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });

    return response.status(201).json(produto);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar produto.",
    });
  }
});

// READ - Listar produtos ativos
produtosRouter.get("/", async (request: Request, response: Response) => {
  try {
    const produtos = await prisma.produto.findMany({
      where: {
        ativo: true,
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(produtos);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar produtos.",
    });
  }
});

// READ - Buscar produto pelo slug
// Essa rota precisa vir antes de "/:id"
produtosRouter.get(
  "/slug/:slug",
  async (request: Request, response: Response) => {
    try {
      const slug = String(request.params.slug);

      const produto = await prisma.produto.findUnique({
        where: {
          slug,
        },
        include: {
          categoria: true,
          variacoes: true,
          imagens: true,
        },
      });

      if (!produto) {
        return response.status(404).json({
          message: "Produto não encontrado.",
        });
      }

      return response.status(200).json(produto);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao buscar produto pelo slug.",
      });
    }
  }
);

// READ - Buscar produto pelo ID
produtosRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const produto = await prisma.produto.findUnique({
      where: {
        id,
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });

    if (!produto) {
      return response.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    return response.status(200).json(produto);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar produto.",
    });
  }
});

// UPDATE - Atualizar produto
produtosRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const {
      nome,
      descricao,
      precoBase,
      percentualDesconto = 0,
      material,
      colecao,
      categoriaId,
    } = request.body;

    const produto = await prisma.produto.findUnique({
      where: {
        id,
      },
    });

    if (!produto) {
      return response.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        message: "O nome do produto é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome do produto deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome do produto deve ter pelo menos 3 caracteres.",
      });
    }

    if (!precoBase) {
      return response.status(400).json({
        message: "O preço base do produto é obrigatório.",
      });
    }

    const precoBaseNumber = Number(precoBase);

    if (Number.isNaN(precoBaseNumber)) {
      return response.status(400).json({
        message: "O preço base deve ser um número válido.",
      });
    }

    if (precoBaseNumber <= 0) {
      return response.status(400).json({
        message: "O preço base deve ser maior que zero.",
      });
    }

    const percentualDescontoNumber = Number(percentualDesconto);

    if (Number.isNaN(percentualDescontoNumber)) {
      return response.status(400).json({
        message: "O percentual de desconto deve ser um número válido.",
      });
    }

    if (percentualDescontoNumber < 0) {
      return response.status(400).json({
        message: "O desconto não pode ser menor que 0%.",
      });
    }

    if (percentualDescontoNumber > 70) {
      return response.status(400).json({
        message: "O desconto não pode ser maior que 70%.",
      });
    }

    if (!categoriaId) {
      return response.status(400).json({
        message: "A categoria do produto é obrigatória.",
      });
    }

    const categoria = await prisma.categoria.findUnique({
      where: {
        id: String(categoriaId),
      },
    });

    if (!categoria) {
      return response.status(404).json({
        message: "Categoria não encontrada.",
      });
    }

    if (!categoria.ativo) {
      return response.status(400).json({
        message: "Não é possível vincular produto a uma categoria inativa.",
      });
    }

    const novoSlug = gerarSlug(nome);

    const produtoComMesmoSlug = await prisma.produto.findUnique({
      where: {
        slug: novoSlug,
      },
    });

    if (produtoComMesmoSlug && produtoComMesmoSlug.id !== id) {
      return response.status(409).json({
        message: "Já existe outro produto com esse nome.",
      });
    }

    const precoFinal = calcularPrecoFinal(
      precoBaseNumber,
      percentualDescontoNumber
    );

    const produtoAtualizado = await prisma.produto.update({
      where: {
        id,
      },
      data: {
        nome: nome.trim(),
        slug: novoSlug,
        descricao,
        precoBase: precoBaseNumber,
        percentualDesconto: percentualDescontoNumber,
        precoFinal,
        material,
        colecao,
        categoriaId: String(categoriaId),
      },
      include: {
        categoria: true,
        variacoes: true,
        imagens: true,
      },
    });

    return response.status(200).json(produtoAtualizado);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar produto.",
    });
  }
});

// PATCH - Desativar produto
produtosRouter.patch(
  "/:id/desativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const produto = await prisma.produto.findUnique({
        where: {
          id,
        },
      });

      if (!produto) {
        return response.status(404).json({
          message: "Produto não encontrado.",
        });
      }

      if (!produto.ativo) {
        return response.status(400).json({
          message: "Produto já está desativado.",
        });
      }

      const produtoDesativado = await prisma.produto.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return response.status(200).json(produtoDesativado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao desativar produto.",
      });
    }
  }
);

// PATCH - Ativar produto
produtosRouter.patch(
  "/:id/ativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const produto = await prisma.produto.findUnique({
        where: {
          id,
        },
      });

      if (!produto) {
        return response.status(404).json({
          message: "Produto não encontrado.",
        });
      }

      if (produto.ativo) {
        return response.status(400).json({
          message: "Produto já está ativo.",
        });
      }

      const produtoAtivado = await prisma.produto.update({
        where: {
          id,
        },
        data: {
          ativo: true,
        },
      });

      return response.status(200).json(produtoAtivado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao ativar produto.",
      });
    }
  }
);

// DELETE - Exclusão lógica do produto
produtosRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const produto = await prisma.produto.findUnique({
      where: {
        id,
      },
    });

    if (!produto) {
      return response.status(404).json({
        message: "Produto não encontrado.",
      });
    }

    const produtoRemovido = await prisma.produto.update({
      where: {
        id,
      },
      data: {
        ativo: false,
      },
    });

    return response.status(200).json({
      message: "Produto removido com sucesso.",
      produto: produtoRemovido,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao remover produto.",
    });
  }
});

export { produtosRouter };