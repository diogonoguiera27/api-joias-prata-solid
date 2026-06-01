import {
  MetodoPagamento,
  StatusPagamento,
  StatusPedido,
  TipoMovimentacaoEstoque,
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

interface PagamentoComPedido {
  pedidoId: string;
  status: StatusPagamento;
  pedido: {
    status: StatusPedido;
  };
}

interface PagamentoParaAprovacao extends PagamentoComPedido {
  pedido: PagamentoComPedido["pedido"] & {
    itens: Array<{
      variacaoId: string;
      quantidade: number;
      variacao: {
        estoque: number;
      };
      produto: {
        nome: string;
      };
    }>;
  };
}

interface PagamentoParaReembolso extends PagamentoComPedido {
  pedido: PagamentoComPedido["pedido"] & {
    itens: Array<{
      variacaoId: string;
      quantidade: number;
      variacao: {
        estoque: number;
      };
    }>;
  };
}

interface PedidoParaPagamento {
  status: StatusPedido;
  total: unknown;
  pagamento?: unknown | null;
}

export interface IPagamentosRepository {
  executarTransacao<T>(operacao: (tx: any) => Promise<T>): Promise<T>;
  buscarPedidoPorId(pedidoId: string): Promise<PedidoParaPagamento | null>;
  criarPagamento(data: {
    pedidoId: string;
    metodo: MetodoPagamento;
    valor: unknown;
  }): Promise<unknown>;
  listarPagamentos(): Promise<unknown[]>;
  buscarPagamentoPorId(id: string): Promise<unknown | null>;
  buscarPagamentoParaAprovacao(
    id: string
  ): Promise<PagamentoParaAprovacao | null>;
  buscarPagamentoComPedido(id: string): Promise<PagamentoComPedido | null>;
  buscarPagamentoSimplesPorId(
    id: string
  ): Promise<{ status: StatusPagamento } | null>;
  buscarPagamentoParaReembolso(
    id: string
  ): Promise<PagamentoParaReembolso | null>;
  marcarPagamentoComoAprovado(id: string, tx?: any): Promise<unknown>;
  atualizarStatusPagamento(
    id: string,
    status: StatusPagamento,
    includePedido?: boolean
  ): Promise<unknown>;
  marcarPagamentoComoReembolsado(id: string, tx?: any): Promise<unknown>;
  atualizarStatusPedido(
    id: string,
    status: StatusPedido,
    tx?: any
  ): Promise<unknown>;
  atualizarEstoqueVariacao(
    id: string,
    estoque: number,
    tx?: any
  ): Promise<unknown>;
  criarMovimentacaoEstoque(
    data: {
      variacaoId: string;
      tipo: TipoMovimentacaoEstoque;
      quantidade: number;
      motivo: string;
    },
    tx?: any
  ): Promise<unknown>;
}

interface ItemEstoquePagamento {
  variacaoId: string;
  quantidade: number;
  variacao: {
    estoque: number;
  };
}

export interface IProcessadorEstoquePagamento {
  baixarEstoque(
    itens: ItemEstoquePagamento[],
    pedidoId: string,
    tx?: any
  ): Promise<void>;
  devolverEstoque(
    itens: ItemEstoquePagamento[],
    pedidoId: string,
    tx?: any
  ): Promise<void>;
}

export interface IValidadorMetodoPagamento {
  validar(metodo: unknown): MetodoPagamento;
}

export interface IRegraAprovacaoPagamento {
  validar(pagamento: PagamentoParaAprovacao): void;
}

export interface IRegraRecusaPagamento {
  validar(pagamento: PagamentoComPedido): void;
}

export interface IRegraCancelamentoPagamento {
  validar(pagamento: { status: StatusPagamento }): void;
}

export interface IRegraReembolsoPagamento {
  validar(pagamento: PagamentoComPedido): void;
}

export class ValidadorMetodoPagamentoPadrao
  implements IValidadorMetodoPagamento
{
  validar(metodo: unknown) {
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
}

export class RegraAprovacaoPagamentoPadrao
  implements IRegraAprovacaoPagamento
{
  validar(pagamento: PagamentoParaAprovacao) {
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
        throw new Error(
          `Estoque insuficiente para o produto ${item.produto.nome}.`
        );
      }
    }
  }
}

export class RegraRecusaPagamentoPadrao implements IRegraRecusaPagamento {
  validar(pagamento: PagamentoComPedido) {
    if (pagamento.status === StatusPagamento.APROVADO) {
      throw new Error("Pagamento aprovado não pode ser recusado.");
    }

    if (pagamento.status === StatusPagamento.CANCELADO) {
      throw new Error("Pagamento cancelado não pode ser recusado.");
    }
  }
}

export class RegraCancelamentoPagamentoPadrao
  implements IRegraCancelamentoPagamento
{
  validar(pagamento: { status: StatusPagamento }) {
    if (pagamento.status === StatusPagamento.APROVADO) {
      throw new Error("Pagamento aprovado não pode ser cancelado diretamente.");
    }

    if (pagamento.status === StatusPagamento.CANCELADO) {
      throw new Error("Pagamento já está cancelado.");
    }
  }
}

export class RegraReembolsoPagamentoPadrao implements IRegraReembolsoPagamento {
  validar(pagamento: PagamentoComPedido) {
    if (pagamento.status !== StatusPagamento.APROVADO) {
      throw new Error("Somente pagamento aprovado pode ser reembolsado.");
    }

    if (pagamento.pedido.status === StatusPedido.ENTREGUE) {
      throw new Error(
        "Pedido entregue não pode ser reembolsado diretamente por esta rota."
      );
    }
  }
}

export class ProcessadorEstoquePagamentoPadrao
  implements IProcessadorEstoquePagamento
{
  constructor(private pagamentosRepository: IPagamentosRepository) {}

  async baixarEstoque(
    itens: ItemEstoquePagamento[],
    pedidoId: string,
    tx?: any
  ) {
    for (const item of itens) {
      await this.pagamentosRepository.atualizarEstoqueVariacao(
        item.variacaoId,
        item.variacao.estoque - item.quantidade,
        tx
      );

      await this.pagamentosRepository.criarMovimentacaoEstoque(
        {
          variacaoId: item.variacaoId,
          tipo: TipoMovimentacaoEstoque.VENDA,
          quantidade: item.quantidade,
          motivo: `Baixa automática após pagamento aprovado do pedido ${pedidoId}.`,
        },
        tx
      );
    }
  }

  async devolverEstoque(
    itens: ItemEstoquePagamento[],
    pedidoId: string,
    tx?: any
  ) {
    for (const item of itens) {
      await this.pagamentosRepository.atualizarEstoqueVariacao(
        item.variacaoId,
        item.variacao.estoque + item.quantidade,
        tx
      );

      await this.pagamentosRepository.criarMovimentacaoEstoque(
        {
          variacaoId: item.variacaoId,
          tipo: TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO,
          quantidade: item.quantidade,
          motivo: `Devolução automática após reembolso do pedido ${pedidoId}.`,
        },
        tx
      );
    }
  }
}

export class PagamentosService {
  constructor(
    private pagamentosRepository: IPagamentosRepository,
    private validadorMetodoPagamento: IValidadorMetodoPagamento,
    private regraAprovacaoPagamento: IRegraAprovacaoPagamento,
    private regraRecusaPagamento: IRegraRecusaPagamento,
    private regraCancelamentoPagamento: IRegraCancelamentoPagamento,
    private regraReembolsoPagamento: IRegraReembolsoPagamento,
    private processadorEstoquePagamento: IProcessadorEstoquePagamento
  ) {}

  private validarMetodoPagamento(metodo: unknown) {
    return this.validadorMetodoPagamento.validar(metodo);
  }

  async criar(data: CriarPagamentoDTO) {
    if (!data.pedidoId) {
      throw new Error("O pedido é obrigatório.");
    }

    const pedidoId = String(data.pedidoId);
    const pedido = await this.pagamentosRepository.buscarPedidoPorId(pedidoId);

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

    return this.pagamentosRepository.criarPagamento({
      pedidoId,
      metodo,
      valor: pedido.total,
    });
  }

  async listar() {
    return this.pagamentosRepository.listarPagamentos();
  }

  async buscarPorId(data: BuscarPagamentoPorIdDTO) {
    const pagamento = await this.pagamentosRepository.buscarPagamentoPorId(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    return pagamento;
  }

  async aprovar(data: AprovarPagamentoDTO) {
    const pagamento =
      await this.pagamentosRepository.buscarPagamentoParaAprovacao(data.id);

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    this.regraAprovacaoPagamento.validar(pagamento);

    return this.pagamentosRepository.executarTransacao(async (tx) => {
      const pagamentoAprovado =
        await this.pagamentosRepository.marcarPagamentoComoAprovado(
          data.id,
          tx
        );
      const pedidoAtualizado =
        await this.pagamentosRepository.atualizarStatusPedido(
          pagamento.pedidoId,
          StatusPedido.PAGO,
          tx
        );

      await this.processadorEstoquePagamento.baixarEstoque(
        pagamento.pedido.itens,
        pagamento.pedidoId,
        tx
      );

      return {
        pagamento: pagamentoAprovado,
        pedido: pedidoAtualizado,
      };
    });
  }

  async recusar(data: RecusarPagamentoDTO) {
    const pagamento = await this.pagamentosRepository.buscarPagamentoComPedido(
      data.id
    );

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    this.regraRecusaPagamento.validar(pagamento);

    return this.pagamentosRepository.atualizarStatusPagamento(
      data.id,
      StatusPagamento.RECUSADO
    );
  }

  async cancelar(data: CancelarPagamentoDTO) {
    const pagamento =
      await this.pagamentosRepository.buscarPagamentoSimplesPorId(data.id);

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    this.regraCancelamentoPagamento.validar(pagamento);

    return this.pagamentosRepository.atualizarStatusPagamento(
      data.id,
      StatusPagamento.CANCELADO
    );
  }

  async reembolsar(data: ReembolsarPagamentoDTO) {
    const pagamento =
      await this.pagamentosRepository.buscarPagamentoParaReembolso(data.id);

    if (!pagamento) {
      throw new Error("Pagamento não encontrado.");
    }

    this.regraReembolsoPagamento.validar(pagamento);

    return this.pagamentosRepository.executarTransacao(async (tx) => {
      const pagamentoReembolsado =
        await this.pagamentosRepository.marcarPagamentoComoReembolsado(
          data.id,
          tx
        );
      const pedidoReembolsado =
        await this.pagamentosRepository.atualizarStatusPedido(
          pagamento.pedidoId,
          StatusPedido.REEMBOLSADO,
          tx
        );

      await this.processadorEstoquePagamento.devolverEstoque(
        pagamento.pedido.itens,
        pagamento.pedidoId,
        tx
      );

      return {
        pagamento: pagamentoReembolsado,
        pedido: pedidoReembolsado,
      };
    });
  }
}

const validadorMetodoPagamento = new ValidadorMetodoPagamentoPadrao();
const regraAprovacaoPagamento = new RegraAprovacaoPagamentoPadrao();
const regraRecusaPagamento = new RegraRecusaPagamentoPadrao();
const regraCancelamentoPagamento = new RegraCancelamentoPagamentoPadrao();
const regraReembolsoPagamento = new RegraReembolsoPagamentoPadrao();
const processadorEstoquePagamento = new ProcessadorEstoquePagamentoPadrao(
  pagamentosRepository
);

export const pagamentosService = new PagamentosService(
  pagamentosRepository,
  validadorMetodoPagamento,
  regraAprovacaoPagamento,
  regraRecusaPagamento,
  regraCancelamentoPagamento,
  regraReembolsoPagamento,
  processadorEstoquePagamento
);
