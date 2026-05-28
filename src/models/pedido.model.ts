import { StatusPedido } from "../generated/prisma/enums";

export interface CriarPedidoDTO {
  carrinhoId: string;
  clienteId?: string | null;
}

export interface BuscarPedidoPorIdDTO {
  id: string;
}

export interface AtualizarStatusPedidoDTO {
  id: string;
  status: StatusPedido | string;
}

export interface CancelarPedidoDTO {
  id: string;
}
