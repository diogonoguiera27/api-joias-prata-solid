import { TipoDescontoCupom } from "../generated/prisma/enums";
import { prisma } from "../lib/prisma";

class CuponsRepository {
  async criarCupom(data: {
    codigo: string;
    tipoDesconto: TipoDescontoCupom;
    valorDesconto: number;
    valorMinimoPedido: number | null;
    limiteUso: number | null;
    iniciaEm: Date | null;
    expiraEm: Date | null;
  }) {
    return prisma.cupom.create({
      data,
    });
  }

  async listarCupons() {
    return prisma.cupom.findMany({
      orderBy: {
        criadoEm: "desc",
      },
    });
  }

  async buscarCupomPorId(id: string) {
    return prisma.cupom.findUnique({
      where: {
        id,
      },
    });
  }

  async buscarCupomPorCodigo(codigo: string) {
    return prisma.cupom.findUnique({
      where: {
        codigo,
      },
    });
  }

  async atualizarCupom(
    id: string,
    data: {
      codigo: string;
      tipoDesconto: TipoDescontoCupom;
      valorDesconto: number;
      valorMinimoPedido: number | null;
      limiteUso: number | null;
      iniciaEm: Date | null;
      expiraEm: Date | null;
    }
  ) {
    return prisma.cupom.update({
      where: {
        id,
      },
      data,
    });
  }

  async atualizarStatusCupom(id: string, ativo: boolean) {
    return prisma.cupom.update({
      where: {
        id,
      },
      data: {
        ativo,
      },
    });
  }
}

export const cuponsRepository = new CuponsRepository();
