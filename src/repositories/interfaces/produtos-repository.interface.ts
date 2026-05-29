export interface CriarProdutoRepositoryDTO {
  nome: string;
  slug: string;
  descricao?: string | null;
  precoBase: number;
  percentualDesconto: number;
  precoFinal: number;
  material?: string | null;
  colecao?: string | null;
  categoriaId: string;
}

export interface AtualizarProdutoRepositoryDTO {
  nome: string;
  slug: string;
  descricao?: string | null;
  precoBase: number;
  percentualDesconto: number;
  precoFinal: number;
  material?: string | null;
  colecao?: string | null;
  categoriaId: string;
}

export interface IProdutosRepository {
  criarProduto(data: CriarProdutoRepositoryDTO): Promise<any>;

  listarProdutosAtivos(): Promise<any[]>;

  buscarProdutoPorSlug(slug: string): Promise<any | null>;

  buscarProdutoSimplesPorSlug(slug: string): Promise<any | null>;

  buscarProdutoPorId(id: string): Promise<any | null>;

  buscarProdutoSimplesPorId(id: string): Promise<any | null>;

  buscarCategoriaPorId(categoriaId: string): Promise<any | null>;

  atualizarProduto(
    id: string,
    data: AtualizarProdutoRepositoryDTO
  ): Promise<any>;

  atualizarStatusProduto(id: string, ativo: boolean): Promise<any>;
}