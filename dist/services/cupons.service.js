"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cuponsService = exports.CuponsService = exports.RegraStatusCupomPadrao = exports.CalculadorasDescontoCupomPadrao = exports.CalculadoraCupomFreteGratis = exports.CalculadoraCupomValorFixo = exports.CalculadoraCupomPercentual = exports.RegraAplicacaoCupomPadrao = exports.ValidadorValoresAplicacaoCupomPadrao = exports.ValidadorDadosCupomPadrao = exports.NormalizadorCodigoCupomPadrao = void 0;
const enums_1 = require("../generated/prisma/enums");
const cupons_repository_1 = require("../repositories/cupons.repository");
class NormalizadorCodigoCupomPadrao {
    normalizar(codigo) {
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
exports.NormalizadorCodigoCupomPadrao = NormalizadorCodigoCupomPadrao;
class ValidadorDadosCupomPadrao {
    constructor(normalizadorCodigoCupom) {
        this.normalizadorCodigoCupom = normalizadorCodigoCupom;
    }
    validarTipoDesconto(tipoDesconto) {
        if (!tipoDesconto) {
            throw new Error("O tipo de desconto é obrigatório.");
        }
        const tipoDescontoFormatado = String(tipoDesconto).toUpperCase();
        const tiposPermitidos = Object.values(enums_1.TipoDescontoCupom);
        if (!tiposPermitidos.includes(tipoDescontoFormatado)) {
            throw new Error("Tipo de desconto inválido. Use PERCENTUAL, VALOR_FIXO ou FRETE_GRATIS.");
        }
        return tipoDescontoFormatado;
    }
    validarValorDesconto(valorDesconto, tipoDesconto) {
        const valorDescontoNumber = Number(valorDesconto ?? 0);
        if (Number.isNaN(valorDescontoNumber)) {
            throw new Error("O valor do desconto deve ser um número válido.");
        }
        if (tipoDesconto !== enums_1.TipoDescontoCupom.FRETE_GRATIS &&
            valorDescontoNumber <= 0) {
            throw new Error("O valor do desconto deve ser maior que zero.");
        }
        if (tipoDesconto === enums_1.TipoDescontoCupom.PERCENTUAL &&
            valorDescontoNumber > 70) {
            throw new Error("Cupom percentual não pode passar de 70%.");
        }
        return tipoDesconto === enums_1.TipoDescontoCupom.FRETE_GRATIS
            ? 0
            : valorDescontoNumber;
    }
    validarValorMinimoPedido(valorMinimoPedido) {
        const valorMinimoPedidoNumber = valorMinimoPedido === undefined || valorMinimoPedido === null
            ? null
            : Number(valorMinimoPedido);
        if (valorMinimoPedidoNumber !== null &&
            Number.isNaN(valorMinimoPedidoNumber)) {
            throw new Error("O valor mínimo do pedido deve ser um número válido.");
        }
        if (valorMinimoPedidoNumber !== null && valorMinimoPedidoNumber < 0) {
            throw new Error("O valor mínimo do pedido não pode ser negativo.");
        }
        return valorMinimoPedidoNumber;
    }
    validarLimiteUso(limiteUso) {
        const limiteUsoNumber = limiteUso === undefined || limiteUso === null ? null : Number(limiteUso);
        if (limiteUsoNumber !== null && !Number.isInteger(limiteUsoNumber)) {
            throw new Error("O limite de uso deve ser um número inteiro.");
        }
        if (limiteUsoNumber !== null && limiteUsoNumber <= 0) {
            throw new Error("O limite de uso deve ser maior que zero.");
        }
        return limiteUsoNumber;
    }
    converterData(data) {
        return data ? new Date(data) : null;
    }
    validar(data) {
        const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
        const tipoDesconto = this.validarTipoDesconto(data.tipoDesconto);
        const valorDesconto = this.validarValorDesconto(data.valorDesconto, tipoDesconto);
        const valorMinimoPedido = this.validarValorMinimoPedido(data.valorMinimoPedido);
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
exports.ValidadorDadosCupomPadrao = ValidadorDadosCupomPadrao;
class ValidadorValoresAplicacaoCupomPadrao {
    validar(data) {
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
exports.ValidadorValoresAplicacaoCupomPadrao = ValidadorValoresAplicacaoCupomPadrao;
class RegraAplicacaoCupomPadrao {
    cupomEstaVencido(expiraEm) {
        if (!expiraEm) {
            return false;
        }
        return new Date() > new Date(expiraEm);
    }
    cupomAindaNaoIniciou(iniciaEm) {
        if (!iniciaEm) {
            return false;
        }
        return new Date() < new Date(iniciaEm);
    }
    validar(cupom, valores) {
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
        if (cupom.valorMinimoPedido !== null &&
            valores.subtotal < Number(cupom.valorMinimoPedido)) {
            throw new Error("Subtotal menor que o valor mínimo exigido pelo cupom.");
        }
    }
}
exports.RegraAplicacaoCupomPadrao = RegraAplicacaoCupomPadrao;
class CalculadoraCupomPercentual {
    calcular(cupom, valores) {
        const desconto = valores.subtotal * (Number(cupom.valorDesconto) / 100);
        return {
            desconto: Math.min(desconto, valores.subtotal),
            freteFinal: valores.frete,
        };
    }
}
exports.CalculadoraCupomPercentual = CalculadoraCupomPercentual;
class CalculadoraCupomValorFixo {
    calcular(cupom, valores) {
        const desconto = Number(cupom.valorDesconto);
        return {
            desconto: Math.min(desconto, valores.subtotal),
            freteFinal: valores.frete,
        };
    }
}
exports.CalculadoraCupomValorFixo = CalculadoraCupomValorFixo;
class CalculadoraCupomFreteGratis {
    calcular(_cupom, _valores) {
        return {
            desconto: 0,
            freteFinal: 0,
        };
    }
}
exports.CalculadoraCupomFreteGratis = CalculadoraCupomFreteGratis;
class CalculadorasDescontoCupomPadrao {
    constructor() {
        this.calculadoras = new Map([
            [enums_1.TipoDescontoCupom.PERCENTUAL, new CalculadoraCupomPercentual()],
            [enums_1.TipoDescontoCupom.VALOR_FIXO, new CalculadoraCupomValorFixo()],
            [enums_1.TipoDescontoCupom.FRETE_GRATIS, new CalculadoraCupomFreteGratis()],
        ]);
    }
    obter(tipoDesconto) {
        const calculadora = this.calculadoras.get(tipoDesconto);
        if (!calculadora) {
            throw new Error("Tipo de desconto sem calculadora configurada.");
        }
        return calculadora;
    }
}
exports.CalculadorasDescontoCupomPadrao = CalculadorasDescontoCupomPadrao;
class RegraStatusCupomPadrao {
    validarAtivacao(cupom) {
        if (cupom.ativo) {
            throw new Error("Cupom já está ativo.");
        }
    }
    validarDesativacao(cupom) {
        if (!cupom.ativo) {
            throw new Error("Cupom já está desativado.");
        }
    }
}
exports.RegraStatusCupomPadrao = RegraStatusCupomPadrao;
class CuponsService {
    constructor(leituraCuponsRepository, escritaCuponsRepository, statusCuponsRepository, normalizadorCodigoCupom, validadorDadosCupom, validadorValoresAplicacaoCupom, regraAplicacaoCupom, calculadorasDescontoCupom, regraStatusCupom) {
        this.leituraCuponsRepository = leituraCuponsRepository;
        this.escritaCuponsRepository = escritaCuponsRepository;
        this.statusCuponsRepository = statusCuponsRepository;
        this.normalizadorCodigoCupom = normalizadorCodigoCupom;
        this.validadorDadosCupom = validadorDadosCupom;
        this.validadorValoresAplicacaoCupom = validadorValoresAplicacaoCupom;
        this.regraAplicacaoCupom = regraAplicacaoCupom;
        this.calculadorasDescontoCupom = calculadorasDescontoCupom;
        this.regraStatusCupom = regraStatusCupom;
    }
    async criar(data) {
        const dadosCupom = this.validadorDadosCupom.validar(data);
        const cupomExistente = await this.leituraCuponsRepository.buscarCupomPorCodigo(dadosCupom.codigo);
        if (cupomExistente) {
            throw new Error("Já existe um cupom com esse código.");
        }
        return this.escritaCuponsRepository.criarCupom(dadosCupom);
    }
    async listar() {
        return this.leituraCuponsRepository.listarCupons();
    }
    async buscarPorCodigo(data) {
        const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
        const cupom = await this.leituraCuponsRepository.buscarCupomPorCodigo(codigo);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        return cupom;
    }
    async buscarPorId(data) {
        const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        return cupom;
    }
    async aplicar(data) {
        const codigo = this.normalizadorCodigoCupom.normalizar(data.codigo);
        const cupom = await this.leituraCuponsRepository.buscarCupomPorCodigo(codigo);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        const valores = this.validadorValoresAplicacaoCupom.validar(data);
        this.regraAplicacaoCupom.validar(cupom, valores);
        const calculadora = this.calculadorasDescontoCupom.obter(cupom.tipoDesconto);
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
    async atualizar(data) {
        const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        const dadosCupom = this.validadorDadosCupom.validar(data);
        const cupomComMesmoCodigo = await this.leituraCuponsRepository.buscarCupomPorCodigo(dadosCupom.codigo);
        if (cupomComMesmoCodigo && cupomComMesmoCodigo.id !== data.id) {
            throw new Error("Já existe outro cupom com esse código.");
        }
        return this.escritaCuponsRepository.atualizarCupom(data.id, dadosCupom);
    }
    async ativar(data) {
        const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        this.regraStatusCupom.validarAtivacao(cupom);
        return this.statusCuponsRepository.atualizarStatusCupom(data.id, true);
    }
    async desativar(data) {
        const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        this.regraStatusCupom.validarDesativacao(cupom);
        return this.statusCuponsRepository.atualizarStatusCupom(data.id, false);
    }
    async remover(data) {
        const cupom = await this.leituraCuponsRepository.buscarCupomPorId(data.id);
        if (!cupom) {
            throw new Error("Cupom não encontrado.");
        }
        const cupomRemovido = await this.statusCuponsRepository.atualizarStatusCupom(data.id, false);
        return {
            message: "Cupom removido com sucesso.",
            cupom: cupomRemovido,
        };
    }
}
exports.CuponsService = CuponsService;
const normalizadorCodigoCupom = new NormalizadorCodigoCupomPadrao();
const validadorDadosCupom = new ValidadorDadosCupomPadrao(normalizadorCodigoCupom);
const validadorValoresAplicacaoCupom = new ValidadorValoresAplicacaoCupomPadrao();
const regraAplicacaoCupom = new RegraAplicacaoCupomPadrao();
const calculadorasDescontoCupom = new CalculadorasDescontoCupomPadrao();
const regraStatusCupom = new RegraStatusCupomPadrao();
exports.cuponsService = new CuponsService(cupons_repository_1.cuponsRepository, cupons_repository_1.cuponsRepository, cupons_repository_1.cuponsRepository, normalizadorCodigoCupom, validadorDadosCupom, validadorValoresAplicacaoCupom, regraAplicacaoCupom, calculadorasDescontoCupom, regraStatusCupom);
