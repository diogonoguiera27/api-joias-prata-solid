import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";

export interface CriarMovimentacaoEstoqueDTO {
  variacaoId: string;
  tipo: TipoMovimentacaoEstoque | string;
  quantidade: number | string;
  motivo?: string | null;
}

export interface BuscarMovimentacaoEstoquePorIdDTO {
  id: string;
}

export interface ListarMovimentacoesEstoquePorVariacaoDTO {
  variacaoId: string;
}
