import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const pedidosRouter = Router();

const statusPermitidos = [
  "PENDENTE_PAGAMENTO",
  "PAGO",
  "EM_PREPARACAO",
  "ENVIADO",
  "ENTREGUE",
  "CANCELADO",
  "REEMBOLSADO",
];

function calcularTotaisDoCarrinho(itens: { subtotal: unknown }[]) {
  const subtotal = itens.reduce((acc, item) => {
    return acc + Number(item.subtotal);
  }, 0);

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalDesconto: 0,
    totalFrete: 0,
    total: Number(subtotal.toFixed(2)),
  };
}

// CREATE - Criar pedido a partir de um carrinho
pedidosRouter.post("/", async (request: Request, response: Response) => {
  try {
    const { carrinhoId, clienteId } = request.body;

    if (!carrinhoId) {
      return response.status(400).json({
        message: "O carrinho é obrigatório para criar o pedido.",
      });
    }

    const carrinho = await prisma.carrinho.findUnique({
      where: {
        id: String(carrinhoId),
      },
      include: {
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

    if (carrinho.status !== "ATIVO") {
      return response.status(400).json({
        message: "Somente carrinho ativo pode ser convertido em pedido.",
      });
    }

    if (carrinho.itens.length === 0) {
      return response.status(400).json({
        message: "Não é possível criar pedido com carrinho vazio.",
      });
    }

    let clienteIdFinal = carrinho.clienteId;

    if (clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: {
          id: String(clienteId),
        },
      });

      if (!cliente) {
        return response.status(404).json({
          message: "Cliente informado não encontrado.",
        });
      }

      clienteIdFinal = String(clienteId);
    }

    for (const item of carrinho.itens) {
      if (!item.produto.ativo) {
        return response.status(400).json({
          message: `Produto ${item.produto.nome} está inativo.`,
        });
      }

      if (!item.variacao.ativo) {
        return response.status(400).json({
          message: `Variação ${item.variacao.nome} está inativa.`,
        });
      }

      if (item.quantidade > item.variacao.estoque) {
        return response.status(400).json({
          message: `Estoque insuficiente para o produto ${item.produto.nome}.`,
        });
      }
    }

    const totais = calcularTotaisDoCarrinho(carrinho.itens);

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.create({
        data: {
          clienteId: clienteIdFinal,
          subtotal: totais.subtotal,
          totalDesconto: totais.totalDesconto,
          totalFrete: totais.totalFrete,
          total: totais.total,
          status: "PENDENTE_PAGAMENTO",
          itens: {
            create: carrinho.itens.map((item) => ({
              produtoId: item.produtoId,
              variacaoId: item.variacaoId,
              nomeProduto: item.produto.nome,
              quantidade: item.quantidade,
              precoUnitario: item.precoUnitario,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
              variacao: true,
            },
          },
          pagamento: true,
        },
      });

      const carrinhoAtualizado = await tx.carrinho.update({
        where: {
          id: carrinho.id,
        },
        data: {
          status: "CONVERTIDO_EM_PEDIDO",
          clienteId: clienteIdFinal,
        },
        include: {
          itens: true,
        },
      });

      return {
        pedido,
        carrinho: carrinhoAtualizado,
      };
    });

    return response.status(201).json(resultado);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar pedido.",
    });
  }
});

// READ - Listar pedidos
pedidosRouter.get("/", async (request: Request, response: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      include: {
        cliente: true,
        itens: {
          include: {
            produto: true,
            variacao: true,
          },
        },
        pagamento: true,
      },
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(pedidos);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar pedidos.",
    });
  }
});

// READ - Buscar pedido por ID
pedidosRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const pedido = await prisma.pedido.findUnique({
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
        pagamento: true,
      },
    });

    if (!pedido) {
      return response.status(404).json({
        message: "Pedido não encontrado.",
      });
    }

    return response.status(200).json(pedido);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar pedido.",
    });
  }
});

// PATCH - Atualizar status do pedido
pedidosRouter.patch(
  "/:id/status",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);
      const { status } = request.body;

      const pedido = await prisma.pedido.findUnique({
        where: {
          id,
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

      if (!status) {
        return response.status(400).json({
          message: "O status é obrigatório.",
        });
      }

      const statusFormatado = String(status).toUpperCase();

      if (!statusPermitidos.includes(statusFormatado)) {
        return response.status(400).json({
          message:
            "Status inválido. Use PENDENTE_PAGAMENTO, PAGO, EM_PREPARACAO, ENVIADO, ENTREGUE, CANCELADO ou REEMBOLSADO.",
        });
      }

      if (pedido.status === "CANCELADO") {
        return response.status(400).json({
          message: "Pedido cancelado não pode ter status alterado.",
        });
      }

      if (pedido.status === "ENTREGUE" && statusFormatado === "CANCELADO") {
        return response.status(400).json({
          message: "Pedido entregue não pode ser cancelado diretamente.",
        });
      }

      if (statusFormatado === "PAGO") {
        if (!pedido.pagamento || pedido.pagamento.status !== "APROVADO") {
          return response.status(400).json({
            message:
              "O pedido só pode ser marcado como PAGO após pagamento aprovado.",
          });
        }
      }

      if (
        statusFormatado === "ENVIADO" &&
        pedido.status !== "EM_PREPARACAO"
      ) {
        return response.status(400).json({
          message:
            "Pedido só pode ser enviado quando estiver em preparação.",
        });
      }

      if (statusFormatado === "ENTREGUE" && pedido.status !== "ENVIADO") {
        return response.status(400).json({
          message: "Pedido só pode ser entregue após ser enviado.",
        });
      }

      const pedidoAtualizado = await prisma.pedido.update({
        where: {
          id,
        },
        data: {
          status: statusFormatado as any,
        },
        include: {
          cliente: true,
          itens: {
            include: {
              produto: true,
              variacao: true,
            },
          },
          pagamento: true,
        },
      });

      return response.status(200).json(pedidoAtualizado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao atualizar status do pedido.",
      });
    }
  }
);

// PATCH - Cancelar pedido
pedidosRouter.patch(
  "/:id/cancelar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const pedido = await prisma.pedido.findUnique({
        where: {
          id,
        },
      });

      if (!pedido) {
        return response.status(404).json({
          message: "Pedido não encontrado.",
        });
      }

      if (pedido.status === "CANCELADO") {
        return response.status(400).json({
          message: "Pedido já está cancelado.",
        });
      }

      if (pedido.status === "ENTREGUE") {
        return response.status(400).json({
          message: "Pedido entregue não pode ser cancelado diretamente.",
        });
      }

      if (pedido.status === "ENVIADO") {
        return response.status(400).json({
          message: "Pedido enviado não pode ser cancelado diretamente.",
        });
      }

      const pedidoCancelado = await prisma.pedido.update({
        where: {
          id,
        },
        data: {
          status: "CANCELADO",
        },
        include: {
          cliente: true,
          itens: true,
          pagamento: true,
        },
      });

      return response.status(200).json(pedidoCancelado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao cancelar pedido.",
      });
    }
  }
);

export { pedidosRouter };