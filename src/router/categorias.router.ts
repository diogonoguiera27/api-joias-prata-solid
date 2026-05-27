import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const categoriasRouter = Router();

function gerarSlug(texto: string) {
  return texto
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// CREATE - Criar categoria
categoriasRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { nome, descricao } = request.body;

    if (!nome) {
      return response.status(400).json({
        message: "O nome da categoria é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome da categoria deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome da categoria deve ter pelo menos 3 caracteres.",
      });
    }

    const slug = gerarSlug(nome);

    const categoriaExistente = await prisma.categoria.findUnique({
      where: {
        slug,
      },
    });

    if (categoriaExistente) {
      return response.status(409).json({
        message: "Já existe uma categoria com esse nome.",
      });
    }

    const categoria = await prisma.categoria.create({
      data: {
        nome: nome.trim(),
        slug,
        descricao,
      },
    });

    return response.status(201).json(categoria);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar categoria.",
    });
  }
});

// READ - Listar categorias ativas
categoriasRouter.get("/", async (request: Request, response: Response) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: {
        ativo: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(categorias);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar categorias.",
    });
  }
});

// READ - Buscar categoria pelo slug
// Essa rota precisa vir antes de "/:id"
categoriasRouter.get(
  "/slug/:slug",
  async (request: Request, response: Response) => {
    try {
      const slug = String(request.params.slug);

      const categoria = await prisma.categoria.findUnique({
        where: {
          slug,
        },
      });

      if (!categoria) {
        return response.status(404).json({
          message: "Categoria não encontrada.",
        });
      }

      return response.status(200).json(categoria);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao buscar categoria pelo slug.",
      });
    }
  }
);

// READ - Buscar categoria pelo ID
categoriasRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const categoria = await prisma.categoria.findUnique({
      where: {
        id,
      },
    });

    if (!categoria) {
      return response.status(404).json({
        message: "Categoria não encontrada.",
      });
    }

    return response.status(200).json(categoria);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar categoria.",
    });
  }
});

// UPDATE - Atualizar categoria
categoriasRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const { nome, descricao } = request.body;

    const categoria = await prisma.categoria.findUnique({
      where: {
        id,
      },
    });

    if (!categoria) {
      return response.status(404).json({
        message: "Categoria não encontrada.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        message: "O nome da categoria é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome da categoria deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome da categoria deve ter pelo menos 3 caracteres.",
      });
    }

    const novoSlug = gerarSlug(nome);

    const categoriaComMesmoSlug = await prisma.categoria.findUnique({
      where: {
        slug: novoSlug,
      },
    });

    if (categoriaComMesmoSlug && categoriaComMesmoSlug.id !== id) {
      return response.status(409).json({
        message: "Já existe outra categoria com esse nome.",
      });
    }

    const categoriaAtualizada = await prisma.categoria.update({
      where: {
        id,
      },
      data: {
        nome: nome.trim(),
        slug: novoSlug,
        descricao,
      },
    });

    return response.status(200).json(categoriaAtualizada);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar categoria.",
    });
  }
});

// PATCH - Desativar categoria
categoriasRouter.patch(
  "/:id/desativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const categoria = await prisma.categoria.findUnique({
        where: {
          id,
        },
      });

      if (!categoria) {
        return response.status(404).json({
          message: "Categoria não encontrada.",
        });
      }

      if (!categoria.ativo) {
        return response.status(400).json({
          message: "Categoria já está desativada.",
        });
      }

      const categoriaDesativada = await prisma.categoria.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return response.status(200).json(categoriaDesativada);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao desativar categoria.",
      });
    }
  }
);

// PATCH - Ativar categoria
categoriasRouter.patch(
  "/:id/ativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const categoria = await prisma.categoria.findUnique({
        where: {
          id,
        },
      });

      if (!categoria) {
        return response.status(404).json({
          message: "Categoria não encontrada.",
        });
      }

      if (categoria.ativo) {
        return response.status(400).json({
          message: "Categoria já está ativa.",
        });
      }

      const categoriaAtivada = await prisma.categoria.update({
        where: {
          id,
        },
        data: {
          ativo: true,
        },
      });

      return response.status(200).json(categoriaAtivada);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao ativar categoria.",
      });
    }
  }
);

// DELETE - Exclusão lógica da categoria
categoriasRouter.delete(
  "/:id",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const categoria = await prisma.categoria.findUnique({
        where: {
          id,
        },
      });

      if (!categoria) {
        return response.status(404).json({
          message: "Categoria não encontrada.",
        });
      }

      const categoriaRemovida = await prisma.categoria.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return response.status(200).json({
        message: "Categoria removida com sucesso.",
        categoria: categoriaRemovida,
      });
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao remover categoria.",
      });
    }
  }
);

export { categoriasRouter };