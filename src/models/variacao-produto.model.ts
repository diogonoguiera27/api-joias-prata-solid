export interface CriarVariacaoProdutoDTO {
  produtoId: string;
  nome: string;
  sku: string;
  tamanho?: string | null;
  cor?: string | null;
  precoAdicional?: number | string;
  estoque?: number | string;
}

export interface AtualizarVariacaoProdutoDTO extends CriarVariacaoProdutoDTO {
  id: string;
}

export interface AtualizarEstoqueVariacaoProdutoDTO {
  id: string;
  estoque: number | string;
  motivo?: string | null;
}

export interface BuscarVariacaoProdutoPorIdDTO {
  id: string;
}

export interface ListarVariacoesProdutoDTO {
  produtoId: string;
}

export interface AtivarVariacaoProdutoDTO {
  id: string;
}

export interface DesativarVariacaoProdutoDTO {
  id: string;
}

export interface RemoverVariacaoProdutoDTO {
  id: string;
}
