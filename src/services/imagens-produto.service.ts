import {
  AtualizarImagemProdutoDTO,
  BuscarImagemProdutoPorIdDTO,
  CriarImagemProdutoDTO,
  DefinirImagemPrincipalDTO,
  ListarImagensProdutoDTO,
  RemoverImagemProdutoDTO,
} from "../models/imagem-produto.model";
import { imagensProdutoRepository } from "../repositories/imagens-produto.repository";

type ImagensProdutoRepository = typeof imagensProdutoRepository;

export interface DadosImagemProdutoValidados {
  url: string;
  textoAlt?: string | null;
  principal: boolean;
}

export interface IValidadorDadosImagemProduto {
  validar(data: CriarImagemProdutoDTO | AtualizarImagemProdutoDTO): DadosImagemProdutoValidados;
}

export interface IRegraImagemPrincipalProduto {
  aplicar(produtoId: string, principal: boolean): Promise<void>;
}

export class ValidadorDadosImagemProdutoPadrao
  implements IValidadorDadosImagemProduto
{
  private validarUrl(url: unknown) {
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

  validar(data: CriarImagemProdutoDTO | AtualizarImagemProdutoDTO) {
    return {
      url: this.validarUrl(data.url),
      textoAlt: data.textoAlt,
      principal: Boolean(data.principal),
    };
  }
}

export class RegraImagemPrincipalProdutoUnica
  implements IRegraImagemPrincipalProduto
{
  constructor(private imagensProdutoRepository: ImagensProdutoRepository) {}

  async aplicar(produtoId: string, principal: boolean) {
    if (principal) {
      await this.imagensProdutoRepository.removerPrincipalDasImagens(produtoId);
    }
  }
}

export class ImagensProdutoService {
  constructor(
    private imagensProdutoRepository: ImagensProdutoRepository,
    private validadorDadosImagemProduto: IValidadorDadosImagemProduto,
    private regraImagemPrincipalProduto: IRegraImagemPrincipalProduto
  ) {}

  async criar(data: CriarImagemProdutoDTO) {
    if (!data.produtoId) {
      throw new Error("O produto é obrigatório.");
    }

    const produtoId = String(data.produtoId);
    const produto = await this.imagensProdutoRepository.buscarProdutoPorId(
      produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (!produto.ativo) {
      throw new Error("Não é possível adicionar imagem a um produto inativo.");
    }

    const dadosImagem = this.validadorDadosImagemProduto.validar(data);
    await this.regraImagemPrincipalProduto.aplicar(
      produtoId,
      dadosImagem.principal
    );

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

  async listarPorProduto(data: ListarImagensProdutoDTO) {
    const produto = await this.imagensProdutoRepository.buscarProdutoPorId(
      data.produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return this.imagensProdutoRepository.listarImagensPorProduto(
      data.produtoId
    );
  }

  async buscarPorId(data: BuscarImagemProdutoPorIdDTO) {
    const imagem =
      await this.imagensProdutoRepository.buscarImagemDetalhadaPorId(data.id);

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    return imagem;
  }

  async atualizar(data: AtualizarImagemProdutoDTO) {
    const imagem = await this.imagensProdutoRepository.buscarImagemPorId(
      data.id
    );

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    const dadosImagem = this.validadorDadosImagemProduto.validar(data);
    await this.regraImagemPrincipalProduto.aplicar(
      imagem.produtoId,
      dadosImagem.principal
    );

    return this.imagensProdutoRepository.atualizarImagem(data.id, {
      url: dadosImagem.url,
      textoAlt: dadosImagem.textoAlt,
      principal: dadosImagem.principal,
    });
  }

  async definirPrincipal(data: DefinirImagemPrincipalDTO) {
    const imagem = await this.imagensProdutoRepository.buscarImagemPorId(
      data.id
    );

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    await this.regraImagemPrincipalProduto.aplicar(imagem.produtoId, true);

    return this.imagensProdutoRepository.definirImagemPrincipal(data.id);
  }

  async remover(data: RemoverImagemProdutoDTO) {
    const imagem = await this.imagensProdutoRepository.buscarImagemPorId(
      data.id
    );

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    await this.imagensProdutoRepository.removerImagem(data.id);

    return {
      message: "Imagem removida com sucesso.",
    };
  }
}

const validadorDadosImagemProduto = new ValidadorDadosImagemProdutoPadrao();
const regraImagemPrincipalProduto = new RegraImagemPrincipalProdutoUnica(
  imagensProdutoRepository
);

export const imagensProdutoService = new ImagensProdutoService(
  imagensProdutoRepository,
  validadorDadosImagemProduto,
  regraImagemPrincipalProduto
);
