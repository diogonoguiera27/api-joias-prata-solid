export interface CriarClienteDTO {
  nome: string;
  email: string;
  telefone?: string | null;
  documento?: string | null;
}

export interface AtualizarClienteDTO {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  documento?: string | null;
}

export interface BuscarClientePorIdDTO {
  id: string;
}

export interface RemoverClienteDTO {
  id: string;
}
