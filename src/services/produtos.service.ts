import {
  AtivarProdutoDTO,
  AtualizarProdutoDTO,
  BuscarProdutoPorIdDTO,
  BuscarProdutoPorSlugDTO,
  CriarProdutoDTO,
  DesativarProdutoDTO,
  RemoverProdutoDTO,
} from "../models/produto.model";
import { produtosRepository } from "../repositories/produtos.repository";
import {
  IConsultaCategoriasProdutoRepository,
  IEscritaProdutosRepository,
  ILeituraProdutosRepository,
  IStatusProdutosRepository,
} from "../repositories/interfaces/produtos-repository.interface";

export interface DadosProdutoValidados {
  nome: string;
  slug: string;
  descricao?: string | null;
  precoBase: number;
  percentualDesconto: number;
  precoFinal: number;
  material?: string | null;
  colecao?: string | null;
}

export interface IGeradorSlugProduto {
  gerar(texto: string): string;
}

export interface ICalculadoraPrecoProduto {
  calcularPrecoFinal(precoBase: number, percentualDesconto: number): number;
}

export interface IValidadorDadosProduto {
  validar(data: CriarProdutoDTO): DadosProdutoValidados;
}

export class GeradorSlugProdutoPadrao implements IGeradorSlugProduto {
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

export class CalculadoraPrecoProdutoComDesconto
  implements ICalculadoraPrecoProduto
{
  calcularPrecoFinal(precoBase: number, percentualDesconto: number) {
    const desconto = precoBase * (percentualDesconto / 100);
    return Number((precoBase - desconto).toFixed(2));
  }
}

export class ValidadorDadosProdutoPadrao implements IValidadorDadosProduto {
  constructor(
    private geradorSlugProduto: IGeradorSlugProduto,
    private calculadoraPrecoProduto: ICalculadoraPrecoProduto
  ) {}

  private validarNome(nome: unknown) {
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

  private validarPrecoBase(precoBase: unknown) {
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

  private validarPercentualDesconto(percentualDesconto: unknown) {
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

  validar(data: CriarProdutoDTO) {
    const nome = this.validarNome(data.nome);
    const precoBase = this.validarPrecoBase(data.precoBase);
    const percentualDesconto = this.validarPercentualDesconto(
      data.percentualDesconto
    );
    const slug = this.geradorSlugProduto.gerar(nome);
    const precoFinal = this.calculadoraPrecoProduto.calcularPrecoFinal(
      precoBase,
      percentualDesconto
    );

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

export class ProdutosService {
  constructor(
    private leituraProdutosRepository: ILeituraProdutosRepository,
    private escritaProdutosRepository: IEscritaProdutosRepository,
    private statusProdutosRepository: IStatusProdutosRepository,
    private categoriasProdutoRepository: IConsultaCategoriasProdutoRepository,
    private validadorDadosProduto: IValidadorDadosProduto
  ) {}

  private async validarCategoria(categoriaId: unknown, mensagemInativa: string) {
    if (!categoriaId) {
      throw new Error("A categoria do produto é obrigatória.");
    }

    const categoria = await this.categoriasProdutoRepository.buscarCategoriaPorId(
      String(categoriaId)
    );

    if (!categoria) {
      throw new Error("Categoria não encontrada.");
    }

    if (!categoria.ativo) {
      throw new Error(mensagemInativa);
    }

    return String(categoriaId);
  }

  async criar(data: CriarProdutoDTO) {
    const dadosProduto = this.validadorDadosProduto.validar(data);

    const categoriaId = await this.validarCategoria(
      data.categoriaId,
      "Não é possível criar produto em uma categoria inativa."
    );

    const produtoExistente =
      await this.leituraProdutosRepository.buscarProdutoSimplesPorSlug(
        dadosProduto.slug
      );

    if (produtoExistente) {
      throw new Error("Já existe um produto com esse nome.");
    }

    return this.escritaProdutosRepository.criarProduto({
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
    return this.leituraProdutosRepository.listarProdutosAtivos();
  }

  async buscarPorSlug(data: BuscarProdutoPorSlugDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoPorSlug(
      data.slug
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return produto;
  }

  async buscarPorId(data: BuscarProdutoPorIdDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoPorId(
      data.id
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return produto;
  }

  async atualizar(data: AtualizarProdutoDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoSimplesPorId(
      data.id
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    const dadosProduto = this.validadorDadosProduto.validar(data);

    const categoriaId = await this.validarCategoria(
      data.categoriaId,
      "Não é possível vincular produto a uma categoria inativa."
    );

    const produtoComMesmoSlug =
      await this.leituraProdutosRepository.buscarProdutoSimplesPorSlug(
        dadosProduto.slug
      );

    if (produtoComMesmoSlug && produtoComMesmoSlug.id !== data.id) {
      throw new Error("Já existe outro produto com esse nome.");
    }

    return this.escritaProdutosRepository.atualizarProduto(data.id, {
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

  async desativar(data: DesativarProdutoDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoSimplesPorId(
      data.id
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (!produto.ativo) {
      throw new Error("Produto já está desativado.");
    }

    return this.statusProdutosRepository.atualizarStatusProduto(data.id, false);
  }

  async ativar(data: AtivarProdutoDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoSimplesPorId(
      data.id
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (produto.ativo) {
      throw new Error("Produto já está ativo.");
    }

    return this.statusProdutosRepository.atualizarStatusProduto(data.id, true);
  }

  async remover(data: RemoverProdutoDTO) {
    const produto = await this.leituraProdutosRepository.buscarProdutoSimplesPorId(
      data.id
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    const produtoRemovido =
      await this.statusProdutosRepository.atualizarStatusProduto(
        data.id,
        false
      );

    return {
      message: "Produto removido com sucesso.",
      produto: produtoRemovido,
    };
  }
}

const geradorSlugProduto = new GeradorSlugProdutoPadrao();
const calculadoraPrecoProduto = new CalculadoraPrecoProdutoComDesconto();
const validadorDadosProduto = new ValidadorDadosProdutoPadrao(
  geradorSlugProduto,
  calculadoraPrecoProduto
);

export const produtosService = new ProdutosService(
  produtosRepository,
  produtosRepository,
  produtosRepository,
  produtosRepository,
  validadorDadosProduto
);
