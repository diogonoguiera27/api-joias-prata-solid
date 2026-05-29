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

type PedidosRepository = typeof pedidosRepository;

interface PedidoComPagamento {
  status: StatusPedido;
  pagamento?: {
    status: StatusPagamento;
  } | null;
}

interface PedidoSimples {
  status: StatusPedido;
}

interface ItemCarrinhoParaPedido {
  quantidade: number;
  subtotal: unknown;
  produto: {
    nome: string;
    ativo: boolean;
  };
  variacao: {
    nome: string;
    ativo: boolean;
    estoque: number;
  };
}

export interface ICalculadoraTotaisPedido {
  calcular(itens: { subtotal: unknown }[]): {
    subtotal: number;
    totalDesconto: number;
    totalFrete: number;
    total: number;
  };
}

export interface IValidadorStatusPedido {
  validar(status: unknown): StatusPedido;
}

export interface IValidadorItensPedido {
  validar(itens: ItemCarrinhoParaPedido[]): void;
}

export interface IRegraAtualizacaoStatusPedido {
  validar(pedido: PedidoComPagamento, novoStatus: StatusPedido): void;
}

export interface IRegraCancelamentoPedido {
  validar(pedido: PedidoSimples): void;
}

export class CalculadoraTotaisPedidoPadrao implements ICalculadoraTotaisPedido {
  calcular(itens: { subtotal: unknown }[]) {
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
}

export class ValidadorStatusPedidoPadrao implements IValidadorStatusPedido {
  validar(status: unknown) {
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
}

export class ValidadorItensPedidoPadrao implements IValidadorItensPedido {
  validar(itens: ItemCarrinhoParaPedido[]) {
    for (const item of itens) {
      if (!item.produto.ativo) {
        throw new Error(`Produto ${item.produto.nome} está inativo.`);
      }

      if (!item.variacao.ativo) {
        throw new Error(`Variação ${item.variacao.nome} está inativa.`);
      }

      if (item.quantidade > item.variacao.estoque) {
        throw new Error(
          `Estoque insuficiente para o produto ${item.produto.nome}.`
        );
      }
    }
  }
}

export class RegraAtualizacaoStatusPedidoPadrao
  implements IRegraAtualizacaoStatusPedido
{
  validar(pedido: PedidoComPagamento, novoStatus: StatusPedido) {
    if (pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Pedido cancelado não pode ter status alterado.");
    }

    if (
      pedido.status === StatusPedido.ENTREGUE &&
      novoStatus === StatusPedido.CANCELADO
    ) {
      throw new Error("Pedido entregue não pode ser cancelado diretamente.");
    }

    if (
      novoStatus === StatusPedido.PAGO &&
      (!pedido.pagamento || pedido.pagamento.status !== StatusPagamento.APROVADO)
    ) {
      throw new Error(
        "O pedido só pode ser marcado como PAGO após pagamento aprovado."
      );
    }

    if (
      novoStatus === StatusPedido.ENVIADO &&
      pedido.status !== StatusPedido.EM_PREPARACAO
    ) {
      throw new Error("Pedido só pode ser enviado quando estiver em preparação.");
    }

    if (
      novoStatus === StatusPedido.ENTREGUE &&
      pedido.status !== StatusPedido.ENVIADO
    ) {
      throw new Error("Pedido só pode ser entregue após ser enviado.");
    }
  }
}

export class RegraCancelamentoPedidoPadrao implements IRegraCancelamentoPedido {
  validar(pedido: PedidoSimples) {
    if (pedido.status === StatusPedido.CANCELADO) {
      throw new Error("Pedido já está cancelado.");
    }

    if (pedido.status === StatusPedido.ENTREGUE) {
      throw new Error("Pedido entregue não pode ser cancelado diretamente.");
    }

    if (pedido.status === StatusPedido.ENVIADO) {
      throw new Error("Pedido enviado não pode ser cancelado diretamente.");
    }
  }
}

export class PedidosService {
  constructor(
    private pedidosRepository: PedidosRepository,
    private calculadoraTotaisPedido: ICalculadoraTotaisPedido,
    private validadorStatusPedido: IValidadorStatusPedido,
    private validadorItensPedido: IValidadorItensPedido,
    private regraAtualizacaoStatusPedido: IRegraAtualizacaoStatusPedido,
    private regraCancelamentoPedido: IRegraCancelamentoPedido
  ) {}

  async criar(data: CriarPedidoDTO) {
    if (!data.carrinhoId) {
      throw new Error("O carrinho é obrigatório para criar o pedido.");
    }

    const carrinho = await this.pedidosRepository.buscarCarrinhoPorId(
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
      const cliente = await this.pedidosRepository.buscarClientePorId(
        String(data.clienteId)
      );

      if (!cliente) {
        throw new Error("Cliente informado não encontrado.");
      }

      clienteId = String(data.clienteId);
    }

    this.validadorItensPedido.validar(carrinho.itens);

    const totais = this.calculadoraTotaisPedido.calcular(carrinho.itens);

    return this.pedidosRepository.executarTransacao(async (tx) => {
      const pedido = await this.pedidosRepository.criarPedido(
        {
          clienteId,
          ...totais,
          status: StatusPedido.PENDENTE_PAGAMENTO,
          itens: carrinho.itens.map((item) => ({
            produtoId: item.produtoId,
            variacaoId: item.variacaoId,
            nomeProduto: item.produto.nome,
            quantidade: item.quantidade,
            precoUnitario: item.precoUnitario,
            subtotal: item.subtotal,
          })),
        },
        tx
      );

      const carrinhoAtualizado =
        await this.pedidosRepository.atualizarCarrinhoAposCriacaoPedido(
          carrinho.id,
          {
            status: StatusCarrinho.CONVERTIDO_EM_PEDIDO,
            clienteId,
          },
          tx
        );

      return {
        pedido,
        carrinho: carrinhoAtualizado,
      };
    });
  }

  async listar() {
    return this.pedidosRepository.listarPedidos();
  }

  async buscarPorId(data: BuscarPedidoPorIdDTO) {
    const pedido = await this.pedidosRepository.buscarPedidoPorId(data.id);

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    return pedido;
  }

  async atualizarStatus(data: AtualizarStatusPedidoDTO) {
    const pedido = await this.pedidosRepository.buscarPedidoComPagamentoPorId(
      data.id
    );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    const status = this.validadorStatusPedido.validar(data.status);
    this.regraAtualizacaoStatusPedido.validar(pedido, status);

    return this.pedidosRepository.atualizarStatusPedido(data.id, status);
  }

  async cancelar(data: CancelarPedidoDTO) {
    const pedido = await this.pedidosRepository.buscarPedidoSimplesPorId(
      data.id
    );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    this.regraCancelamentoPedido.validar(pedido);

    return this.pedidosRepository.atualizarStatusPedido(
      data.id,
      StatusPedido.CANCELADO
    );
  }
}

const calculadoraTotaisPedido = new CalculadoraTotaisPedidoPadrao();
const validadorStatusPedido = new ValidadorStatusPedidoPadrao();
const validadorItensPedido = new ValidadorItensPedidoPadrao();
const regraAtualizacaoStatusPedido = new RegraAtualizacaoStatusPedidoPadrao();
const regraCancelamentoPedido = new RegraCancelamentoPedidoPadrao();

export const pedidosService = new PedidosService(
  pedidosRepository,
  calculadoraTotaisPedido,
  validadorStatusPedido,
  validadorItensPedido,
  regraAtualizacaoStatusPedido,
  regraCancelamentoPedido
);
