import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const clientesRouter = Router();

// CREATE - Criar cliente
clientesRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { nome, email, telefone, documento } = request.body;

    if (!nome) {
      return response.status(400).json({
        message: "O nome do cliente é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome do cliente deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome do cliente deve ter pelo menos 3 caracteres.",
      });
    }

    if (!email) {
      return response.status(400).json({
        message: "O email do cliente é obrigatório.",
      });
    }

    if (typeof email !== "string") {
      return response.status(400).json({
        message: "O email do cliente deve ser um texto.",
      });
    }

    if (!email.includes("@")) {
      return response.status(400).json({
        message: "Email inválido.",
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const clienteExistente = await prisma.cliente.findUnique({
      where: {
        email: emailFormatado,
      },
    });

    if (clienteExistente) {
      return response.status(409).json({
        message: "Já existe um cliente com esse email.",
      });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome: nome.trim(),
        email: emailFormatado,
        telefone,
        documento,
      },
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });

    return response.status(201).json(cliente);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar cliente.",
    });
  }
});

// READ - Listar clientes
clientesRouter.get("/", async (request: Request, response: Response) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        carrinhos: true,
        pedidos: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(clientes);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar clientes.",
    });
  }
});

// READ - Buscar cliente pelo ID
clientesRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        carrinhos: {
          include: {
            itens: true,
          },
        },
        pedidos: {
          include: {
            itens: true,
            pagamento: true,
          },
        },
      },
    });

    if (!cliente) {
      return response.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    return response.status(200).json(cliente);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar cliente.",
    });
  }
});

// UPDATE - Atualizar cliente
clientesRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);
    const { nome, email, telefone, documento } = request.body;

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
    });

    if (!cliente) {
      return response.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    if (!nome) {
      return response.status(400).json({
        message: "O nome do cliente é obrigatório.",
      });
    }

    if (typeof nome !== "string") {
      return response.status(400).json({
        message: "O nome do cliente deve ser um texto.",
      });
    }

    if (nome.trim().length < 3) {
      return response.status(400).json({
        message: "O nome do cliente deve ter pelo menos 3 caracteres.",
      });
    }

    if (!email) {
      return response.status(400).json({
        message: "O email do cliente é obrigatório.",
      });
    }

    if (typeof email !== "string") {
      return response.status(400).json({
        message: "O email do cliente deve ser um texto.",
      });
    }

    if (!email.includes("@")) {
      return response.status(400).json({
        message: "Email inválido.",
      });
    }

    const emailFormatado = email.trim().toLowerCase();

    const clienteComMesmoEmail = await prisma.cliente.findUnique({
      where: {
        email: emailFormatado,
      },
    });

    if (clienteComMesmoEmail && clienteComMesmoEmail.id !== id) {
      return response.status(409).json({
        message: "Já existe outro cliente com esse email.",
      });
    }

    const clienteAtualizado = await prisma.cliente.update({
      where: {
        id,
      },
      data: {
        nome: nome.trim(),
        email: emailFormatado,
        telefone,
        documento,
      },
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });

    return response.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar cliente.",
    });
  }
});

// DELETE - Remover cliente
clientesRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const cliente = await prisma.cliente.findUnique({
      where: {
        id,
      },
      include: {
        carrinhos: true,
        pedidos: true,
      },
    });

    if (!cliente) {
      return response.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    if (cliente.carrinhos.length > 0 || cliente.pedidos.length > 0) {
      return response.status(400).json({
        message:
          "Não é possível remover cliente com carrinhos ou pedidos vinculados.",
      });
    }

    await prisma.cliente.delete({
      where: {
        id,
      },
    });

    return response.status(200).json({
      message: "Cliente removido com sucesso.",
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao remover cliente.",
    });
  }
});

export { clientesRouter };