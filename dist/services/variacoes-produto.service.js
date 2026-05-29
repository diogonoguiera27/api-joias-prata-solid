"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.variacoesProdutoService = exports.VariacoesProdutoService = exports.RegraStatusVariacaoProdutoPadrao = exports.CalculadoraAjusteEstoqueVariacaoProdutoPadrao = exports.ValidadorDadosVariacaoProdutoPadrao = exports.ValidadorEstoqueVariacaoProdutoPadrao = void 0;
const variacoes_produto_repository_1 = require("../repositories/variacoes-produto.repository");
class ValidadorEstoqueVariacaoProdutoPadrao {
    validar(estoque, mensagemObrigatorio) {
        if (mensagemObrigatorio && (estoque === undefined || estoque === null)) {
            throw new Error(mensagemObrigatorio);
        }
        const estoqueNumber = Number(estoque ?? 0);
        if (Number.isNaN(estoqueNumber)) {
            throw new Error("O estoque deve ser um número válido.");
        }
        if (!Number.isInteger(estoqueNumber)) {
            throw new Error("O estoque deve ser um número inteiro.");
        }
        if (estoqueNumber < 0) {
            throw new Error("O estoque não pode ser negativo.");
        }
        return estoqueNumber;
    }
}
exports.ValidadorEstoqueVariacaoProdutoPadrao = ValidadorEstoqueVariacaoProdutoPadrao;
class ValidadorDadosVariacaoProdutoPadrao {
    constructor(validadorEstoqueVariacaoProduto) {
        this.validadorEstoqueVariacaoProduto = validadorEstoqueVariacaoProduto;
    }
    validarNome(nome) {
        if (!nome) {
            throw new Error("O nome da variação é obrigatório.");
        }
        if (typeof nome !== "string") {
            throw new Error("O nome da variação deve ser um texto.");
        }
        if (nome.trim().length < 2) {
            throw new Error("O nome da variação deve ter pelo menos 2 caracteres.");
        }
        return nome.trim();
    }
    validarSku(sku) {
        if (!sku) {
            throw new Error("O SKU da variação é obrigatório.");
        }
        if (typeof sku !== "string") {
            throw new Error("O SKU deve ser um texto.");
        }
        return sku.trim().toUpperCase();
    }
    validarPrecoAdicional(precoAdicional) {
        const precoAdicionalNumber = Number(precoAdicional ?? 0);
        if (Number.isNaN(precoAdicionalNumber)) {
            throw new Error("O preço adicional deve ser um número válido.");
        }
        if (precoAdicionalNumber < 0) {
            throw new Error("O preço adicional não pode ser negativo.");
        }
        return precoAdicionalNumber;
    }
    validar(data) {
        return {
            nome: this.validarNome(data.nome),
            sku: this.validarSku(data.sku),
            tamanho: data.tamanho,
            cor: data.cor,
            precoAdicional: this.validarPrecoAdicional(data.precoAdicional),
            estoque: this.validadorEstoqueVariacaoProduto.validar(data.estoque),
        };
    }
}
exports.ValidadorDadosVariacaoProdutoPadrao = ValidadorDadosVariacaoProdutoPadrao;
class CalculadoraAjusteEstoqueVariacaoProdutoPadrao {
    calcular(data) {
        return {
            novoEstoque: data.novoEstoque,
            diferenca: data.novoEstoque - data.estoqueAtual,
            estoqueAtual: data.estoqueAtual,
            motivo: data.motivo,
        };
    }
}
exports.CalculadoraAjusteEstoqueVariacaoProdutoPadrao = CalculadoraAjusteEstoqueVariacaoProdutoPadrao;
class RegraStatusVariacaoProdutoPadrao {
    validarAtivacao(variacao) {
        if (variacao.ativo) {
            throw new Error("Variação já está ativa.");
        }
    }
    validarDesativacao(variacao) {
        if (!variacao.ativo) {
            throw new Error("Variação já está desativada.");
        }
    }
}
exports.RegraStatusVariacaoProdutoPadrao = RegraStatusVariacaoProdutoPadrao;
class VariacoesProdutoService {
    constructor(variacoesProdutoRepository, validadorDadosVariacaoProduto, validadorEstoqueVariacaoProduto, calculadoraAjusteEstoqueVariacaoProduto, regraStatusVariacaoProduto) {
        this.variacoesProdutoRepository = variacoesProdutoRepository;
        this.validadorDadosVariacaoProduto = validadorDadosVariacaoProduto;
        this.validadorEstoqueVariacaoProduto = validadorEstoqueVariacaoProduto;
        this.calculadoraAjusteEstoqueVariacaoProduto = calculadoraAjusteEstoqueVariacaoProduto;
        this.regraStatusVariacaoProduto = regraStatusVariacaoProduto;
    }
    async validarProduto(produtoId, mensagemInativo) {
        if (!produtoId) {
            throw new Error("O produto é obrigatório.");
        }
        const produto = await this.variacoesProdutoRepository.buscarProdutoPorId(String(produtoId));
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        if (!produto.ativo) {
            throw new Error(mensagemInativo);
        }
        return String(produtoId);
    }
    async criar(data) {
        const produtoId = await this.validarProduto(data.produtoId, "Não é possível criar variação para um produto inativo.");
        const dadosVariacao = this.validadorDadosVariacaoProduto.validar(data);
        const variacaoComMesmoSku = await this.variacoesProdutoRepository.buscarVariacaoPorSku(dadosVariacao.sku);
        if (variacaoComMesmoSku) {
            throw new Error("Já existe uma variação com esse SKU.");
        }
        return this.variacoesProdutoRepository.criarVariacao({
            produtoId,
            ...dadosVariacao,
        });
    }
    async listar() {
        return this.variacoesProdutoRepository.listarVariacoesAtivas();
    }
    async listarPorProduto(data) {
        const produto = await this.variacoesProdutoRepository.buscarProdutoPorId(data.produtoId);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        return this.variacoesProdutoRepository.listarVariacoesPorProduto(data.produtoId);
    }
    async buscarPorId(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoDetalhadaPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        return variacao;
    }
    async atualizar(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        const produtoId = await this.validarProduto(data.produtoId, "Não é possível vincular a variação a um produto inativo.");
        const dadosVariacao = this.validadorDadosVariacaoProduto.validar(data);
        const variacaoComMesmoSku = await this.variacoesProdutoRepository.buscarVariacaoPorSku(dadosVariacao.sku);
        if (variacaoComMesmoSku && variacaoComMesmoSku.id !== data.id) {
            throw new Error("Já existe outra variação com esse SKU.");
        }
        return this.variacoesProdutoRepository.atualizarVariacao(data.id, {
            produtoId,
            ...dadosVariacao,
        });
    }
    async atualizarEstoque(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        const novoEstoque = this.validadorEstoqueVariacaoProduto.validar(data.estoque, "O estoque é obrigatório.");
        const dadosAjuste = this.calculadoraAjusteEstoqueVariacaoProduto.calcular({
            novoEstoque,
            estoqueAtual: variacao.estoque,
            motivo: data.motivo,
        });
        return this.variacoesProdutoRepository.atualizarEstoque(data.id, {
            ...dadosAjuste,
        });
    }
    async desativar(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        this.regraStatusVariacaoProduto.validarDesativacao(variacao);
        return this.variacoesProdutoRepository.atualizarStatusVariacao(data.id, false);
    }
    async ativar(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        this.regraStatusVariacaoProduto.validarAtivacao(variacao);
        return this.variacoesProdutoRepository.atualizarStatusVariacao(data.id, true);
    }
    async remover(data) {
        const variacao = await this.variacoesProdutoRepository.buscarVariacaoPorId(data.id);
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        const variacaoRemovida = await this.variacoesProdutoRepository.atualizarStatusVariacao(data.id, false);
        return {
            message: "Variação removida com sucesso.",
            variacao: variacaoRemovida,
        };
    }
}
exports.VariacoesProdutoService = VariacoesProdutoService;
const validadorEstoqueVariacaoProduto = new ValidadorEstoqueVariacaoProdutoPadrao();
const validadorDadosVariacaoProduto = new ValidadorDadosVariacaoProdutoPadrao(validadorEstoqueVariacaoProduto);
const calculadoraAjusteEstoqueVariacaoProduto = new CalculadoraAjusteEstoqueVariacaoProdutoPadrao();
const regraStatusVariacaoProduto = new RegraStatusVariacaoProdutoPadrao();
exports.variacoesProdutoService = new VariacoesProdutoService(variacoes_produto_repository_1.variacoesProdutoRepository, validadorDadosVariacaoProduto, validadorEstoqueVariacaoProduto, calculadoraAjusteEstoqueVariacaoProduto, regraStatusVariacaoProduto);
