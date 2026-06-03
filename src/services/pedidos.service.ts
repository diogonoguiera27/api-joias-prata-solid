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
  produtoId: string;
  variacaoId: string;
  quantidade: number;
  precoUnitario: unknown;
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

interface CarrinhoParaPedidoRepository {
  id: string;
  clienteId: string | null;
  status: StatusCarrinho;
  itens: ItemCarrinhoParaPedido[];
}

interface CriarPedidoRepositoryDTO {
  clienteId: string | null;
  subtotal: number;
  totalDesconto: number;
  totalFrete: number;
  total: number;
  status: StatusPedido;
  itens: Array<{
    produtoId: string;
    variacaoId: string;
    nomeProduto: string;
    quantidade: number;
    precoUnitario: unknown;
    subtotal: unknown;
  }>;
}

interface TotaisPedido {
  subtotal: number;
  totalDesconto: number;
  totalFrete: number;
  total: number;
}

export interface ITransacaoPedidosRepository {
  executarTransacao<T>(operacao: (tx: any) => Promise<T>): Promise<T>;
}

export interface IConsultaCriacaoPedidosRepository {
  buscarCarrinhoPorId(
    carrinhoId: string
  ): Promise<CarrinhoParaPedidoRepository | null>;
  buscarClientePorId(clienteId: string): Promise<unknown | null>;
}

export interface IEscritaPedidosRepository {
  criarPedido(data: CriarPedidoRepositoryDTO, tx?: any): Promise<unknown>;
  atualizarCarrinhoAposCriacaoPedido(
    carrinhoId: string,
    data: {
      status: StatusCarrinho;
      clienteId: string | null;
    },
    tx?: any
  ): Promise<unknown>;
}

export interface ILeituraPedidosRepository {
  listarPedidos(): Promise<unknown[]>;
  buscarPedidoPorId(id: string): Promise<unknown | null>;
  buscarPedidoComPagamentoPorId(
    id: string
  ): Promise<PedidoComPagamento | null>;
  buscarPedidoSimplesPorId(id: string): Promise<PedidoSimples | null>;
}

export interface IStatusPedidosRepository {
  atualizarStatusPedido(
    id: string,
    status: StatusPedido,
    tx?: any
  ): Promise<unknown>;
}

export interface IPedidosRepository
  extends ITransacaoPedidosRepository,
    IConsultaCriacaoPedidosRepository,
    IEscritaPedidosRepository,
    ILeituraPedidosRepository,
    IStatusPedidosRepository {}

export interface ICalculadoraTotaisPedido {
  calcular(itens: { subtotal: unknown }[]): TotaisPedido;
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

export interface IRegraCriacaoPedido {
  validarCarrinho(carrinho: CarrinhoParaPedidoRepository): void;
}

export interface IMontadorDadosPedido {
  montar(
    carrinho: CarrinhoParaPedidoRepository,
    clienteId: string | null,
    totais: TotaisPedido
  ): CriarPedidoRepositoryDTO;
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

export class RegraCriacaoPedidoPadrao implements IRegraCriacaoPedido {
  validarCarrinho(carrinho: CarrinhoParaPedidoRepository) {
    if (carrinho.status !== StatusCarrinho.ATIVO) {
      throw new Error("Somente carrinho ativo pode ser convertido em pedido.");
    }

    if (carrinho.itens.length === 0) {
      throw new Error("Não é possível criar pedido com carrinho vazio.");
    }
  }
}

export class MontadorDadosPedidoPadrao implements IMontadorDadosPedido {
  montar(
    carrinho: CarrinhoParaPedidoRepository,
    clienteId: string | null,
    totais: TotaisPedido
  ) {
    return {
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
    private transacaoPedidosRepository: ITransacaoPedidosRepository,
    private consultaCriacaoPedidosRepository: IConsultaCriacaoPedidosRepository,
    private escritaPedidosRepository: IEscritaPedidosRepository,
    private leituraPedidosRepository: ILeituraPedidosRepository,
    private statusPedidosRepository: IStatusPedidosRepository,
    private calculadoraTotaisPedido: ICalculadoraTotaisPedido,
    private validadorStatusPedido: IValidadorStatusPedido,
    private validadorItensPedido: IValidadorItensPedido,
    private regraAtualizacaoStatusPedido: IRegraAtualizacaoStatusPedido,
    private regraCancelamentoPedido: IRegraCancelamentoPedido,
    private regraCriacaoPedido: IRegraCriacaoPedido,
    private montadorDadosPedido: IMontadorDadosPedido
  ) {}

  async criar(data: CriarPedidoDTO) {
    if (!data.carrinhoId) {
      throw new Error("O carrinho é obrigatório para criar o pedido.");
    }

    const carrinho = await this.consultaCriacaoPedidosRepository.buscarCarrinhoPorId(
      String(data.carrinhoId)
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCriacaoPedido.validarCarrinho(carrinho);

    let clienteId = carrinho.clienteId;

    if (data.clienteId) {
      const cliente = await this.consultaCriacaoPedidosRepository.buscarClientePorId(
        String(data.clienteId)
      );

      if (!cliente) {
        throw new Error("Cliente informado não encontrado.");
      }

      clienteId = String(data.clienteId);
    }

    this.validadorItensPedido.validar(carrinho.itens);

    const totais = this.calculadoraTotaisPedido.calcular(carrinho.itens);
    const dadosPedido = this.montadorDadosPedido.montar(
      carrinho,
      clienteId,
      totais
    );

    return this.transacaoPedidosRepository.executarTransacao(async (tx) => {
      const pedido = await this.escritaPedidosRepository.criarPedido(
        dadosPedido,
        tx
      );

      const carrinhoAtualizado =
        await this.escritaPedidosRepository.atualizarCarrinhoAposCriacaoPedido(
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
    return this.leituraPedidosRepository.listarPedidos();
  }

  async buscarPorId(data: BuscarPedidoPorIdDTO) {
    const pedido = await this.leituraPedidosRepository.buscarPedidoPorId(
      data.id
    );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    return pedido;
  }

  async atualizarStatus(data: AtualizarStatusPedidoDTO) {
    const pedido =
      await this.leituraPedidosRepository.buscarPedidoComPagamentoPorId(
        data.id
      );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    const status = this.validadorStatusPedido.validar(data.status);
    this.regraAtualizacaoStatusPedido.validar(pedido, status);

    return this.statusPedidosRepository.atualizarStatusPedido(data.id, status);
  }

  async cancelar(data: CancelarPedidoDTO) {
    const pedido = await this.leituraPedidosRepository.buscarPedidoSimplesPorId(
      data.id
    );

    if (!pedido) {
      throw new Error("Pedido não encontrado.");
    }

    this.regraCancelamentoPedido.validar(pedido);

    return this.statusPedidosRepository.atualizarStatusPedido(
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
const regraCriacaoPedido = new RegraCriacaoPedidoPadrao();
const montadorDadosPedido = new MontadorDadosPedidoPadrao();

export const pedidosService = new PedidosService(
  pedidosRepository,
  pedidosRepository,
  pedidosRepository,
  pedidosRepository,
  pedidosRepository,
  calculadoraTotaisPedido,
  validadorStatusPedido,
  validadorItensPedido,
  regraAtualizacaoStatusPedido,
  regraCancelamentoPedido,
  regraCriacaoPedido,
  montadorDadosPedido
);
