import { MetodoPagamento } from "../generated/prisma/enums";

export interface CriarPagamentoDTO {
  pedidoId: string;
  metodo: MetodoPagamento | string;
}

export interface BuscarPagamentoPorIdDTO {
  id: string;
}

export interface AprovarPagamentoDTO {
  id: string;
}

export interface RecusarPagamentoDTO {
  id: string;
}

export interface CancelarPagamentoDTO {
  id: string;
}

export interface ReembolsarPagamentoDTO {
  id: string;
}
