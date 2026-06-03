"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoriasService = exports.CategoriasService = exports.RegraStatusCategoriaPadrao = exports.ValidadorDadosCategoriaPadrao = exports.GeradorSlugCategoriaPadrao = void 0;
const categorias_repository_1 = require("../repositories/categorias.repository");
class GeradorSlugCategoriaPadrao {
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
exports.GeradorSlugCategoriaPadrao = GeradorSlugCategoriaPadrao;
class ValidadorDadosCategoriaPadrao {
    constructor(geradorSlugCategoria) {
        this.geradorSlugCategoria = geradorSlugCategoria;
    }
    validarNome(nome) {
        if (!nome) {
            throw new Error("O nome da categoria é obrigatório.");
        }
        if (typeof nome !== "string") {
            throw new Error("O nome da categoria deve ser um texto.");
        }
        if (nome.trim().length < 3) {
            throw new Error("O nome da categoria deve ter pelo menos 3 caracteres.");
        }
        return nome.trim();
    }
    validar(data) {
        const nome = this.validarNome(data.nome);
        return {
            nome,
            slug: this.geradorSlugCategoria.gerar(nome),
            descricao: data.descricao,
        };
    }
}
exports.ValidadorDadosCategoriaPadrao = ValidadorDadosCategoriaPadrao;
class RegraStatusCategoriaPadrao {
    validarAtivacao(categoria) {
        if (categoria.ativo) {
            throw new Error("Categoria já está ativa.");
        }
    }
    validarDesativacao(categoria) {
        if (!categoria.ativo) {
            throw new Error("Categoria já está desativada.");
        }
    }
}
exports.RegraStatusCategoriaPadrao = RegraStatusCategoriaPadrao;
class CategoriasService {
    constructor(leituraCategoriasRepository, escritaCategoriasRepository, statusCategoriasRepository, validadorDadosCategoria, regraStatusCategoria) {
        this.leituraCategoriasRepository = leituraCategoriasRepository;
        this.escritaCategoriasRepository = escritaCategoriasRepository;
        this.statusCategoriasRepository = statusCategoriasRepository;
        this.validadorDadosCategoria = validadorDadosCategoria;
        this.regraStatusCategoria = regraStatusCategoria;
    }
    async criar(data) {
        const dadosCategoria = this.validadorDadosCategoria.validar(data);
        const categoriaExistente = await this.leituraCategoriasRepository.buscarCategoriaPorSlug(dadosCategoria.slug);
        if (categoriaExistente) {
            throw new Error("Já existe uma categoria com esse nome.");
        }
        return this.escritaCategoriasRepository.criarCategoria(dadosCategoria);
    }
    async listar() {
        return this.leituraCategoriasRepository.listarCategoriasAtivas();
    }
    async buscarPorSlug(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorSlug(data.slug);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        return categoria;
    }
    async buscarPorId(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(data.id);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        return categoria;
    }
    async atualizar(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(data.id);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        const dadosCategoria = this.validadorDadosCategoria.validar(data);
        const categoriaComMesmoSlug = await this.leituraCategoriasRepository.buscarCategoriaPorSlug(dadosCategoria.slug);
        if (categoriaComMesmoSlug && categoriaComMesmoSlug.id !== data.id) {
            throw new Error("Já existe outra categoria com esse nome.");
        }
        return this.escritaCategoriasRepository.atualizarCategoria(data.id, dadosCategoria);
    }
    async desativar(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(data.id);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        this.regraStatusCategoria.validarDesativacao(categoria);
        return this.statusCategoriasRepository.atualizarStatusCategoria(data.id, false);
    }
    async ativar(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(data.id);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        this.regraStatusCategoria.validarAtivacao(categoria);
        return this.statusCategoriasRepository.atualizarStatusCategoria(data.id, true);
    }
    async remover(data) {
        const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(data.id);
        if (!categoria) {
            throw new Error("Categoria não encontrada.");
        }
        const categoriaRemovida = await this.statusCategoriasRepository.atualizarStatusCategoria(data.id, false);
        return {
            message: "Categoria removida com sucesso.",
            categoria: categoriaRemovida,
        };
    }
}
exports.CategoriasService = CategoriasService;
const geradorSlugCategoria = new GeradorSlugCategoriaPadrao();
const validadorDadosCategoria = new ValidadorDadosCategoriaPadrao(geradorSlugCategoria);
const regraStatusCategoria = new RegraStatusCategoriaPadrao();
exports.categoriasService = new CategoriasService(categorias_repository_1.categoriasRepository, categorias_repository_1.categoriasRepository, categorias_repository_1.categoriasRepository, validadorDadosCategoria, regraStatusCategoria);
