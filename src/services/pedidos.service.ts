import {
  StatusCarrinho,
  StatusPagamento,
  StatusPedido,
} from "../generated/prisma/enums";
import {
  AtualizarStatusPedidoDTO,
  BuscarPedidoPorIdDTO,
  CancelarPedidoDTO,
  CriarPedidoDTO,
} from "../models/pedido.model";
import { pedidosRepository } from "../repositories/pedidos.repository";

class PedidosService {
  private calcularTotaisDoCarrinho(itens: { subtotal: unknown }[]) {
    const subtotal = itens.reduce((acc, item) => {
      return acc + Number(item.subtotal);
    }, 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      totalDesconto: 0,
      totalFrete: 0,
      total: Number(subtotal.toFixed(2)),
    };
  }

  private validarStatus(status: unknown) {
    if (!status) {
      throw new Error("O status é obrigatório.");
    }

    const statusFormatado = String(status).toUpperCase();
    const statusPermitidos = Object.values(StatusPedido);

    if (!statusPermitidos.includes(statusFormatado as StatusPedido)) {
      throw new Error(
        "Status inválido. Use PENDENTE_PAGAMENTO, PAGO, EM_PREPARACAO, ENVIADO, ENTREGUE, CANCELADO ou REEMBOLSADO."
      );
    }

    return statusFormatado as StatusPedido;
  }

  async criar(data: CriarPedidoDTO) {
    if (!data.carrinhoId) {
      throw new Error("O carrinho é obrigatório para criar o pedido.");
    }

    const carrinho = await pedidosRepository.buscarCarrinhoPorId(
      String(data.carrinhoId)
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    if (carrinho.status !== StatusCarrinho.ATIVO) {
      throw new Error("Somente carrinho ativo pode ser convertido em pedido.");
    }

    if (carrinho.itens.length === 0) {
      throw new Error("Não é possível criar pedido com carrinho vazio.");
    }

    let clienteId = carrinho.clienteId;

    if (data.clienteId) {
      const cliente = await pedidosRepository.buscarClientePorId(
        String(data.clienteId)
      );

      if (!cliente) {
        throw new Error("Cliente informado não encontrado.");
      }

      clienteId = String(data.clienteId);
    }

    for (const item of carrinho.itens) {
      if (!item.produto.ativo) {
        throw new Error(`Produto ${item.produto.nome} está inativo.`);
      }

      if (!item.variacao.ativo) {
        throw new Error(`Variação ${item.variacao.nome} está inativa.`);
      }

      if (item.quantidade > item.variacao.estoque) {
        throw new Error(`Estoque insuficiente para o produto ${item.produto.nome}.`);
      }
    }

    const totais = this.calcularTotaisDoCarrinho(carrinho.itens);

    return pedidosRepository.criarPedidoDoCarrinho({
      carrinho,
      clienteId,
      ...totais,
    });
  }

  async listar() {
    return pedidosRepository.listarPedidos();
  }

  async buscarPorId(data: BuscarPedidoPorIdDTO) {
    const pedido = await pedidosRepository.buscarPedidoPorId(data.id);

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    return pedido;
  }

  async atualizarStatus(data: AtualizarStatusPedidoDTO) {
    const pedido = await pedidosRepository.buscarPedidoComPagamentoPorId(
      data.id
    );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    const status = this.validarStatus(data.status);

    if (pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Pedido cancelado não pode ter status alterado.");
    }

    if (pedido.status === StatusPedido.ENTREGUE && status === StatusPedido.CANCELADO) {
      throw new Error("Pedido entregue não pode ser cancelado diretamente.");
    }

    if (status === StatusPedido.PAGO) {
      if (!pedido.pagamento || pedido.pagamento.status !== StatusPagamento.APROVADO) {
        throw new Error(
          "O pedido só pode ser marcado como PAGO após pagamento aprovado."
        );
      }
    }

    if (status === StatusPedido.ENVIADO && pedido.status !== StatusPedido.EM_PREPARACAO) {
      throw new Error("Pedido só pode ser enviado quando estiver em preparação.");
    }

    if (status === StatusPedido.ENTREGUE && pedido.status !== StatusPedido.ENVIADO) {
      throw new Error("Pedido só pode ser entregue após ser enviado.");
    }

    return pedidosRepository.atualizarStatusPedido(data.id, status);
  }

  async cancelar(data: CancelarPedidoDTO) {
    const pedido = await pedidosRepository.buscarPedidoSimplesPorId(data.id);

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    if (pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Pedido já está cancelado.");
    }

    if (pedido.status === StatusPedido.ENTREGUE) {
      throw new Error("Pedido entregue não pode ser cancelado diretamente.");
    }

    if (pedido.status === StatusPedido.ENVIADO) {
      throw new Error("Pedido enviado não pode ser cancelado diretamente.");
    }

    return pedidosRepository.cancelarPedido(data.id);
  }
}

export const pedidosService = new PedidosService();
