export interface CriarCategoriaDTO {
  nome: string;
  descricao?: string | null;
}

export interface AtualizarCategoriaDTO {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface BuscarCategoriaPorIdDTO {
  id: string;
}

export interface BuscarCategoriaPorSlugDTO {
  slug: string;
}

export interface AtivarCategoriaDTO {
  id: string;
}

export interface DesativarCategoriaDTO {
  id: string;
}

export interface RemoverCategoriaDTO {
  id: string;
}
