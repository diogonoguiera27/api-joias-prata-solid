export interface CriarImagemProdutoDTO {
  produtoId: string;
  url: string;
  textoAlt?: string | null;
  principal?: boolean;
}

export interface AtualizarImagemProdutoDTO {
  id: string;
  url: string;
  textoAlt?: string | null;
  principal?: boolean;
}

export interface BuscarImagemProdutoPorIdDTO {
  id: string;
}

export interface ListarImagensProdutoDTO {
  produtoId: string;
}

export interface DefinirImagemPrincipalDTO {
  id: string;
}

export interface RemoverImagemProdutoDTO {
  id: string;
}
