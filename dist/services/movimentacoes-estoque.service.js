"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.movimentacoesEstoqueService = exports.MovimentacoesEstoqueService = exports.CalculadorasMovimentacaoEstoquePadrao = exports.CalculadoraAjusteEstoque = exports.CalculadoraSaidaEstoque = exports.CalculadoraEntradaEstoque = exports.ValidadorQuantidadeMovimentacaoEstoquePadrao = exports.ValidadorTipoMovimentacaoEstoquePadrao = void 0;
const enums_1 = require("../generated/prisma/enums");
const movimentacoes_estoque_repository_1 = require("../repositories/movimentacoes-estoque.repository");
class ValidadorTipoMovimentacaoEstoquePadrao {
    validar(tipo) {
        if (!tipo) {
            throw new Error("O tipo da movimentação é obrigatório.");
        }
        const tipoFormatado = String(tipo).toUpperCase();
        const tiposPermitidos = Object.values(enums_1.TipoMovimentacaoEstoque);
        if (!tiposPermitidos.includes(tipoFormatado)) {
            throw new Error("Tipo de movimentação inválido. Use ENTRADA, SAIDA, AJUSTE, VENDA ou DEVOLUCAO_CANCELAMENTO.");
        }
        return tipoFormatado;
    }
}
exports.ValidadorTipoMovimentacaoEstoquePadrao = ValidadorTipoMovimentacaoEstoquePadrao;
class ValidadorQuantidadeMovimentacaoEstoquePadrao {
    validar(quantidade) {
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
exports.ValidadorQuantidadeMovimentacaoEstoquePadrao = ValidadorQuantidadeMovimentacaoEstoquePadrao;
class CalculadoraEntradaEstoque {
    calcular(estoqueAtual, quantidade) {
        return estoqueAtual + quantidade;
    }
}
exports.CalculadoraEntradaEstoque = CalculadoraEntradaEstoque;
class CalculadoraSaidaEstoque {
    calcular(estoqueAtual, quantidade) {
        return estoqueAtual - quantidade;
    }
}
exports.CalculadoraSaidaEstoque = CalculadoraSaidaEstoque;
class CalculadoraAjusteEstoque {
    calcular(_estoqueAtual, quantidade) {
        return quantidade;
    }
}
exports.CalculadoraAjusteEstoque = CalculadoraAjusteEstoque;
class CalculadorasMovimentacaoEstoquePadrao {
    constructor() {
        this.calculadoras = new Map([
            [enums_1.TipoMovimentacaoEstoque.ENTRADA, new CalculadoraEntradaEstoque()],
            [
                enums_1.TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO,
                new CalculadoraEntradaEstoque(),
            ],
            [enums_1.TipoMovimentacaoEstoque.SAIDA, new CalculadoraSaidaEstoque()],
            [enums_1.TipoMovimentacaoEstoque.VENDA, new CalculadoraSaidaEstoque()],
            [enums_1.TipoMovimentacaoEstoque.AJUSTE, new CalculadoraAjusteEstoque()],
        ]);
    }
    obter(tipo) {
        const calculadora = this.calculadoras.get(tipo);
        if (!calculadora) {
            throw new Error("Tipo de movimentação sem calculadora configurada.");
        }
        return calculadora;
    }
}
exports.CalculadorasMovimentacaoEstoquePadrao = CalculadorasMovimentacaoEstoquePadrao;
class MovimentacoesEstoqueService {
    constructor(movimentacoesEstoqueRepository, validadorTipoMovimentacaoEstoque, validadorQuantidadeMovimentacaoEstoque, calculadorasMovimentacaoEstoque) {
        this.movimentacoesEstoqueRepository = movimentacoesEstoqueRepository;
        this.validadorTipoMovimentacaoEstoque = validadorTipoMovimentacaoEstoque;
        this.validadorQuantidadeMovimentacaoEstoque = validadorQuantidadeMovimentacaoEstoque;
        this.calculadorasMovimentacaoEstoque = calculadorasMovimentacaoEstoque;
    }
    async criar(data) {
        if (!data.variacaoId) {
            throw new Error("A variação do produto é obrigatória.");
        }
        const variacaoId = String(data.variacaoId);
        const variacao = await this.movimentacoesEstoqueRepository.buscarVariacaoPorId(variacaoId);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        if (!variacao.ativo) {
            throw new Error("Não é possível movimentar estoque de uma variação inativa.");
        }
        const tipo = this.validadorTipoMovimentacaoEstoque.validar(data.tipo);
        const quantidade = this.validadorQuantidadeMovimentacaoEstoque.validar(data.quantidade);
        const calculadora = this.calculadorasMovimentacaoEstoque.obter(tipo);
        const novoEstoque = calculadora.calcular(variacao.estoque, quantidade);
        if (novoEstoque < 0) {
            throw new Error("A movimentação deixaria o estoque negativo.");
        }
        return this.movimentacoesEstoqueRepository.executarTransacao(async (tx) => {
            const movimentacao = await this.movimentacoesEstoqueRepository.criarMovimentacaoEstoque({
                variacaoId,
                tipo,
                quantidade,
                motivo: data.motivo,
            }, tx);
            const variacao = await this.movimentacoesEstoqueRepository.atualizarEstoqueVariacao(variacaoId, novoEstoque, tx);
            return {
                movimentacao,
                variacao,
            };
        });
    }
    async listar() {
        return this.movimentacoesEstoqueRepository.listarMovimentacoes();
    }
    async listarPorVariacao(data) {
        const variacao = await this.movimentacoesEstoqueRepository.buscarVariacaoPorId(data.variacaoId);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        return this.movimentacoesEstoqueRepository.listarMovimentacoesPorVariacao(data.variacaoId);
    }
    async buscarPorId(data) {
        const movimentacao = await this.movimentacoesEstoqueRepository.buscarMovimentacaoPorId(data.id);
        if (!movimentacao) {
            throw new Error("Movimentação de estoque não encontrada.");
        }
        return movimentacao;
    }
}
exports.MovimentacoesEstoqueService = MovimentacoesEstoqueService;
const validadorTipoMovimentacaoEstoque = new ValidadorTipoMovimentacaoEstoquePadrao();
const validadorQuantidadeMovimentacaoEstoque = new ValidadorQuantidadeMovimentacaoEstoquePadrao();
const calculadorasMovimentacaoEstoque = new CalculadorasMovimentacaoEstoquePadrao();
exports.movimentacoesEstoqueService = new MovimentacoesEstoqueService(movimentacoes_estoque_repository_1.movimentacoesEstoqueRepository, validadorTipoMovimentacaoEstoque, validadorQuantidadeMovimentacaoEstoque, calculadorasMovimentacaoEstoque);
