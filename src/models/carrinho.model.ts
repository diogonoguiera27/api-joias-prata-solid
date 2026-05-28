export interface CriarCarrinhoDTO {
  clienteId?: string | null;
}

export interface AdicionarItemCarrinhoDTO {                                                                                                     
  carrinhoId: string;
  produtoId: string;
  variacaoId: string;
  quantidade: number;
}

export interface AtualizarQuantidadeItemCarrinhoDTO {
  carrinhoId: string;
  itemId: string;
  quantidade: number;
}

export interface RemoverItemCarrinhoDTO {
  carrinhoId: string;
  itemId: string;
}

export interface LimparCarrinhoDTO {
  carrinhoId: string;
}

export interface AbandonarCarrinhoDTO {
  carrinhoId: string;
}