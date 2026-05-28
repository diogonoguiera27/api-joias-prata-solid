import { TipoMovimentacaoEstoque } from "../generated/prisma/enums";
import {
  BuscarMovimentacaoEstoquePorIdDTO,
  CriarMovimentacaoEstoqueDTO,
  ListarMovimentacoesEstoquePorVariacaoDTO,
} from "../models/movimentacao-estoque.model";
import { movimentacoesEstoqueRepository } from "../repositories/movimentacoes-estoque.repository";

class MovimentacoesEstoqueService {
  private validarTipoMovimentacao(tipo: unknown) {
    if (!tipo) {
      throw new Error("O tipo da movimentação é obrigatório.");
    }

    const tipoFormatado = String(tipo).toUpperCase();
    const tiposPermitidos = Object.values(TipoMovimentacaoEstoque);

    if (!tiposPermitidos.includes(tipoFormatado as TipoMovimentacaoEstoque)) {
      throw new Error(
        "Tipo de movimentação inválido. Use ENTRADA, SAIDA, AJUSTE, VENDA ou DEVOLUCAO_CANCELAMENTO."
      );
    }

    return tipoFormatado as TipoMovimentacaoEstoque;
  }

  private validarQuantidade(quantidade: unknown) {
    if (quantidade === undefined || quantidade === null) {
      throw new Error("A quantidade é obrigatória.");
    }

    const quantidadeNumber = Number(quantidade);

    if (Number.isNaN(quantidadeNumber)) {
      throw new Error("A quantidade deve ser um número válido.");
    }

    if (!Number.isInteger(quantidadeNumber)) {
      throw new Error("A quantidade deve ser um número inteiro.");
    }

    if (quantidadeNumber <= 0) {
      throw new Error("A quantidade deve ser maior que zero.");
    }

    return quantidadeNumber;
  }

  private calcularNovoEstoque(
    estoqueAtual: number,
    tipo: TipoMovimentacaoEstoque,
    quantidade: number
  ) {
    if (
      tipo === TipoMovimentacaoEstoque.ENTRADA ||
      tipo === TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO
    ) {
      return estoqueAtual + quantidade;
    }

    if (
      tipo === TipoMovimentacaoEstoque.SAIDA ||
      tipo === TipoMovimentacaoEstoque.VENDA
    ) {
      return estoqueAtual - quantidade;
    }

    if (tipo === TipoMovimentacaoEstoque.AJUSTE) {
      return quantidade;
    }

    return estoqueAtual;
  }

  async criar(data: CriarMovimentacaoEstoqueDTO) {
    if (!data.variacaoId) {
      throw new Error("A variação do produto é obrigatória.");
    }

    const variacaoId = String(data.variacaoId);
    const variacao = await movimentacoesEstoqueRepository.buscarVariacaoPorId(
      variacaoId
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    if (!variacao.ativo) {
      throw new Error(
        "Não é possível movimentar estoque de uma variação inativa."
      );
    }

    const tipo = this.validarTipoMovimentacao(data.tipo);
    const quantidade = this.validarQuantidade(data.quantidade);
    const novoEstoque = this.calcularNovoEstoque(
      variacao.estoque,
      tipo,
      quantidade
    );

    if (novoEstoque < 0) {
      throw new Error("A movimentação deixaria o estoque negativo.");
    }

    return movimentacoesEstoqueRepository.criarMovimentacaoEAtualizarEstoque({
      variacaoId,
      tipo,
      quantidade,
      motivo: data.motivo,
      novoEstoque,
    });
  }

  async listar() {
    return movimentacoesEstoqueRepository.listarMovimentacoes();
  }

  async listarPorVariacao(data: ListarMovimentacoesEstoquePorVariacaoDTO) {
    const variacao = await movimentacoesEstoqueRepository.buscarVariacaoPorId(
      data.variacaoId
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    return movimentacoesEstoqueRepository.listarMovimentacoesPorVariacao(
      data.variacaoId
    );
  }

  async buscarPorId(data: BuscarMovimentacaoEstoquePorIdDTO) {
    const movimentacao =
      await movimentacoesEstoqueRepository.buscarMovimentacaoPorId(data.id);

    if (!movimentacao) {
      throw new Error("Movimentação de estoque não encontrada.");
    }

    return movimentacao;
  }
}

export const movimentacoesEstoqueService = new MovimentacoesEstoqueService();
