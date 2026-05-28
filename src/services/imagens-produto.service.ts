import {
  AtualizarImagemProdutoDTO,
  BuscarImagemProdutoPorIdDTO,
  CriarImagemProdutoDTO,
  DefinirImagemPrincipalDTO,
  ListarImagensProdutoDTO,
  RemoverImagemProdutoDTO,
} from "../models/imagem-produto.model";
import { imagensProdutoRepository } from "../repositories/imagens-produto.repository";

class ImagensProdutoService {
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

  async criar(data: CriarImagemProdutoDTO) {
    if (!data.produtoId) {
      throw new Error("O produto é obrigatório.");
    }

    const produtoId = String(data.produtoId);
    const produto = await imagensProdutoRepository.buscarProdutoPorId(
      produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (!produto.ativo) {
      throw new Error("Não é possível adicionar imagem a um produto inativo.");
    }

    const url = this.validarUrl(data.url);
    const principal = Boolean(data.principal);

    if (principal) {
      await imagensProdutoRepository.removerPrincipalDasImagens(produtoId);
    }

    return imagensProdutoRepository.criarImagem({
      produtoId,
      url,
      textoAlt: data.textoAlt,
      principal,
    });
  }

  async listar() {
    return imagensProdutoRepository.listarImagens();
  }

  async listarPorProduto(data: ListarImagensProdutoDTO) {
    const produto = await imagensProdutoRepository.buscarProdutoPorId(
      data.produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return imagensProdutoRepository.listarImagensPorProduto(data.produtoId);
  }

  async buscarPorId(data: BuscarImagemProdutoPorIdDTO) {
    const imagem = await imagensProdutoRepository.buscarImagemDetalhadaPorId(
      data.id
    );

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    return imagem;
  }

  async atualizar(data: AtualizarImagemProdutoDTO) {
    const imagem = await imagensProdutoRepository.buscarImagemPorId(data.id);

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    const url = this.validarUrl(data.url);
    const principal = Boolean(data.principal);

    if (principal) {
      await imagensProdutoRepository.removerPrincipalDasImagens(
        imagem.produtoId
      );
    }

    return imagensProdutoRepository.atualizarImagem(data.id, {
      url,
      textoAlt: data.textoAlt,
      principal,
    });
  }

  async definirPrincipal(data: DefinirImagemPrincipalDTO) {
    const imagem = await imagensProdutoRepository.buscarImagemPorId(data.id);

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    await imagensProdutoRepository.removerPrincipalDasImagens(imagem.produtoId);

    return imagensProdutoRepository.definirImagemPrincipal(data.id);
  }

  async remover(data: RemoverImagemProdutoDTO) {
    const imagem = await imagensProdutoRepository.buscarImagemPorId(data.id);

    if (!imagem) {
      throw new Error("Imagem não encontrada.");
    }

    await imagensProdutoRepository.removerImagem(data.id);

    return {
      message: "Imagem removida com sucesso.",
    };
  }
}

export const imagensProdutoService = new ImagensProdutoService();
