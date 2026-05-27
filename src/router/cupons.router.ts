import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";

const cuponsRouter = Router();

const tiposDescontoPermitidos = ["PERCENTUAL", "VALOR_FIXO", "FRETE_GRATIS"];

function normalizarCodigoCupom(codigo: string) {
  return codigo.trim().toUpperCase();
}

function cupomEstaVencido(expiraEm?: Date | null) {
  if (!expiraEm) {
    return false;
  }

  return new Date() > new Date(expiraEm);
}

function cupomAindaNaoIniciou(iniciaEm?: Date | null) {
  if (!iniciaEm) {
    return false;
  }

  return new Date() < new Date(iniciaEm);
}

// CREATE - Criar cupom
cuponsRouter.post("/", async (request: Request, response: Response) => {
  try {
    const {
      codigo,
      tipoDesconto,
      valorDesconto,
      valorMinimoPedido,
      limiteUso,
      iniciaEm,
      expiraEm,
    } = request.body;

    if (!codigo) {
      return response.status(400).json({
        message: "O código do cupom é obrigatório.",
      });
    }

    if (typeof codigo !== "string") {
      return response.status(400).json({
        message: "O código do cupom deve ser um texto.",
      });
    }

    if (codigo.trim().length < 3) {
      return response.status(400).json({
        message: "O código do cupom deve ter pelo menos 3 caracteres.",
      });
    }

    const codigoFormatado = normalizarCodigoCupom(codigo);

    const cupomExistente = await prisma.cupom.findUnique({
      where: {
        codigo: codigoFormatado,
      },
    });

    if (cupomExistente) {
      return response.status(409).json({
        message: "Já existe um cupom com esse código.",
      });
    }

    if (!tipoDesconto) {
      return response.status(400).json({
        message: "O tipo de desconto é obrigatório.",
      });
    }

    const tipoDescontoFormatado = String(tipoDesconto).toUpperCase();

    if (!tiposDescontoPermitidos.includes(tipoDescontoFormatado)) {
      return response.status(400).json({
        message:
          "Tipo de desconto inválido. Use PERCENTUAL, VALOR_FIXO ou FRETE_GRATIS.",
      });
    }

    const valorDescontoNumber = Number(valorDesconto ?? 0);

    if (Number.isNaN(valorDescontoNumber)) {
      return response.status(400).json({
        message: "O valor do desconto deve ser um número válido.",
      });
    }

    if (tipoDescontoFormatado !== "FRETE_GRATIS" && valorDescontoNumber <= 0) {
      return response.status(400).json({
        message: "O valor do desconto deve ser maior que zero.",
      });
    }

    if (tipoDescontoFormatado === "PERCENTUAL" && valorDescontoNumber > 70) {
      return response.status(400).json({
        message: "Cupom percentual não pode passar de 70%.",
      });
    }

    const valorMinimoPedidoNumber =
      valorMinimoPedido === undefined || valorMinimoPedido === null
        ? null
        : Number(valorMinimoPedido);

    if (
      valorMinimoPedidoNumber !== null &&
      Number.isNaN(valorMinimoPedidoNumber)
    ) {
      return response.status(400).json({
        message: "O valor mínimo do pedido deve ser um número válido.",
      });
    }

    if (valorMinimoPedidoNumber !== null && valorMinimoPedidoNumber < 0) {
      return response.status(400).json({
        message: "O valor mínimo do pedido não pode ser negativo.",
      });
    }

    const limiteUsoNumber =
      limiteUso === undefined || limiteUso === null ? null : Number(limiteUso);

    if (limiteUsoNumber !== null && !Number.isInteger(limiteUsoNumber)) {
      return response.status(400).json({
        message: "O limite de uso deve ser um número inteiro.",
      });
    }

    if (limiteUsoNumber !== null && limiteUsoNumber <= 0) {
      return response.status(400).json({
        message: "O limite de uso deve ser maior que zero.",
      });
    }

    const cupom = await prisma.cupom.create({
      data: {
        codigo: codigoFormatado,
        tipoDesconto: tipoDescontoFormatado as any,
        valorDesconto:
          tipoDescontoFormatado === "FRETE_GRATIS" ? 0 : valorDescontoNumber,
        valorMinimoPedido: valorMinimoPedidoNumber,
        limiteUso: limiteUsoNumber,
        iniciaEm: iniciaEm ? new Date(iniciaEm) : null,
        expiraEm: expiraEm ? new Date(expiraEm) : null,
      },
    });

    return response.status(201).json(cupom);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao criar cupom.",
    });
  }
});

// READ - Listar cupons
cuponsRouter.get("/", async (request: Request, response: Response) => {
  try {
    const cupons = await prisma.cupom.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });

    return response.status(200).json(cupons);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao listar cupons.",
    });
  }
});

// READ - Buscar cupom pelo código
// Precisa vir antes de "/:id"
cuponsRouter.get(
  "/codigo/:codigo",
  async (request: Request, response: Response) => {
    try {
      const codigo = normalizarCodigoCupom(String(request.params.codigo));

      const cupom = await prisma.cupom.findUnique({
        where: {
          codigo,
        },
      });

      if (!cupom) {
        return response.status(404).json({
          message: "Cupom não encontrado.",
        });
      }

      return response.status(200).json(cupom);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao buscar cupom pelo código.",
      });
    }
  }
);

// READ - Buscar cupom pelo ID
cuponsRouter.get("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const cupom = await prisma.cupom.findUnique({
      where: {
        id,
      },
    });

    if (!cupom) {
      return response.status(404).json({
        message: "Cupom não encontrado.",
      });
    }

    return response.status(200).json(cupom);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao buscar cupom.",
    });
  }
});

// POST - Aplicar cupom
cuponsRouter.post("/aplicar", async (request: Request, response: Response) => {
  try {
    const { codigo, subtotal, frete = 0 } = request.body;

    if (!codigo) {
      return response.status(400).json({
        message: "O código do cupom é obrigatório.",
      });
    }

    const codigoFormatado = normalizarCodigoCupom(String(codigo));

    const cupom = await prisma.cupom.findUnique({
      where: {
        codigo: codigoFormatado,
      },
    });

    if (!cupom) {
      return response.status(404).json({
        message: "Cupom não encontrado.",
      });
    }

    if (!cupom.ativo) {
      return response.status(400).json({
        message: "Cupom inativo.",
      });
    }

    if (cupomAindaNaoIniciou(cupom.iniciaEm)) {
      return response.status(400).json({
        message: "Cupom ainda não está disponível.",
      });
    }

    if (cupomEstaVencido(cupom.expiraEm)) {
      return response.status(400).json({
        message: "Cupom vencido.",
      });
    }

    if (cupom.limiteUso !== null && cupom.quantidadeUsada >= cupom.limiteUso) {
      return response.status(400).json({
        message: "Cupom atingiu o limite máximo de uso.",
      });
    }

    const subtotalNumber = Number(subtotal);

    if (Number.isNaN(subtotalNumber) || subtotalNumber <= 0) {
      return response.status(400).json({
        message: "Subtotal inválido.",
      });
    }

    const freteNumber = Number(frete);

    if (Number.isNaN(freteNumber) || freteNumber < 0) {
      return response.status(400).json({
        message: "Frete inválido.",
      });
    }

    if (
      cupom.valorMinimoPedido !== null &&
      subtotalNumber < Number(cupom.valorMinimoPedido)
    ) {
      return response.status(400).json({
        message: "Subtotal menor que o valor mínimo exigido pelo cupom.",
      });
    }

    let desconto = 0;
    let freteFinal = freteNumber;

    if (cupom.tipoDesconto === "PERCENTUAL") {
      desconto = subtotalNumber * (Number(cupom.valorDesconto) / 100);
    }

    if (cupom.tipoDesconto === "VALOR_FIXO") {
      desconto = Number(cupom.valorDesconto);
    }

    if (cupom.tipoDesconto === "FRETE_GRATIS") {
      freteFinal = 0;
    }

    if (desconto > subtotalNumber) {
      desconto = subtotalNumber;
    }

    const total = subtotalNumber - desconto + freteFinal;

    return response.status(200).json({
      cupom,
      subtotal: Number(subtotalNumber.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      freteOriginal: Number(freteNumber.toFixed(2)),
      freteFinal: Number(freteFinal.toFixed(2)),
      total: Number(total.toFixed(2)),
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao aplicar cupom.",
    });
  }
});

// UPDATE - Atualizar cupom
cuponsRouter.put("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const {
      codigo,
      tipoDesconto,
      valorDesconto,
      valorMinimoPedido,
      limiteUso,
      iniciaEm,
      expiraEm,
    } = request.body;

    const cupom = await prisma.cupom.findUnique({
      where: {
        id,
      },
    });

    if (!cupom) {
      return response.status(404).json({
        message: "Cupom não encontrado.",
      });
    }

    if (!codigo) {
      return response.status(400).json({
        message: "O código do cupom é obrigatório.",
      });
    }

    const codigoFormatado = normalizarCodigoCupom(String(codigo));

    const cupomComMesmoCodigo = await prisma.cupom.findUnique({
      where: {
        codigo: codigoFormatado,
      },
    });

    if (cupomComMesmoCodigo && cupomComMesmoCodigo.id !== id) {
      return response.status(409).json({
        message: "Já existe outro cupom com esse código.",
      });
    }

    const tipoDescontoFormatado = String(tipoDesconto).toUpperCase();

    if (!tiposDescontoPermitidos.includes(tipoDescontoFormatado)) {
      return response.status(400).json({
        message:
          "Tipo de desconto inválido. Use PERCENTUAL, VALOR_FIXO ou FRETE_GRATIS.",
      });
    }

    const valorDescontoNumber = Number(valorDesconto ?? 0);

    if (tipoDescontoFormatado !== "FRETE_GRATIS" && valorDescontoNumber <= 0) {
      return response.status(400).json({
        message: "O valor do desconto deve ser maior que zero.",
      });
    }

    if (tipoDescontoFormatado === "PERCENTUAL" && valorDescontoNumber > 70) {
      return response.status(400).json({
        message: "Cupom percentual não pode passar de 70%.",
      });
    }

    const valorMinimoPedidoNumber =
      valorMinimoPedido === undefined || valorMinimoPedido === null
        ? null
        : Number(valorMinimoPedido);

    const limiteUsoNumber =
      limiteUso === undefined || limiteUso === null ? null : Number(limiteUso);

    const cupomAtualizado = await prisma.cupom.update({
      where: {
        id,
      },
      data: {
        codigo: codigoFormatado,
        tipoDesconto: tipoDescontoFormatado as any,
        valorDesconto:
          tipoDescontoFormatado === "FRETE_GRATIS" ? 0 : valorDescontoNumber,
        valorMinimoPedido: valorMinimoPedidoNumber,
        limiteUso: limiteUsoNumber,
        iniciaEm: iniciaEm ? new Date(iniciaEm) : null,
        expiraEm: expiraEm ? new Date(expiraEm) : null,
      },
    });

    return response.status(200).json(cupomAtualizado);
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao atualizar cupom.",
    });
  }
});

// PATCH - Ativar cupom
cuponsRouter.patch(
  "/:id/ativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const cupom = await prisma.cupom.findUnique({
        where: {
          id,
        },
      });

      if (!cupom) {
        return response.status(404).json({
          message: "Cupom não encontrado.",
        });
      }

      if (cupom.ativo) {
        return response.status(400).json({
          message: "Cupom já está ativo.",
        });
      }

      const cupomAtivado = await prisma.cupom.update({
        where: {
          id,
        },
        data: {
          ativo: true,
        },
      });

      return response.status(200).json(cupomAtivado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao ativar cupom.",
      });
    }
  }
);

// PATCH - Desativar cupom
cuponsRouter.patch(
  "/:id/desativar",
  async (request: Request, response: Response) => {
    try {
      const id = String(request.params.id);

      const cupom = await prisma.cupom.findUnique({
        where: {
          id,
        },
      });

      if (!cupom) {
        return response.status(404).json({
          message: "Cupom não encontrado.",
        });
      }

      if (!cupom.ativo) {
        return response.status(400).json({
          message: "Cupom já está desativado.",
        });
      }

      const cupomDesativado = await prisma.cupom.update({
        where: {
          id,
        },
        data: {
          ativo: false,
        },
      });

      return response.status(200).json(cupomDesativado);
    } catch (error) {
      console.error(error);

      return response.status(500).json({
        message: "Erro interno ao desativar cupom.",
      });
    }
  }
);

// DELETE - Exclusão lógica do cupom
cuponsRouter.delete("/:id", async (request: Request, response: Response) => {
  try {
    const id = String(request.params.id);

    const cupom = await prisma.cupom.findUnique({
      where: {
        id,
      },
    });

    if (!cupom) {
      return response.status(404).json({
        message: "Cupom não encontrado.",
      });
    }

    const cupomRemovido = await prisma.cupom.update({
      where: {
        id,
      },
      data: {
        ativo: false,
      },
    });

    return response.status(200).json({
      message: "Cupom removido com sucesso.",
      cupom: cupomRemovido,
    });
  } catch (error) {
    console.error(error);

    return response.status(500).json({
      message: "Erro interno ao remover cupom.",
    });
  }
});

export { cuponsRouter };