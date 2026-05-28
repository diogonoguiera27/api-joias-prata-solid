import {
  AtivarVariacaoProdutoDTO,
  AtualizarEstoqueVariacaoProdutoDTO,
  AtualizarVariacaoProdutoDTO,
  BuscarVariacaoProdutoPorIdDTO,
  CriarVariacaoProdutoDTO,
  DesativarVariacaoProdutoDTO,
  ListarVariacoesProdutoDTO,
  RemoverVariacaoProdutoDTO,
} from "../models/variacao-produto.model";
import { variacoesProdutoRepository } from "../repositories/variacoes-produto.repository";

class VariacoesProdutoService {
  private validarNome(nome: unknown) {
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

  private validarSku(sku: unknown) {
    if (!sku) {
      throw new Error("O SKU da variação é obrigatório.");
    }

    if (typeof sku !== "string") {
      throw new Error("O SKU deve ser um texto.");
    }

    return sku.trim().toUpperCase();
  }

  private validarPrecoAdicional(precoAdicional: unknown) {
    const precoAdicionalNumber = Number(precoAdicional ?? 0);

    if (Number.isNaN(precoAdicionalNumber)) {
      throw new Error("O preço adicional deve ser um número válido.");
    }

    if (precoAdicionalNumber < 0) {
      throw new Error("O preço adicional não pode ser negativo.");
    }

    return precoAdicionalNumber;
  }

  private validarEstoque(estoque: unknown, mensagemObrigatorio?: string) {
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

  private async validarProduto(produtoId: unknown, mensagemInativo: string) {
    if (!produtoId) {
      throw new Error("O produto é obrigatório.");
    }

    const produto = await variacoesProdutoRepository.buscarProdutoPorId(
      String(produtoId)
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (!produto.ativo) {
      throw new Error(mensagemInativo);
    }

    return String(produtoId);
  }

  private montarDadosVariacao(data: CriarVariacaoProdutoDTO) {
    return {
      nome: this.validarNome(data.nome),
      sku: this.validarSku(data.sku),
      tamanho: data.tamanho,
      cor: data.cor,
      precoAdicional: this.validarPrecoAdicional(data.precoAdicional),
      estoque: this.validarEstoque(data.estoque),
    };
  }

  async criar(data: CriarVariacaoProdutoDTO) {
    const produtoId = await this.validarProduto(
      data.produtoId,
      "Não é possível criar variação para um produto inativo."
    );
    const dadosVariacao = this.montarDadosVariacao(data);

    const variacaoComMesmoSku =
      await variacoesProdutoRepository.buscarVariacaoPorSku(dadosVariacao.sku);

    if (variacaoComMesmoSku) {
      throw new Error("Já existe uma variação com esse SKU.");
    }

    return variacoesProdutoRepository.criarVariacao({
      produtoId,
      ...dadosVariacao,
    });
  }

  async listar() {
    return variacoesProdutoRepository.listarVariacoesAtivas();
  }

  async listarPorProduto(data: ListarVariacoesProdutoDTO) {
    const produto = await variacoesProdutoRepository.buscarProdutoPorId(
      data.produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return variacoesProdutoRepository.listarVariacoesPorProduto(data.produtoId);
  }

  async buscarPorId(data: BuscarVariacaoProdutoPorIdDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoDetalhadaPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    return variacao;
  }

  async atualizar(data: AtualizarVariacaoProdutoDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const produtoId = await this.validarProduto(
      data.produtoId,
      "Não é possível vincular a variação a um produto inativo."
    );
    const dadosVariacao = this.montarDadosVariacao(data);

    const variacaoComMesmoSku =
      await variacoesProdutoRepository.buscarVariacaoPorSku(dadosVariacao.sku);

    if (variacaoComMesmoSku && variacaoComMesmoSku.id !== data.id) {
      throw new Error("Já existe outra variação com esse SKU.");
    }

    return variacoesProdutoRepository.atualizarVariacao(data.id, {
      produtoId,
      ...dadosVariacao,
    });
  }

  async atualizarEstoque(data: AtualizarEstoqueVariacaoProdutoDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const novoEstoque = this.validarEstoque(
      data.estoque,
      "O estoque é obrigatório."
    );
    const diferenca = novoEstoque - variacao.estoque;

    return variacoesProdutoRepository.atualizarEstoque(data.id, {
      novoEstoque,
      diferenca,
      estoqueAtual: variacao.estoque,
      motivo: data.motivo,
    });
  }

  async desativar(data: DesativarVariacaoProdutoDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    if (!variacao.ativo) {
      throw new Error("Variação já está desativada.");
    }

    return variacoesProdutoRepository.atualizarStatusVariacao(data.id, false);
  }

  async ativar(data: AtivarVariacaoProdutoDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    if (variacao.ativo) {
      throw new Error("Variação já está ativa.");
    }

    return variacoesProdutoRepository.atualizarStatusVariacao(data.id, true);
  }

  async remover(data: RemoverVariacaoProdutoDTO) {
    const variacao = await variacoesProdutoRepository.buscarVariacaoPorId(
      data.id
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const variacaoRemovida =
      await variacoesProdutoRepository.atualizarStatusVariacao(data.id, false);

    return {
      message: "Variação removida com sucesso.",
      variacao: variacaoRemovida,
    };
  }
}

export const variacoesProdutoService = new VariacoesProdutoService();
