import { TipoDescontoCupom } from "../generated/prisma/enums";
import {
  AplicarCupomDTO,
  AtivarCupomDTO,
  AtualizarCupomDTO,
  BuscarCupomPorCodigoDTO,
  BuscarCupomPorIdDTO,
  CriarCupomDTO,
  DesativarCupomDTO,
  RemoverCupomDTO,
} from "../models/cupom.model";
import { cuponsRepository } from "../repositories/cupons.repository";

export interface DadosCupomValidados {
  codigo: string;
  tipoDesconto: TipoDescontoCupom;
  valorDesconto: number;
  valorMinimoPedido: number | null;
  limiteUso: number | null;
  iniciaEm: Date | null;
  expiraEm: Date | null;
}

interface CupomAplicavel {
  ativo: boolean;
  iniciaEm?: Date | null;
  expiraEm?: Date | null;
  limiteUso: number | null;
  quantidadeUsada: number;
  valorMinimoPedido: unknown | null;
}

interface CupomComDesconto extends CupomAplicavel {
  id: string;
  tipoDesconto: TipoDescontoCupom;
  valorDesconto: unknown;
}

export interface IEscritaCuponsRepository {
  criarCupom(data: DadosCupomValidados): Promise<CupomComDesconto>;
  atualizarCupom(
    id: string,
    data: DadosCupomValidados
  ): Promise<CupomComDesconto>;
}

export interface ILeituraCuponsRepository {
  listarCupons(): Promise<CupomComDesconto[]>;
  buscarCupomPorId(id: string): Promise<CupomComDesconto | null>;
  buscarCupomPorCodigo(codigo: string): Promise<CupomComDesconto | null>;
}

export interface IStatusCuponsRepository {
  atualizarStatusCupom(
    id: string,
    ativo: boolean
  ): Promise<CupomComDesconto>;
}

export interface ICuponsRepository
  extends IEscritaCuponsRepository,
    ILeituraCuponsRepository,
    IStatusCuponsRepository {}

interface ValoresAplicacaoCupom {
  subtotal: number;
  frete: number;
}

interface ResultadoCalculoCupom {
  desconto: number;
  freteFinal: number;
}

export interface INormalizadorCodigoCupom {
  normalizar(codigo: unknown): string;
}

export interface IValidadorDadosCupom {
  validar(data: CriarCupomDTO): DadosCupomValidados;
}

export interface IValidadorValoresAplicacaoCupom {
  validar(data: AplicarCupomDTO): ValoresAplicacaoCupom;
}

export interface IRegraAplicacaoCupom {
  validar(cupom: CupomAplicavel, valores: ValoresAplicacaoCupom): void;
}

export interface ICalculadoraDescontoCupom {
  calcular(cupom: CupomComDesconto, valores: ValoresAplicacaoCupom): ResultadoCalculoCupom;
}

export interface ICalculadorasDescontoCupom {
  obter(tipoDesconto: TipoDescontoCupom): ICalculadoraDescontoCupom;
}

export interface IRegraStatusCupom {
  validarAtivacao(cupom: { ativo: boolean }): void;
  validarDesativacao(cupom: { ativo: boolean }): void;
}

export class NormalizadorCodigoCupomPadrao implements INormalizadorCodigoCupom {
  normalizar(codigo: unknown) {
    if (!codigo) {
      throw new Error("O código do cupom é obrigatório.");
    }

    if (typeof codigo !== "string") {
      throw new Error("O código do cupom deve ser um texto.");
    }

    if (codigo.trim().length < 3) {
      throw new Error("O código do cupom deve ter pelo menos 3 caracteres.");
    }

    return codigo.trim().toUpperCase();
  }
}

export class ValidadorDadosCupomPadrao implements IValidadorDadosCupom {
  constructor(private normalizadorCodigoCupom: INormalizadorCodigoCupom) {}

  private validarTipoDesconto(tipoDesconto: unknown) {
    if (!tipoDesconto) {
      throw new Error("O tipo de desconto é obrigatório.");
    }

    const tipoDescontoFormatado = String(tipoDesconto).toUpperCase();
    const tiposPermitidos = Object.values(TipoDescontoCupom);

    if (!tiposPermitidos.includes(tipoDescontoFormatado as TipoDescontoCupom)) {
      throw new Error(
        "Tipo de desconto inválido. Use PERCENTUAL, VALOR_FIXO ou FRETE_GRATIS."
      );
    }

    return tipoDescontoFormatado as TipoDescontoCupom;
  }

  private validarValorDesconto(
    valorDesconto: unknown,
    tipoDesconto: TipoDescontoCupom
  ) {
    const valorDescontoNumber = Number(valorDesconto ?? 0);

    if (Number.isNaN(valorDescontoNumber)) {
      throw new Error("O valor do desconto deve ser um número válido.");
    }

    if (
      tipoDesconto !== TipoDescontoCupom.FRETE_GRATIS &&
      valorDescontoNumber <= 0
    ) {
      throw new Error("O valor do desconto deve ser maior que zero.");
    }

    if (
      tipoDesconto === TipoDescontoCupom.PERCENTUAL &&
      valorDescontoNumber > 70
    ) {
      throw new Error("Cupom percentual não pode passar de 70%.");
    }

    return tipoDesconto === TipoDescontoCupom.FRETE_GRATIS
      ? 0
      : valorDescontoNumber;
  }

  private validarValorMinimoPedido(valorMinimoPedido: unknown) {
    const valorMinimoPedidoNumber =
      valorMinimoPedido === undefined || valorMinimoPedido === null
        ? null
        : Number(valorMinimoPedido);

    if (
      valorMinimoPedidoNumber !== null &&
      Number.isNaN(valorMinimoPedidoNumber)
    ) {
      throw new Error("O valor mínimo do pedido deve ser um número válido.");
    }

    if (valorMinimoPedidoNumber !== null && valorMinimoPedidoNumber < 0) {
      throw new Error("O valor mínimo do pedido não pode ser negativo.");
    }

    return valorMinimoPedidoNumber;
  }

  private validarLimiteUso(limiteUso: unknown) {
    const limiteUsoNumber =
      limiteUso === undefined || limiteUso === null ? null : Number(limiteUso);

    if (limiteUsoNumber !== null && !Number.isInteger(limiteUsoNumber)) {
      throw new Error("O limite de uso deve ser um número inteiro.");
    }

    if (limiteUsoNumber !== null && limiteUsoNumber <= 0) {
      throw new Error("O limite de uso deve ser maior que zero.");
    }

    return limiteUsoNumber;
  }

  private converterData(data: Date | string | null | undefined) {
    return data ? new Date(data) : null;
  }

  validar(data: CriarCupomDTO) {
    const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
    const tipoDesconto = this.validarTipoDesconto(data.tipoDesconto);
    const valorDesconto = this.validarValorDesconto(
      data.valorDesconto,
      tipoDesconto
    );
    const valorMinimoPedido = this.validarValorMinimoPedido(
      data.valorMinimoPedido
    );
    const limiteUso = this.validarLimiteUso(data.limiteUso);

    return {
      codigo,
      tipoDesconto,
      valorDesconto,
      valorMinimoPedido,
      limiteUso,
      iniciaEm: this.converterData(data.iniciaEm),
      expiraEm: this.converterData(data.expiraEm),
    };
  }
}

export class ValidadorValoresAplicacaoCupomPadrao
  implements IValidadorValoresAplicacaoCupom
{
  validar(data: AplicarCupomDTO) {
    const subtotal = Number(data.subtotal);

    if (Number.isNaN(subtotal) || subtotal <= 0) {
      throw new Error("Subtotal inválido.");
    }

    const frete = Number(data.frete ?? 0);

    if (Number.isNaN(frete) || frete < 0) {
      throw new Error("Frete inválido.");
    }

    return {
      subtotal,
      frete,
    };
  }
}

export class RegraAplicacaoCupomPadrao implements IRegraAplicacaoCupom {
  private cupomEstaVencido(expiraEm?: Date | null) {
    if (!expiraEm) {
      return false;
    }

    return new Date() > new Date(expiraEm);
  }

  private cupomAindaNaoIniciou(iniciaEm?: Date | null) {
    if (!iniciaEm) {
      return false;
    }

    return new Date() < new Date(iniciaEm);
  }

  validar(cupom: CupomAplicavel, valores: ValoresAplicacaoCupom) {
    if (!cupom.ativo) {
      throw new Error("Cupom inativo.");
    }

    if (this.cupomAindaNaoIniciou(cupom.iniciaEm)) {
      throw new Error("Cupom ainda não está disponível.");
    }

    if (this.cupomEstaVencido(cupom.expiraEm)) {
      throw new Error("Cupom vencido.");
    }

    if (cupom.limiteUso !== null && cupom.quantidadeUsada >= cupom.limiteUso) {
      throw new Error("Cupom atingiu o limite máximo de uso.");
    }

    if (
      cupom.valorMinimoPedido !== null &&
      valores.subtotal < Number(cupom.valorMinimoPedido)
    ) {
      throw new Error("Subtotal menor que o valor mínimo exigido pelo cupom.");
    }
  }
}

export class CalculadoraCupomPercentual implements ICalculadoraDescontoCupom {
  calcular(cupom: CupomComDesconto, valores: ValoresAplicacaoCupom) {
    const desconto = valores.subtotal * (Number(cupom.valorDesconto) / 100);

    return {
      desconto: Math.min(desconto, valores.subtotal),
      freteFinal: valores.frete,
    };
  }
}

export class CalculadoraCupomValorFixo implements ICalculadoraDescontoCupom {
  calcular(cupom: CupomComDesconto, valores: ValoresAplicacaoCupom) {
    const desconto = Number(cupom.valorDesconto);

    return {
      desconto: Math.min(desconto, valores.subtotal),
      freteFinal: valores.frete,
    };
  }
}

export class CalculadoraCupomFreteGratis implements ICalculadoraDescontoCupom {
  calcular(_cupom: CupomComDesconto, _valores: ValoresAplicacaoCupom) {
    return {
      desconto: 0,
      freteFinal: 0,
    };
  }
}

export class CalculadorasDescontoCupomPadrao
  implements ICalculadorasDescontoCupom
{
  private calculadoras = new Map<TipoDescontoCupom, ICalculadoraDescontoCupom>([
    [TipoDescontoCupom.PERCENTUAL, new CalculadoraCupomPercentual()],
    [TipoDescontoCupom.VALOR_FIXO, new CalculadoraCupomValorFixo()],
    [TipoDescontoCupom.FRETE_GRATIS, new CalculadoraCupomFreteGratis()],
  ]);

  obter(tipoDesconto: TipoDescontoCupom) {
    const calculadora = this.calculadoras.get(tipoDesconto);

    if (!calculadora) {
      throw new Error("Tipo de desconto sem calculadora configurada.");
    }

    return calculadora;
  }
}

export class RegraStatusCupomPadrao implements IRegraStatusCupom {
  validarAtivacao(cupom: { ativo: boolean }) {
    if (cupom.ativo) {
      throw new Error("Cupom já está ativo.");
    }
  }

  validarDesativacao(cupom: { ativo: boolean }) {
    if (!cupom.ativo) {
      throw new Error("Cupom já está desativado.");
    }
  }
}

export class CuponsService {
  constructor(
    private leituraCuponsRepository: ILeituraCuponsRepository,
    private escritaCuponsRepository: IEscritaCuponsRepository,
    private statusCuponsRepository: IStatusCuponsRepository,
    private normalizadorCodigoCupom: INormalizadorCodigoCupom,
    private validadorDadosCupom: IValidadorDadosCupom,
    private validadorValoresAplicacaoCupom: IValidadorValoresAplicacaoCupom,
    private regraAplicacaoCupom: IRegraAplicacaoCupom,
    private calculadorasDescontoCupom: ICalculadorasDescontoCupom,
    private regraStatusCupom: IRegraStatusCupom
  ) {}

  async criar(data: CriarCupomDTO) {
    const dadosCupom = this.validadorDadosCupom.validar(data);

    const cupomExistente =
      await this.leituraCuponsRepository.buscarCupomPorCodigo(
        dadosCupom.codigo
      );

    if (cupomExistente) {
      throw new Error("Já existe um cupom com esse código.");
    }

    return this.escritaCuponsRepository.criarCupom(dadosCupom);
  }

  async listar() {
    return this.leituraCuponsRepository.listarCupons();
  }

  async buscarPorCodigo(data: BuscarCupomPorCodigoDTO) {
    const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
    const cupom =
      await this.leituraCuponsRepository.buscarCupomPorCodigo(codigo);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    return cupom;
  }

  async buscarPorId(data: BuscarCupomPorIdDTO) {
    const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    return cupom;
  }

  async aplicar(data: AplicarCupomDTO) {
    const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
    const cupom =
      await this.leituraCuponsRepository.buscarCupomPorCodigo(codigo);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    const valores = this.validadorValoresAplicacaoCupom.validar(data);
    this.regraAplicacaoCupom.validar(cupom, valores);
    const calculadora = this.calculadorasDescontoCupom.obter(
      cupom.tipoDesconto
    );
    const { desconto, freteFinal } = calculadora.calcular(cupom, valores);
    const total = valores.subtotal - desconto + freteFinal;

    return {
      cupom,
      subtotal: Number(valores.subtotal.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      freteOriginal: Number(valores.frete.toFixed(2)),
      freteFinal: Number(freteFinal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async atualizar(data: AtualizarCupomDTO) {
    const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    const dadosCupom = this.validadorDadosCupom.validar(data);

    const cupomComMesmoCodigo =
      await this.leituraCuponsRepository.buscarCupomPorCodigo(
        dadosCupom.codigo
      );

    if (cupomComMesmoCodigo && cupomComMesmoCodigo.id !== data.id) {
      throw new Error("Já existe outro cupom com esse código.");
    }

    return this.escritaCuponsRepository.atualizarCupom(data.id, dadosCupom);
  }

  async ativar(data: AtivarCupomDTO) {
    const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    this.regraStatusCupom.validarAtivacao(cupom);

    return this.statusCuponsRepository.atualizarStatusCupom(data.id, true);
  }

  async desativar(data: DesativarCupomDTO) {
    const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    this.regraStatusCupom.validarDesativacao(cupom);

    return this.statusCuponsRepository.atualizarStatusCupom(data.id, false);
  }

  async remover(data: RemoverCupomDTO) {
    const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    const cupomRemovido = await this.statusCuponsRepository.atualizarStatusCupom(
      data.id,
      false
    );

    return {
      message: "Cupom removido com sucesso.",
      cupom: cupomRemovido,
    };
  }
}

const normalizadorCodigoCupom = new NormalizadorCodigoCupomPadrao();
const validadorDadosCupom = new ValidadorDadosCupomPadrao(
  normalizadorCodigoCupom
);
const validadorValoresAplicacaoCupom =
  new ValidadorValoresAplicacaoCupomPadrao();
const regraAplicacaoCupom = new RegraAplicacaoCupomPadrao();
const calculadorasDescontoCupom = new CalculadorasDescontoCupomPadrao();
const regraStatusCupom = new RegraStatusCupomPadrao();

export const cuponsService = new CuponsService(
  cuponsRepository,
  cuponsRepository,
  cuponsRepository,
  normalizadorCodigoCupom,
  validadorDadosCupom,
  validadorValoresAplicacaoCupom,
  regraAplicacaoCupom,
  calculadorasDescontoCupom,
  regraStatusCupom
);
