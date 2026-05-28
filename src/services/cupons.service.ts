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

class CuponsService {
  private normalizarCodigo(codigo: unknown) {
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

  private montarDadosCupom(data: CriarCupomDTO) {
    const codigo = this.normalizarCodigo(data.codigo);
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

  async criar(data: CriarCupomDTO) {
    const dadosCupom = this.montarDadosCupom(data);

    const cupomExistente = await cuponsRepository.buscarCupomPorCodigo(
      dadosCupom.codigo
    );

    if (cupomExistente) {
      throw new Error("Já existe um cupom com esse código.");
    }

    return cuponsRepository.criarCupom(dadosCupom);
  }

  async listar() {
    return cuponsRepository.listarCupons();
  }

  async buscarPorCodigo(data: BuscarCupomPorCodigoDTO) {
    const codigo = this.normalizarCodigo(data.codigo);
    const cupom = await cuponsRepository.buscarCupomPorCodigo(codigo);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    return cupom;
  }

  async buscarPorId(data: BuscarCupomPorIdDTO) {
    const cupom = await cuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    return cupom;
  }

  async aplicar(data: AplicarCupomDTO) {
    const codigo = this.normalizarCodigo(String(data.codigo));
    const cupom = await cuponsRepository.buscarCupomPorCodigo(codigo);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

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

    const subtotal = Number(data.subtotal);

    if (Number.isNaN(subtotal) || subtotal <= 0) {
      throw new Error("Subtotal inválido.");
    }

    const frete = Number(data.frete ?? 0);

    if (Number.isNaN(frete) || frete < 0) {
      throw new Error("Frete inválido.");
    }

    if (
      cupom.valorMinimoPedido !== null &&
      subtotal < Number(cupom.valorMinimoPedido)
    ) {
      throw new Error("Subtotal menor que o valor mínimo exigido pelo cupom.");
    }

    let desconto = 0;
    let freteFinal = frete;

    if (cupom.tipoDesconto === TipoDescontoCupom.PERCENTUAL) {
      desconto = subtotal * (Number(cupom.valorDesconto) / 100);
    }

    if (cupom.tipoDesconto === TipoDescontoCupom.VALOR_FIXO) {
      desconto = Number(cupom.valorDesconto);
    }

    if (cupom.tipoDesconto === TipoDescontoCupom.FRETE_GRATIS) {
      freteFinal = 0;
    }

    if (desconto > subtotal) {
      desconto = subtotal;
    }

    const total = subtotal - desconto + freteFinal;

    return {
      cupom,
      subtotal: Number(subtotal.toFixed(2)),
      desconto: Number(desconto.toFixed(2)),
      freteOriginal: Number(frete.toFixed(2)),
      freteFinal: Number(freteFinal.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  }

  async atualizar(data: AtualizarCupomDTO) {
    const cupom = await cuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    const dadosCupom = this.montarDadosCupom(data);

    const cupomComMesmoCodigo = await cuponsRepository.buscarCupomPorCodigo(
      dadosCupom.codigo
    );

    if (cupomComMesmoCodigo && cupomComMesmoCodigo.id !== data.id) {
      throw new Error("Já existe outro cupom com esse código.");
    }

    return cuponsRepository.atualizarCupom(data.id, dadosCupom);
  }

  async ativar(data: AtivarCupomDTO) {
    const cupom = await cuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    if (cupom.ativo) {
      throw new Error("Cupom já está ativo.");
    }

    return cuponsRepository.atualizarStatusCupom(data.id, true);
  }

  async desativar(data: DesativarCupomDTO) {
    const cupom = await cuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    if (!cupom.ativo) {
      throw new Error("Cupom já está desativado.");
    }

    return cuponsRepository.atualizarStatusCupom(data.id, false);
  }

  async remover(data: RemoverCupomDTO) {
    const cupom = await cuponsRepository.buscarCupomPorId(data.id);

    if (!cupom) {
      throw new Error("Cupom não encontrado.");
    }

    const cupomRemovido = await cuponsRepository.atualizarStatusCupom(
      data.id,
      false
    );

    return {
      message: "Cupom removido com sucesso.",
      cupom: cupomRemovido,
    };
  }
}

export const cuponsService = new CuponsService();
