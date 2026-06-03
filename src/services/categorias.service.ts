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

export interface DadosCategoriaValidados {
  nome: string;
  slug: string;
  descricao?: string | null;
}

interface CategoriaRepository {
  id: string;
  ativo: boolean;
}

export interface IEscritaCategoriasRepository {
  criarCategoria(data: DadosCategoriaValidados): Promise<CategoriaRepository>;
  atualizarCategoria(
    id: string,
    data: DadosCategoriaValidados
  ): Promise<CategoriaRepository>;
}

export interface ILeituraCategoriasRepository {
  listarCategoriasAtivas(): Promise<CategoriaRepository[]>;
  buscarCategoriaPorId(id: string): Promise<CategoriaRepository | null>;
  buscarCategoriaPorSlug(slug: string): Promise<CategoriaRepository | null>;
}

export interface IStatusCategoriasRepository {
  atualizarStatusCategoria(
    id: string,
    ativo: boolean
  ): Promise<CategoriaRepository>;
}

export interface ICategoriasRepository
  extends IEscritaCategoriasRepository,
    ILeituraCategoriasRepository,
    IStatusCategoriasRepository {}

export interface IGeradorSlugCategoria {
  gerar(texto: string): string;
}

export interface IValidadorDadosCategoria {
  validar(data: CriarCategoriaDTO): DadosCategoriaValidados;
}

export interface IRegraStatusCategoria {
  validarAtivacao(categoria: { ativo: boolean }): void;
  validarDesativacao(categoria: { ativo: boolean }): void;
}

export class GeradorSlugCategoriaPadrao implements IGeradorSlugCategoria {
  gerar(texto: string) {
    return texto
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
}

export class ValidadorDadosCategoriaPadrao
  implements IValidadorDadosCategoria
{
  constructor(private geradorSlugCategoria: IGeradorSlugCategoria) {}

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

  validar(data: CriarCategoriaDTO) {
    const nome = this.validarNome(data.nome);

    return {
      nome,
      slug: this.geradorSlugCategoria.gerar(nome),
      descricao: data.descricao,
    };
  }
}

export class RegraStatusCategoriaPadrao implements IRegraStatusCategoria {
  validarAtivacao(categoria: { ativo: boolean }) {
    if (categoria.ativo) {
      throw new Error("Categoria já está ativa.");
    }
  }

  validarDesativacao(categoria: { ativo: boolean }) {
    if (!categoria.ativo) {
      throw new Error("Categoria já está desativada.");
    }
  }
}

export class CategoriasService {
  constructor(
    private leituraCategoriasRepository: ILeituraCategoriasRepository,
    private escritaCategoriasRepository: IEscritaCategoriasRepository,
    private statusCategoriasRepository: IStatusCategoriasRepository,
    private validadorDadosCategoria: IValidadorDadosCategoria,
    private regraStatusCategoria: IRegraStatusCategoria
  ) {}

  async criar(data: CriarCategoriaDTO) {
    const dadosCategoria = this.validadorDadosCategoria.validar(data);

    const categoriaExistente =
      await this.leituraCategoriasRepository.buscarCategoriaPorSlug(
        dadosCategoria.slug
      );

    if (categoriaExistente) {
      throw new Error("Já existe uma categoria com esse nome.");
    }

    return this.escritaCategoriasRepository.criarCategoria(dadosCategoria);
  }

  async listar() {
    return this.leituraCategoriasRepository.listarCategoriasAtivas();
  }

  async buscarPorSlug(data: BuscarCategoriaPorSlugDTO) {
    const categoria =
      await this.leituraCategoriasRepository.buscarCategoriaPorSlug(data.slug);

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return categoria;
  }

  async buscarPorId(data: BuscarCategoriaPorIdDTO) {
    const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(
      data.id
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    return categoria;
  }

  async atualizar(data: AtualizarCategoriaDTO) {
    const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(
      data.id
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const dadosCategoria = this.validadorDadosCategoria.validar(data);

    const categoriaComMesmoSlug =
      await this.leituraCategoriasRepository.buscarCategoriaPorSlug(
        dadosCategoria.slug
      );

    if (categoriaComMesmoSlug && categoriaComMesmoSlug.id !== data.id) {
      throw new Error("Já existe outra categoria com esse nome.");
    }

    return this.escritaCategoriasRepository.atualizarCategoria(
      data.id,
      dadosCategoria
    );
  }

  async desativar(data: DesativarCategoriaDTO) {
    const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(
      data.id
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    this.regraStatusCategoria.validarDesativacao(categoria);

    return this.statusCategoriasRepository.atualizarStatusCategoria(
      data.id,
      false
    );
  }

  async ativar(data: AtivarCategoriaDTO) {
    const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(
      data.id
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    this.regraStatusCategoria.validarAtivacao(categoria);

    return this.statusCategoriasRepository.atualizarStatusCategoria(
      data.id,
      true
    );
  }

  async remover(data: RemoverCategoriaDTO) {
    const categoria = await this.leituraCategoriasRepository.buscarCategoriaPorId(
      data.id
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    const categoriaRemovida =
      await this.statusCategoriasRepository.atualizarStatusCategoria(
        data.id,
        false
      );

    return {
      message: "Categoria removida com sucesso.",
      categoria: categoriaRemovida,
    };
  }
}

const geradorSlugCategoria = new GeradorSlugCategoriaPadrao();
const validadorDadosCategoria = new ValidadorDadosCategoriaPadrao(
  geradorSlugCategoria
);
const regraStatusCategoria = new RegraStatusCategoriaPadrao();

export const categoriasService = new CategoriasService(
  categoriasRepository,
  categoriasRepository,
  categoriasRepository,
  validadorDadosCategoria,
  regraStatusCategoria
);
