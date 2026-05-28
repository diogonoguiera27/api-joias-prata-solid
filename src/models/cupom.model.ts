import { TipoDescontoCupom } from "../generated/prisma/enums";

export interface CriarCupomDTO {
  codigo: string;
  tipoDesconto: TipoDescontoCupom | string;
  valorDesconto?: number | string | null;
  valorMinimoPedido?: number | string | null;
  limiteUso?: number | string | null;
  iniciaEm?: Date | string | null;
  expiraEm?: Date | string | null;
}

export interface AtualizarCupomDTO extends CriarCupomDTO {
  id: string;
}

export interface AplicarCupomDTO {
  codigo: string;
  subtotal: number | string;
  frete?: number | string;
}

export interface BuscarCupomPorIdDTO {
  id: string;
}

export interface BuscarCupomPorCodigoDTO {
  codigo: string;
}

export interface AtivarCupomDTO {
  id: string;
}

export interface DesativarCupomDTO {
  id: string;
}

export interface RemoverCupomDTO {
  id: string;
}
