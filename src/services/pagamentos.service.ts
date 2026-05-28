import {
  MetodoPagamento,
  StatusPagamento,
  StatusPedido,
} from "../generated/prisma/enums";
import {
  AprovarPagamentoDTO,
  BuscarPagamentoPorIdDTO,
  CancelarPagamentoDTO,
  CriarPagamentoDTO,
  RecusarPagamentoDTO,
  ReembolsarPagamentoDTO,
} from "../models/pagamento.model";
import { pagamentosRepository } from "../repositories/pagamentos.repository";

class PagamentosService {
  private validarMetodoPagamento(metodo: unknown) {
    if (!metodo) {
      throw new Error("O método de pagamento é obrigatório.");
    }

    const metodoFormatado = String(metodo).toUpperCase();
    const metodosPermitidos = Object.values(MetodoPagamento);

    if (!metodosPermitidos.includes(metodoFormatado as MetodoPagamento)) {
      throw new Error(
        "Método de pagamento inválido. Use PIX, CARTAO_CREDITO, CARTAO_DEBITO ou BOLETO."
      );
    }

    return metodoFormatado as MetodoPagamento;
  }

  async criar(data: CriarPagamentoDTO) {
    if (!data.pedidoId) {
      throw new Error("O pedido é obrigatório.");
    }

    const pedidoId = String(data.pedidoId);
    const pedido = await pagamentosRepository.buscarPedidoPorId(pedidoId);

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    if (pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Não é possível criar pagamento para pedido cancelado.");
    }

    if (pedido.status === StatusPedido.PAGO) {
      throw new Error("Pedido já está pago.");
    }

    if (pedido.pagamento) {
      throw new Error("Este pedido já possui um pagamento vinculado.");
    }

    const metodo = this.validarMetodoPagamento(data.metodo);

    return pagamentosRepository.criarPagamento({
      pedidoId,
      metodo,
      valor: pedido.total,
    });
  }

  async listar() {
    return pagamentosRepository.listarPagamentos();
  }

  async buscarPorId(data: BuscarPagamentoPorIdDTO) {
    const pagamento = await pagamentosRepository.buscarPagamentoPorId(data.id);

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    return pagamento;
  }

  async aprovar(data: AprovarPagamentoDTO) {
    const pagamento = await pagamentosRepository.buscarPagamentoParaAprovacao(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    if (pagamento.status === StatusPagamento.APROVADO) {
      throw new Error("Pagamento já está aprovado.");
    }

    if (pagamento.status === StatusPagamento.CANCELADO) {
      throw new Error("Pagamento cancelado não pode ser aprovado.");
    }

    if (pagamento.status === StatusPagamento.REEMBOLSADO) {
      throw new Error("Pagamento reembolsado não pode ser aprovado.");
    }

    if (pagamento.pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Não é possível aprovar pagamento de pedido cancelado.");
    }

    for (const item of pagamento.pedido.itens) {
      if (item.quantidade > item.variacao.estoque) {
        throw new Error(`Estoque insuficiente para o produto ${item.produto.nome}.`);
      }
    }

    return pagamentosRepository.aprovarPagamento(data.id, pagamento);
  }

  async recusar(data: RecusarPagamentoDTO) {
    const pagamento = await pagamentosRepository.buscarPagamentoComPedido(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    if (pagamento.status === StatusPagamento.APROVADO) {
      throw new Error("Pagamento aprovado não pode ser recusado.");
    }

    if (pagamento.status === StatusPagamento.CANCELADO) {
      throw new Error("Pagamento cancelado não pode ser recusado.");
    }

    return pagamentosRepository.atualizarStatusPagamento(
      data.id,
      StatusPagamento.RECUSADO
    );
  }

  async cancelar(data: CancelarPagamentoDTO) {
    const pagamento = await pagamentosRepository.buscarPagamentoSimplesPorId(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    if (pagamento.status === StatusPagamento.APROVADO) {
      throw new Error("Pagamento aprovado não pode ser cancelado diretamente.");
    }

    if (pagamento.status === StatusPagamento.CANCELADO) {
      throw new Error("Pagamento já está cancelado.");
    }

    return pagamentosRepository.atualizarStatusPagamento(
      data.id,
      StatusPagamento.CANCELADO
    );
  }

  async reembolsar(data: ReembolsarPagamentoDTO) {
    const pagamento = await pagamentosRepository.buscarPagamentoParaReembolso(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    if (pagamento.status !== StatusPagamento.APROVADO) {
      throw new Error("Somente pagamento aprovado pode ser reembolsado.");
    }

    if (pagamento.pedido.status === StatusPedido.ENTREGUE) {
      throw new Error(
        "Pedido entregue não pode ser reembolsado diretamente por esta rota."
      );
    }

    return pagamentosRepository.reembolsarPagamento(data.id, pagamento);
  }
}

export const pagamentosService = new PagamentosService();
