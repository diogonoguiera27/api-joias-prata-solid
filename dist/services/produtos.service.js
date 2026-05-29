"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.produtosService = exports.ProdutosService = exports.ValidadorDadosProdutoPadrao = exports.CalculadoraPrecoProdutoComDesconto = exports.GeradorSlugProdutoPadrao = void 0;
const produtos_repository_1 = require("../repositories/produtos.repository");
class GeradorSlugProdutoPadrao {
    gerar(texto) {
        return texto
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
    }
}
exports.GeradorSlugProdutoPadrao = GeradorSlugProdutoPadrao;
class CalculadoraPrecoProdutoComDesconto {
    calcularPrecoFinal(precoBase, percentualDesconto) {
        const desconto = precoBase * (percentualDesconto / 100);
        return Number((precoBase - desconto).toFixed(2));
    }
}
exports.CalculadoraPrecoProdutoComDesconto = CalculadoraPrecoProdutoComDesconto;
class ValidadorDadosProdutoPadrao {
    constructor(geradorSlugProduto, calculadoraPrecoProduto) {
        this.geradorSlugProduto = geradorSlugProduto;
        this.calculadoraPrecoProduto = calculadoraPrecoProduto;
    }
    validarNome(nome) {
        if (!nome) {
            throw new Error("O nome do produto é obrigatório.");
        }
        if (typeof nome !== "string") {
            throw new Error("O nome do produto deve ser um texto.");
        }
        if (nome.trim().length < 3) {
            throw new Error("O nome do produto deve ter pelo menos 3 caracteres.");
        }
        return nome.trim();
    }
    validarPrecoBase(precoBase) {
        if (!precoBase) {
            throw new Error("O preço base do produto é obrigatório.");
        }
        const precoBaseNumber = Number(precoBase);
        if (Number.isNaN(precoBaseNumber)) {
            throw new Error("O preço base deve ser um número válido.");
        }
        if (precoBaseNumber <= 0) {
            throw new Error("O preço base deve ser maior que zero.");
        }
        return precoBaseNumber;
    }
    validarPercentualDesconto(percentualDesconto) {
        const percentualDescontoNumber = Number(percentualDesconto ?? 0);
        if (Number.isNaN(percentualDescontoNumber)) {
            throw new Error("O percentual de desconto deve ser um número válido.");
        }
        if (percentualDescontoNumber < 0) {
            throw new Error("O desconto não pode ser menor que 0%.");
        }
        if (percentualDescontoNumber > 70) {
            throw new Error("O desconto não pode ser maior que 70%.");
        }
        return percentualDescontoNumber;
    }
    validar(data) {
        const nome = this.validarNome(data.nome);
        const precoBase = this.validarPrecoBase(data.precoBase);
        const percentualDesconto = this.validarPercentualDesconto(data.percentualDesconto);
        const slug = this.geradorSlugProduto.gerar(nome);
        const precoFinal = this.calculadoraPrecoProduto.calcularPrecoFinal(precoBase, percentualDesconto);
        return {
            nome,
            slug,
            descricao: data.descricao,
            precoBase,
            percentualDesconto,
            precoFinal,
            material: data.material,
            colecao: data.colecao,
        };
    }
}
exports.ValidadorDadosProdutoPadrao = ValidadorDadosProdutoPadrao;
class ProdutosService {
    constructor(produtosRepository, validadorDadosProduto) {
        this.produtosRepository = produtosRepository;
        this.validadorDadosProduto = validadorDadosProduto;
    }
    async validarCategoria(categoriaId, mensagemInativa) {
        if (!categoriaId) {
            throw new Error("A categoria do produto é obrigatória.");
        }
        const categoria = await this.produtosRepository.buscarCategoriaPorId(String(categoriaId));
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        if (!categoria.ativo) {
            throw new Error(mensagemInativa);
        }
        return String(categoriaId);
    }
    async criar(data) {
        const dadosProduto = this.validadorDadosProduto.validar(data);
        const categoriaId = await this.validarCategoria(data.categoriaId, "Não é possível criar produto em uma categoria inativa.");
        const produtoExistente = await this.produtosRepository.buscarProdutoSimplesPorSlug(dadosProduto.slug);
        if (produtoExistente) {
            throw new Error("Já existe um produto com esse nome.");
        }
        return this.produtosRepository.criarProduto({
            nome: dadosProduto.nome,
            slug: dadosProduto.slug,
            descricao: dadosProduto.descricao,
            precoBase: dadosProduto.precoBase,
            percentualDesconto: dadosProduto.percentualDesconto,
            precoFinal: dadosProduto.precoFinal,
            material: dadosProduto.material,
            colecao: dadosProduto.colecao,
            categoriaId,
        });
    }
    async listar() {
        return this.produtosRepository.listarProdutosAtivos();
    }
    async buscarPorSlug(data) {
        const produto = await this.produtosRepository.buscarProdutoPorSlug(data.slug);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        return produto;
    }
    async buscarPorId(data) {
        const produto = await this.produtosRepository.buscarProdutoPorId(data.id);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        return produto;
    }
    async atualizar(data) {
        const produto = await this.produtosRepository.buscarProdutoSimplesPorId(data.id);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        const dadosProduto = this.validadorDadosProduto.validar(data);
        const categoriaId = await this.validarCategoria(data.categoriaId, "Não é possível vincular produto a uma categoria inativa.");
        const produtoComMesmoSlug = await this.produtosRepository.buscarProdutoSimplesPorSlug(dadosProduto.slug);
        if (produtoComMesmoSlug && produtoComMesmoSlug.id !== data.id) {
            throw new Error("Já existe outro produto com esse nome.");
        }
        return this.produtosRepository.atualizarProduto(data.id, {
            nome: dadosProduto.nome,
            slug: dadosProduto.slug,
            descricao: dadosProduto.descricao,
            precoBase: dadosProduto.precoBase,
            percentualDesconto: dadosProduto.percentualDesconto,
            precoFinal: dadosProduto.precoFinal,
            material: dadosProduto.material,
            colecao: dadosProduto.colecao,
            categoriaId,
        });
    }
    async desativar(data) {
        const produto = await this.produtosRepository.buscarProdutoSimplesPorId(data.id);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        if (!produto.ativo) {
            throw new Error("Produto já está desativado.");
        }
        return this.produtosRepository.atualizarStatusProduto(data.id, false);
    }
    async ativar(data) {
        const produto = await this.produtosRepository.buscarProdutoSimplesPorId(data.id);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        if (produto.ativo) {
            throw new Error("Produto já está ativo.");
        }
        return this.produtosRepository.atualizarStatusProduto(data.id, true);
    }
    async remover(data) {
        const produto = await this.produtosRepository.buscarProdutoSimplesPorId(data.id);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        const produtoRemovido = await this.produtosRepository.atualizarStatusProduto(data.id, false);
        return {
            message: "Produto removido com sucesso.",
            produto: produtoRemovido,
        };
    }
}
exports.ProdutosService = ProdutosService;
const geradorSlugProduto = new GeradorSlugProdutoPadrao();
const calculadoraPrecoProduto = new CalculadoraPrecoProdutoComDesconto();
const validadorDadosProduto = new ValidadorDadosProdutoPadrao(geradorSlugProduto, calculadoraPrecoProduto);
exports.produtosService = new ProdutosService(produtos_repository_1.produtosRepository, validadorDadosProduto);
