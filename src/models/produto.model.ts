export interface CriarProdutoDTO {
  nome: string;
  descricao?: string | null;
  precoBase: number | string;
  percentualDesconto?: number | string;
  material?: string | null;
  colecao?: string | null;
  categoriaId: string;
}

export interface AtualizarProdutoDTO extends CriarProdutoDTO {
  id: string;
}

export interface BuscarProdutoPorIdDTO {
  id: string;
}

export interface BuscarProdutoPorSlugDTO {
  slug: string;
}

export interface AtivarProdutoDTO {
  id: string;
}

export interface DesativarProdutoDTO {
  id: string;
}

export interface RemoverProdutoDTO {
  id: string;
}
