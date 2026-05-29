"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imagensProdutoService = exports.ImagensProdutoService = exports.RegraImagemPrincipalProdutoUnica = exports.ValidadorDadosImagemProdutoPadrao = void 0;
const imagens_produto_repository_1 = require("../repositories/imagens-produto.repository");
class ValidadorDadosImagemProdutoPadrao {
    validarUrl(url) {
        if (!url) {
            throw new Error("A URL da imagem é obrigatória.");
        }
        if (typeof url !== "string") {
            throw new Error("A URL da imagem deve ser um texto.");
        }
        if (url.trim().length < 5) {
            throw new Error("A URL da imagem é inválida.");
        }
        return url.trim();
    }
    validar(data) {
        return {
            url: this.validarUrl(data.url),
            textoAlt: data.textoAlt,
            principal: Boolean(data.principal),
        };
    }
}
exports.ValidadorDadosImagemProdutoPadrao = ValidadorDadosImagemProdutoPadrao;
class RegraImagemPrincipalProdutoUnica {
    constructor(imagensProdutoRepository) {
        this.imagensProdutoRepository = imagensProdutoRepository;
    }
    async aplicar(produtoId, principal) {
        if (principal) {
            await this.imagensProdutoRepository.removerPrincipalDasImagens(produtoId);
        }
    }
}
exports.RegraImagemPrincipalProdutoUnica = RegraImagemPrincipalProdutoUnica;
class ImagensProdutoService {
    constructor(imagensProdutoRepository, validadorDadosImagemProduto, regraImagemPrincipalProduto) {
        this.imagensProdutoRepository = imagensProdutoRepository;
        this.validadorDadosImagemProduto = validadorDadosImagemProduto;
        this.regraImagemPrincipalProduto = regraImagemPrincipalProduto;
    }
    async criar(data) {
        if (!data.produtoId) {
            throw new Error("O produto é obrigatório.");
        }
        const produtoId = String(data.produtoId);
        const produto = await this.imagensProdutoRepository.buscarProdutoPorId(produtoId);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        if (!produto.ativo) {
            throw new Error("Não é possível adicionar imagem a um produto inativo.");
        }
        const dadosImagem = this.validadorDadosImagemProduto.validar(data);
        await this.regraImagemPrincipalProduto.aplicar(produtoId, dadosImagem.principal);
        return this.imagensProdutoRepository.criarImagem({
            produtoId,
            url: dadosImagem.url,
            textoAlt: dadosImagem.textoAlt,
            principal: dadosImagem.principal,
        });
    }
    async listar() {
        return this.imagensProdutoRepository.listarImagens();
    }
    async listarPorProduto(data) {
        const produto = await this.imagensProdutoRepository.buscarProdutoPorId(data.produtoId);
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        return this.imagensProdutoRepository.listarImagensPorProduto(data.produtoId);
    }
    async buscarPorId(data) {
        const imagem = await this.imagensProdutoRepository.buscarImagemDetalhadaPorId(data.id);
        if (!imagem) {
            throw new Error("Imagem não encontrada.");
        }
        return imagem;
    }
    async atualizar(data) {
        const imagem = await this.imagensProdutoRepository.buscarImagemPorId(data.id);
        if (!imagem) {
            throw new Error("Imagem não encontrada.");
        }
        const dadosImagem = this.validadorDadosImagemProduto.validar(data);
        await this.regraImagemPrincipalProduto.aplicar(imagem.produtoId, dadosImagem.principal);
        return this.imagensProdutoRepository.atualizarImagem(data.id, {
            url: dadosImagem.url,
            textoAlt: dadosImagem.textoAlt,
            principal: dadosImagem.principal,
        });
    }
    async definirPrincipal(data) {
        const imagem = await this.imagensProdutoRepository.buscarImagemPorId(data.id);
        if (!imagem) {
            throw new Error("Imagem não encontrada.");
        }
        await this.regraImagemPrincipalProduto.aplicar(imagem.produtoId, true);
        return this.imagensProdutoRepository.definirImagemPrincipal(data.id);
    }
    async remover(data) {
        const imagem = await this.imagensProdutoRepository.buscarImagemPorId(data.id);
        if (!imagem) {
            throw new Error("Imagem não encontrada.");
        }
        await this.imagensProdutoRepository.removerImagem(data.id);
        return {
            message: "Imagem removida com sucesso.",
        };
    }
}
exports.ImagensProdutoService = ImagensProdutoService;
const validadorDadosImagemProduto = new ValidadorDadosImagemProdutoPadrao();
const regraImagemPrincipalProduto = new RegraImagemPrincipalProdutoUnica(imagens_produto_repository_1.imagensProdutoRepository);
exports.imagensProdutoService = new ImagensProdutoService(imagens_produto_repository_1.imagensProdutoRepository, validadorDadosImagemProduto, regraImagemPrincipalProduto);
