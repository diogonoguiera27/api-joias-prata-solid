import { categoriasRepository } from "../repositories/categorias.repository";
import {
  CriarCategoriaDTO,
  AtualizarCategoriaDTO,
  BuscarCategoriaPorIdDTO,
  BuscarCategoriaPorSlugDTO,
  AtivarCategoriaDTO,
  DesativarCategoriaDTO,
  RemoverCategoriaDTO,
} from "../models/categoria.model";

class CategoriasService {
  private gerarSlug(texto: string) {
    return texto
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  private validarNome(nome: unknown) {
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

  async criar(data: CriarCategoriaDTO) {
    const nome = this.validarNome(data.nome);
    const slug = this.gerarSlug(nome);

    const categoriaExistente = await categoriasRepository.buscarCategoriaPorSlug(
      slug
    );

    if (categoriaExistente) {
      throw new Error("Já existe uma categoria com esse nome.");
    }

    return categoriasRepository.criarCategoria({
      nome,
      slug,
      descricao: data.descricao,
    });
  }

  async listar() {
    return categoriasRepository.listarCategoriasAtivas();
  }

  async buscarPorSlug(data: BuscarCategoriaPorSlugDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorSlug(
      data.slug
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return categoria;
  }

  async buscarPorId(data: BuscarCategoriaPorIdDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorId(data.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return categoria;
  }

  async atualizar(data: AtualizarCategoriaDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorId(data.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const nome = this.validarNome(data.nome);
    const slug = this.gerarSlug(nome);

    const categoriaComMesmoSlug =
      await categoriasRepository.buscarCategoriaPorSlug(slug);

    if (categoriaComMesmoSlug && categoriaComMesmoSlug.id !== data.id) {
      throw new Error("Já existe outra categoria com esse nome.");
    }

    return categoriasRepository.atualizarCategoria(data.id, {
      nome,
      slug,
      descricao: data.descricao,
    });
  }

  async desativar(data: DesativarCategoriaDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorId(data.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    if (!categoria.ativo) {
      throw new Error("Categoria já está desativada.");
    }

    return categoriasRepository.atualizarStatusCategoria(data.id, false);
  }

  async ativar(data: AtivarCategoriaDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorId(data.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    if (categoria.ativo) {
      throw new Error("Categoria já está ativa.");
    }

    return categoriasRepository.atualizarStatusCategoria(data.id, true);
  }

  async remover(data: RemoverCategoriaDTO) {
    const categoria = await categoriasRepository.buscarCategoriaPorId(data.id);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const categoriaRemovida =
      await categoriasRepository.atualizarStatusCategoria(data.id, false);

    return {
      message: "Categoria removida com sucesso.",
      categoria: categoriaRemovida,
    };
  }
}

export const categoriasService = new CategoriasService();
