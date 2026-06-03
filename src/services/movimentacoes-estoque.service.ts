import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";
import {
  BuscarMovimentacaoEstoquePorIdDTO,
  CriarMovimentacaoEstoqueDTO,
  ListarMovimentacoesEstoquePorVariacaoDTO,
} from "../models/movimentacao-estoque.model";
import { movimentacoesEstoqueRepository } from "../repositories/movimentacoes-estoque.repository";

interface VariacaoMovimentacaoEstoqueRepository {
  ativo: boolean;
  estoque: number;
}

export interface ITransacaoMovimentacoesEstoqueRepository {
  executarTransacao<T>(operacao: (tx: any) => Promise<T>): Promise<T>;
}

export interface IConsultaVariacaoMovimentacaoEstoqueRepository {
  buscarVariacaoPorId(
    variacaoId: string
  ): Promise<VariacaoMovimentacaoEstoqueRepository | null>;
}

export interface IEscritaMovimentacoesEstoqueRepository {
  criarMovimentacaoEstoque(
    data: {
      variacaoId: string;
      tipo: TipoMovimentacaoEstoque;
      quantidade: number;
      motivo?: string | null;
    },
    tx?: any
  ): Promise<unknown>;
}

export interface IEstoqueVariacaoMovimentacaoRepository {
  atualizarEstoqueVariacao(
    variacaoId: string,
    novoEstoque: number,
    tx?: any
  ): Promise<unknown>;
}

export interface ILeituraMovimentacoesEstoqueRepository {
  listarMovimentacoes(): Promise<unknown[]>;
  listarMovimentacoesPorVariacao(variacaoId: string): Promise<unknown[]>;
  buscarMovimentacaoPorId(id: string): Promise<unknown | null>;
}

export interface IMovimentacoesEstoqueRepository
  extends ITransacaoMovimentacoesEstoqueRepository,
    IConsultaVariacaoMovimentacaoEstoqueRepository,
    IEscritaMovimentacoesEstoqueRepository,
    IEstoqueVariacaoMovimentacaoRepository,
    ILeituraMovimentacoesEstoqueRepository {}

export interface IValidadorTipoMovimentacaoEstoque {
  validar(tipo: unknown): TipoMovimentacaoEstoque;
}

export interface IValidadorQuantidadeMovimentacaoEstoque {
  validar(quantidade: unknown): number;
}

export interface ICalculadoraMovimentacaoEstoque {
  calcular(estoqueAtual: number, quantidade: number): number;
}

export interface ICalculadorasMovimentacaoEstoque {
  obter(tipo: TipoMovimentacaoEstoque): ICalculadoraMovimentacaoEstoque;
}

export class ValidadorTipoMovimentacaoEstoquePadrao
  implements IValidadorTipoMovimentacaoEstoque
{
  validar(tipo: unknown) {
    if (!tipo) {
      throw new Error("O tipo da movimentação é obrigatório.");
    }

    const tipoFormatado = String(tipo).toUpperCase();
    const tiposPermitidos = Object.values(TipoMovimentacaoEstoque);

    if (!tiposPermitidos.includes(tipoFormatado as TipoMovimentacaoEstoque)) {
      throw new Error(
        "Tipo de movimentação inválido. Use ENTRADA, SAIDA, AJUSTE, VENDA ou DEVOLUCAO_CANCELAMENTO."
      );
    }

    return tipoFormatado as TipoMovimentacaoEstoque;
  }
}

export class ValidadorQuantidadeMovimentacaoEstoquePadrao
  implements IValidadorQuantidadeMovimentacaoEstoque
{
  validar(quantidade: unknown) {
    if (quantidade === undefined || quantidade === null) {
      throw new Error("A quantidade é obrigatória.");
    }

    const quantidadeNumber = Number(quantidade);

    if (Number.isNaN(quantidadeNumber)) {
      throw new Error("A quantidade deve ser um número válido.");
    }

    if (!Number.isInteger(quantidadeNumber)) {
      throw new Error("A quantidade deve ser um número inteiro.");
    }

    if (quantidadeNumber <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    return quantidadeNumber;
  }
}

export class CalculadoraEntradaEstoque implements ICalculadoraMovimentacaoEstoque {
  calcular(estoqueAtual: number, quantidade: number) {
    return estoqueAtual + quantidade;
  }
}

export class CalculadoraSaidaEstoque implements ICalculadoraMovimentacaoEstoque {
  calcular(estoqueAtual: number, quantidade: number) {
    return estoqueAtual - quantidade;
  }
}

export class CalculadoraAjusteEstoque implements ICalculadoraMovimentacaoEstoque {
  calcular(_estoqueAtual: number, quantidade: number) {
    return quantidade;
  }
}

export class CalculadorasMovimentacaoEstoquePadrao
  implements ICalculadorasMovimentacaoEstoque
{
  private calculadoras = new Map<
    TipoMovimentacaoEstoque,
    ICalculadoraMovimentacaoEstoque
  >([
    [TipoMovimentacaoEstoque.ENTRADA, new CalculadoraEntradaEstoque()],
    [
      TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO,
      new CalculadoraEntradaEstoque(),
    ],
    [TipoMovimentacaoEstoque.SAIDA, new CalculadoraSaidaEstoque()],
    [TipoMovimentacaoEstoque.VENDA, new CalculadoraSaidaEstoque()],
    [TipoMovimentacaoEstoque.AJUSTE, new CalculadoraAjusteEstoque()],
  ]);

  obter(tipo: TipoMovimentacaoEstoque) {
    const calculadora = this.calculadoras.get(tipo);

    if (!calculadora) {
      throw new Error("Tipo de movimentação sem calculadora configurada.");
    }

    return calculadora;
  }
}

export class MovimentacoesEstoqueService {
  constructor(
    private transacaoMovimentacoesEstoqueRepository: ITransacaoMovimentacoesEstoqueRepository,
    private consultaVariacaoMovimentacaoEstoqueRepository: IConsultaVariacaoMovimentacaoEstoqueRepository,
    private escritaMovimentacoesEstoqueRepository: IEscritaMovimentacoesEstoqueRepository,
    private estoqueVariacaoMovimentacaoRepository: IEstoqueVariacaoMovimentacaoRepository,
    private leituraMovimentacoesEstoqueRepository: ILeituraMovimentacoesEstoqueRepository,
    private validadorTipoMovimentacaoEstoque: IValidadorTipoMovimentacaoEstoque,
    private validadorQuantidadeMovimentacaoEstoque: IValidadorQuantidadeMovimentacaoEstoque,
    private calculadorasMovimentacaoEstoque: ICalculadorasMovimentacaoEstoque
  ) {}

  async criar(data: CriarMovimentacaoEstoqueDTO) {
    if (!data.variacaoId) {
      throw new Error("A variação do produto é obrigatória.");
    }

    const variacaoId = String(data.variacaoId);
    const variacao =
      await this.consultaVariacaoMovimentacaoEstoqueRepository.buscarVariacaoPorId(
        variacaoId
      );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    if (!variacao.ativo) {
      throw new Error(
        "Não é possível movimentar estoque de uma variação inativa."
      );
    }

    const tipo = this.validadorTipoMovimentacaoEstoque.validar(data.tipo);
    const quantidade = this.validadorQuantidadeMovimentacaoEstoque.validar(
      data.quantidade
    );
    const calculadora = this.calculadorasMovimentacaoEstoque.obter(tipo);
    const novoEstoque = calculadora.calcular(
      variacao.estoque,
      quantidade
    );

    if (novoEstoque < 0) {
      throw new Error("A movimentação deixaria o estoque negativo.");
    }

    return this.transacaoMovimentacoesEstoqueRepository.executarTransacao(async (tx) => {
      const movimentacao =
        await this.escritaMovimentacoesEstoqueRepository.criarMovimentacaoEstoque(
          {
            variacaoId,
            tipo,
            quantidade,
            motivo: data.motivo,
          },
          tx
        );

      const variacao =
        await this.estoqueVariacaoMovimentacaoRepository.atualizarEstoqueVariacao(
          variacaoId,
          novoEstoque,
          tx
        );

      return {
        movimentacao,
        variacao,
      };
    });
  }

  async listar() {
    return this.leituraMovimentacoesEstoqueRepository.listarMovimentacoes();
  }

  async listarPorVariacao(data: ListarMovimentacoesEstoquePorVariacaoDTO) {
    const variacao =
      await this.consultaVariacaoMovimentacaoEstoqueRepository.buscarVariacaoPorId(
        data.variacaoId
      );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    return this.leituraMovimentacoesEstoqueRepository.listarMovimentacoesPorVariacao(
      data.variacaoId
    );
  }

  async buscarPorId(data: BuscarMovimentacaoEstoquePorIdDTO) {
    const movimentacao =
      await this.leituraMovimentacoesEstoqueRepository.buscarMovimentacaoPorId(
        data.id
      );

    if (!movimentacao) {
      throw new Error("Movimentação de estoque não encontrada.");
    }

    return movimentacao;
  }
}

const validadorTipoMovimentacaoEstoque =
  new ValidadorTipoMovimentacaoEstoquePadrao();
const validadorQuantidadeMovimentacaoEstoque =
  new ValidadorQuantidadeMovimentacaoEstoquePadrao();
const calculadorasMovimentacaoEstoque =
  new CalculadorasMovimentacaoEstoquePadrao();

export const movimentacoesEstoqueService = new MovimentacoesEstoqueService(
  movimentacoesEstoqueRepository,
  movimentacoesEstoqueRepository,
  movimentacoesEstoqueRepository,
  movimentacoesEstoqueRepository,
  movimentacoesEstoqueRepository,
  validadorTipoMovimentacaoEstoque,
  validadorQuantidadeMovimentacaoEstoque,
  calculadorasMovimentacaoEstoque
);
