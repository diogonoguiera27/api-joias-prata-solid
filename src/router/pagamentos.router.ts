import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const pagamentosRouter = Router();

const metodosPermitidos = ["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO"];

// CREATE - Criar pagamento para um pedido
pagamentosRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { pedidoId, metodo } = request.body;

    if (!pedidoId) {
      return response.status(400).json({
        message: "O pedido é obrigatório.",
      });
    }

    const pedido = await prisma.pedido.findUnique({
      where: {
        id: String(pedidoId),
      },
      include: {
        pagamento: true,
      },
    });

    if (!pedido) {
      return response.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    if (pedido.status === "CANCELADO") {
      return response.status(400).json({
        message: "Não é possível criar pagamento para pedido cancelado.",
      });
    }

    if (pedido.status === "PAGO") {
      return response.status(400).json({
        message: "Pedido já está pago.",
      });
    }

    if (pedido.pagamento) {
      return response.status(409).json({
        message: "Este pedido já possui um pagamento vinculado.",
      });
    }

    if (!metodo) {
      return response.status(400).json({
        message: "O método de pagamento é obrigatório.",
      });
    }

    const metodoFormatado = String(metodo).toUpperCase();

    if (!metodosPermitidos.includes(metodoFormatado)) {
      return response.status(400).json({
        message:
          "Método de pagamento inválido. Use PIX, CARTAO_CREDITO, CARTAO_DEBITO ou BOLETO.",
      });
    }

    const pagamento = await prisma.pagamento.create({
      data: {
        pedidoId: String(pedidoId),
        metodo: metodoFormatado as any,
        status: "PENDENTE",
        valor: pedido.total,
      },
      include: {
        pedido: true,
      },
    });

    return response.status(201).json(pagamento);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar pagamento.",
    });
  }
});

// READ - Listar pagamentos
pagamentosRouter.get("/", async (request: Request, response: Response) => {
  try {
    const pagamentos = await prisma.pagamento.findMany({
      include: {
        pedido: {
          include: {
            cliente: true,
            itens: true,
          },
        },
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(pagamentos);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar pagamentos.",
    });
  }
});

// READ - Buscar pagamento pelo ID
pagamentosRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const pagamento = await prisma.pagamento.findUnique({
      where: {
        id,
      },
      include: {
        pedido: {
          include: {
            cliente: true,
            itens: {
              include: {
                produto: true,
                variacao: true,
              },
            },
          },
        },
      },
    });

    if (!pagamento) {
      return response.status(404).json({
        message: "Pagamento não encontrado.",
      });
    }

    return response.status(200).json(pagamento);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar pagamento.",
    });
  }
});

// PATCH - Aprovar pagamento
pagamentosRouter.patch(
  "/:id/aprovar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const pagamento = await prisma.pagamento.findUnique({
        where: {
          id,
        },
        include: {
          pedido: {
            include: {
              itens: {
                include: {
                  variacao: true,
                  produto: true,
                },
              },
            },
          },
        },
      });

      if (!pagamento) {
        return response.status(404).json({
          message: "Pagamento não encontrado.",
        });
      }

      if (pagamento.status === "APROVADO") {
        return response.status(400).json({
          message: "Pagamento já está aprovado.",
        });
      }

      if (pagamento.status === "CANCELADO") {
        return response.status(400).json({
          message: "Pagamento cancelado não pode ser aprovado.",
        });
      }

      if (pagamento.status === "REEMBOLSADO") {
        return response.status(400).json({
          message: "Pagamento reembolsado não pode ser aprovado.",
        });
      }

      if (pagamento.pedido.status === "CANCELADO") {
        return response.status(400).json({
          message: "Não é possível aprovar pagamento de pedido cancelado.",
        });
      }

      for (const item of pagamento.pedido.itens) {
        if (item.quantidade > item.variacao.estoque) {
          return response.status(400).json({
            message: `Estoque insuficiente para o produto ${item.produto.nome}.`,
          });
        }
      }

      const resultado = await prisma.$transaction(async (tx) => {
        const pagamentoAprovado = await tx.pagamento.update({
          where: {
            id,
          },
          data: {
            status: "APROVADO",
            pagoEm: new Date(),
          },
        });

        const pedidoAtualizado = await tx.pedido.update({
          where: {
            id: pagamento.pedidoId,
          },
          data: {
            status: "PAGO",
          },
        });

        for (const item of pagamento.pedido.itens) {
          const novoEstoque = item.variacao.estoque - item.quantidade;

          await tx.variacaoProduto.update({
            where: {
              id: item.variacaoId,
            },
            data: {
              estoque: novoEstoque,
            },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              variacaoId: item.variacaoId,
              tipo: "VENDA",
              quantidade: item.quantidade,
              motivo: `Baixa automática após pagamento aprovado do pedido ${pagamento.pedidoId}.`,
            },
          });
        }

        return {
          pagamento: pagamentoAprovado,
          pedido: pedidoAtualizado,
        };
      });

      return response.status(200).json(resultado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao aprovar pagamento.",
      });
    }
  }
);

// PATCH - Recusar pagamento
pagamentosRouter.patch(
  "/:id/recusar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const pagamento = await prisma.pagamento.findUnique({
        where: {
          id,
        },
        include: {
          pedido: true,
        },
      });

      if (!pagamento) {
        return response.status(404).json({
          message: "Pagamento não encontrado.",
        });
      }

      if (pagamento.status === "APROVADO") {
        return response.status(400).json({
          message: "Pagamento aprovado não pode ser recusado.",
        });
      }

      if (pagamento.status === "CANCELADO") {
        return response.status(400).json({
          message: "Pagamento cancelado não pode ser recusado.",
        });
      }

      const pagamentoRecusado = await prisma.pagamento.update({
        where: {
          id,
        },
        data: {
          status: "RECUSADO",
        },
        include: {
          pedido: true,
        },
      });

      return response.status(200).json(pagamentoRecusado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao recusar pagamento.",
      });
    }
  }
);

// PATCH - Cancelar pagamento
pagamentosRouter.patch(
  "/:id/cancelar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const pagamento = await prisma.pagamento.findUnique({
        where: {
          id,
        },
      });

      if (!pagamento) {
        return response.status(404).json({
          message: "Pagamento não encontrado.",
        });
      }

      if (pagamento.status === "APROVADO") {
        return response.status(400).json({
          message: "Pagamento aprovado não pode ser cancelado diretamente.",
        });
      }

      if (pagamento.status === "CANCELADO") {
        return response.status(400).json({
          message: "Pagamento já está cancelado.",
        });
      }

      const pagamentoCancelado = await prisma.pagamento.update({
        where: {
          id,
        },
        data: {
          status: "CANCELADO",
        },
        include: {
          pedido: true,
        },
      });

      return response.status(200).json(pagamentoCancelado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao cancelar pagamento.",
      });
    }
  }
);

// PATCH - Reembolsar pagamento
pagamentosRouter.patch(
  "/:id/reembolsar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const pagamento = await prisma.pagamento.findUnique({
        where: {
          id,
        },
        include: {
          pedido: {
            include: {
              itens: {
                include: {
                  variacao: true,
                },
              },
            },
          },
        },
      });

      if (!pagamento) {
        return response.status(404).json({
          message: "Pagamento não encontrado.",
        });
      }

      if (pagamento.status !== "APROVADO") {
        return response.status(400).json({
          message: "Somente pagamento aprovado pode ser reembolsado.",
        });
      }

      if (pagamento.pedido.status === "ENTREGUE") {
        return response.status(400).json({
          message:
            "Pedido entregue não pode ser reembolsado diretamente por esta rota.",
        });
      }

      const resultado = await prisma.$transaction(async (tx) => {
        const pagamentoReembolsado = await tx.pagamento.update({
          where: {
            id,
          },
          data: {
            status: "REEMBOLSADO",
          },
        });

        const pedidoReembolsado = await tx.pedido.update({
          where: {
            id: pagamento.pedidoId,
          },
          data: {
            status: "REEMBOLSADO",
          },
        });

        for (const item of pagamento.pedido.itens) {
          await tx.variacaoProduto.update({
            where: {
              id: item.variacaoId,
            },
            data: {
              estoque: item.variacao.estoque + item.quantidade,
            },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              variacaoId: item.variacaoId,
              tipo: "DEVOLUCAO_CANCELAMENTO",
              quantidade: item.quantidade,
              motivo: `Devolução automática após reembolso do pedido ${pagamento.pedidoId}.`,
            },
          });
        }

        return {
          pagamento: pagamentoReembolsado,
          pedido: pedidoReembolsado,
        };
      });

      return response.status(200).json(resultado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao reembolsar pagamento.",
      });
    }
  }
);

export { pagamentosRouter };