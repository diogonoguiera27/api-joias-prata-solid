import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const imagensProdutoRouter = Router();

// CREATE - Adicionar imagem ao produto
imagensProdutoRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { produtoId, url, textoAlt, principal = false } = request.body;

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
        message: "Não é possível adicionar imagem a um produto inativo.",
      });
    }

    if (!url) {
      return response.status(400).json({
        message: "A URL da imagem é obrigatória.",
      });
    }

    if (typeof url !== "string") {
      return response.status(400).json({
        message: "A URL da imagem deve ser um texto.",
      });
    }

    if (url.trim().length < 5) {
      return response.status(400).json({
        message: "A URL da imagem é inválida.",
      });
    }

    const isPrincipal = Boolean(principal);

    if (isPrincipal) {
      await prisma.imagemProduto.updateMany({
        where: {
          produtoId: String(produtoId),
        },
        data: {
          principal: false,
        },
      });
    }

    const imagem = await prisma.imagemProduto.create({
      data: {
        produtoId: String(produtoId),
        url: url.trim(),
        textoAlt,
        principal: isPrincipal,
      },
      include: {
        produto: true,
      },
    });

    return response.status(201).json(imagem);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao adicionar imagem ao produto.",
    });
  }
});

// READ - Listar todas as imagens
imagensProdutoRouter.get("/", async (request: Request, response: Response) => {
  try {
    const imagens = await prisma.imagemProduto.findMany({
      include: {
        produto: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(imagens);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar imagens.",
    });
  }
});

// READ - Listar imagens de um produto
// Precisa vir antes de "/:id"
imagensProdutoRouter.get(
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

      const imagens = await prisma.imagemProduto.findMany({
        where: {
          produtoId,
        },
        include: {
          produto: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      });

      return response.status(200).json(imagens);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao listar imagens do produto.",
      });
    }
  }
);

// READ - Buscar imagem pelo ID
imagensProdutoRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const imagem = await prisma.imagemProduto.findUnique({
      where: {
        id,
      },
      include: {
        produto: true,
      },
    });

    if (!imagem) {
      return response.status(404).json({
        message: "Imagem não encontrada.",
      });
    }

    return response.status(200).json(imagem);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar imagem.",
    });
  }
});

// UPDATE - Atualizar imagem
imagensProdutoRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const { url, textoAlt, principal } = request.body;

    const imagem = await prisma.imagemProduto.findUnique({
      where: {
        id,
      },
    });

    if (!imagem) {
      return response.status(404).json({
        message: "Imagem não encontrada.",
      });
    }

    if (!url) {
      return response.status(400).json({
        message: "A URL da imagem é obrigatória.",
      });
    }

    if (typeof url !== "string") {
      return response.status(400).json({
        message: "A URL da imagem deve ser um texto.",
      });
    }

    if (url.trim().length < 5) {
      return response.status(400).json({
        message: "A URL da imagem é inválida.",
      });
    }

    const isPrincipal = Boolean(principal);

    if (isPrincipal) {
      await prisma.imagemProduto.updateMany({
        where: {
          produtoId: imagem.produtoId,
        },
        data: {
          principal: false,
        },
      });
    }

    const imagemAtualizada = await prisma.imagemProduto.update({
      where: {
        id,
      },
      data: {
        url: url.trim(),
        textoAlt,
        principal: isPrincipal,
      },
      include: {
        produto: true,
      },
    });

    return response.status(200).json(imagemAtualizada);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar imagem.",
    });
  }
});

// PATCH - Definir imagem como principal
imagensProdutoRouter.patch(
  "/:id/principal",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const imagem = await prisma.imagemProduto.findUnique({
        where: {
          id,
        },
      });

      if (!imagem) {
        return response.status(404).json({
          message: "Imagem não encontrada.",
        });
      }

      await prisma.imagemProduto.updateMany({
        where: {
          produtoId: imagem.produtoId,
        },
        data: {
          principal: false,
        },
      });

      const imagemPrincipal = await prisma.imagemProduto.update({
        where: {
          id,
        },
        data: {
          principal: true,
        },
        include: {
          produto: true,
        },
      });

      return response.status(200).json(imagemPrincipal);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao definir imagem principal.",
      });
    }
  }
);

// DELETE - Remover imagem
imagensProdutoRouter.delete(
  "/:id",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const imagem = await prisma.imagemProduto.findUnique({
        where: {
          id,
        },
      });

      if (!imagem) {
        return response.status(404).json({
          message: "Imagem não encontrada.",
        });
      }

      await prisma.imagemProduto.delete({
        where: {
          id,
        },
      });

      return response.status(200).json({
        message: "Imagem removida com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao remover imagem.",
      });
    }
  }
);

export { imagensProdutoRouter };