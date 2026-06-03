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

export interface CategoriaProdutoRepository {
  id: string;
  ativo: boolean;
}

export interface ProdutoSimplesRepository {
  id: string;
  ativo: boolean;
}

export interface ProdutoDetalhadoRepository extends ProdutoSimplesRepository {
  categoria: unknown;
  variacoes: unknown[];
  imagens: unknown[];
}

export interface IEscritaProdutosRepository {
  criarProduto(
    data: CriarProdutoRepositoryDTO
  ): Promise<ProdutoDetalhadoRepository>;

  atualizarProduto(
    id: string,
    data: AtualizarProdutoRepositoryDTO
  ): Promise<ProdutoDetalhadoRepository>;
}

export interface ILeituraProdutosRepository {
  listarProdutosAtivos(): Promise<ProdutoDetalhadoRepository[]>;

  buscarProdutoPorSlug(
    slug: string
  ): Promise<ProdutoDetalhadoRepository | null>;

  buscarProdutoSimplesPorSlug(
    slug: string
  ): Promise<ProdutoSimplesRepository | null>;

  buscarProdutoPorId(id: string): Promise<ProdutoDetalhadoRepository | null>;

  buscarProdutoSimplesPorId(
    id: string
  ): Promise<ProdutoSimplesRepository | null>;
}

export interface IConsultaCategoriasProdutoRepository {
  buscarCategoriaPorId(
    categoriaId: string
  ): Promise<CategoriaProdutoRepository | null>;
}

export interface IStatusProdutosRepository {
  atualizarStatusProduto(
    id: string,
    ativo: boolean
  ): Promise<ProdutoSimplesRepository>;
}

export interface IProdutosRepository
  extends IEscritaProdutosRepository,
    ILeituraProdutosRepository,
    IConsultaCategoriasProdutoRepository,
    IStatusProdutosRepository {}
