import { StatusCarrinho } from "../generated/prisma/enums";
import { carrinhosRepository } from "../repositories/carrinhos.repository";
import {
  CriarCarrinhoDTO,
  AdicionarItemCarrinhoDTO,
  AtualizarQuantidadeItemCarrinhoDTO,
  RemoverItemCarrinhoDTO,
  LimparCarrinhoDTO,
  AbandonarCarrinhoDTO,
} from "../models/carrinho.model";

class CarrinhosService {
  private calcularSubtotalItem(
    precoFinalProduto: unknown,
    precoAdicionalVariacao: unknown,
    quantidade: number
  ) {
    const precoProduto = Number(precoFinalProduto);
    const precoAdicional = Number(precoAdicionalVariacao);
    const precoUnitario = precoProduto + precoAdicional;
    const subtotal = precoUnitario * quantidade;

    return {
      precoUnitario: Number(precoUnitario.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)),
    };
  }

  private validarQuantidade(quantidade: unknown) {
    const quantidadeNumber = Number(quantidade);

    if (Number.isNaN(quantidadeNumber) || !Number.isInteger(quantidadeNumber)) {
      throw new Error("A quantidade deve ser um número inteiro.");
    }

    if (quantidadeNumber < 1) {
      throw new Error("A quantidade deve ser maior ou igual a 1.");
    }

    return quantidadeNumber;
  }

  private validarCarrinhoAtivo(status: StatusCarrinho) {
    if (status !== StatusCarrinho.ATIVO) {
      throw new Error("Não é possível alterar um carrinho que não está ativo.");
    }
  }

  async criar(data: CriarCarrinhoDTO) {
    const { clienteId } = data;

    if (clienteId) {
      const cliente = await carrinhosRepository.buscarClientePorId(
        String(clienteId)
      );

      if (!cliente) {
        throw new Error("Cliente não encontrado.");
      }
    }

    const carrinho = await carrinhosRepository.criarCarrinho(
      clienteId ? String(clienteId) : null
    );

    return carrinho;
  }

  async listar() {
    const carrinhos = await carrinhosRepository.listarCarrinhos();

    return carrinhos;
  }

  async buscarPorId(id: string) {
    const carrinho = await carrinhosRepository.buscarCarrinhoPorId(id);

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    return carrinho;
  }

  async adicionarItem(data: AdicionarItemCarrinhoDTO) {
    const { carrinhoId, produtoId, variacaoId, quantidade } = data;

    if (!produtoId) {
      throw new Error("O produto é obrigatório.");
    }

    if (!variacaoId) {
      throw new Error("A variação do produto é obrigatória.");
    }

    if (!quantidade) {
      throw new Error("A quantidade é obrigatória.");
    }

    const quantidadeNumber = this.validarQuantidade(quantidade);

    const carrinho = await carrinhosRepository.buscarCarrinhoSimplesPorId(
      carrinhoId
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.validarCarrinhoAtivo(carrinho.status);

    const produto = await carrinhosRepository.buscarProdutoPorId(
      String(produtoId)
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    if (!produto.ativo) {
      throw new Error("Produto inativo não pode ser adicionado ao carrinho.");
    }

    const variacao = await carrinhosRepository.buscarVariacaoPorId(
      String(variacaoId)
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    if (!variacao.ativo) {
      throw new Error("Variação inativa não pode ser adicionada ao carrinho.");
    }

    if (variacao.produtoId !== produto.id) {
      throw new Error("A variação informada não pertence ao produto informado.");
    }

    const itemExistente = await carrinhosRepository.buscarItemExistente(
      carrinhoId,
      String(produtoId),
      String(variacaoId)
    );

    const quantidadeFinal = itemExistente
      ? itemExistente.quantidade + quantidadeNumber
      : quantidadeNumber;

    if (quantidadeFinal > variacao.estoque) {
      throw new Error("Quantidade solicitada maior que o estoque disponível.");
    }

    const { precoUnitario, subtotal } = this.calcularSubtotalItem(
      produto.precoFinal,
      variacao.precoAdicional,
      quantidadeFinal
    );

    if (itemExistente) {
      return carrinhosRepository.atualizarItemCarrinho(itemExistente.id, {
        quantidade: quantidadeFinal,
        precoUnitario,
        subtotal,
      });
    }

    return carrinhosRepository.criarItemCarrinho({
      carrinhoId,
      produtoId: String(produtoId),
      variacaoId: String(variacaoId),
      quantidade: quantidadeNumber,
      precoUnitario,
      subtotal,
    });
  }

  async atualizarQuantidadeItem(data: AtualizarQuantidadeItemCarrinhoDTO) {
    const { carrinhoId, itemId, quantidade } = data;

    const carrinho = await carrinhosRepository.buscarCarrinhoSimplesPorId(
      carrinhoId
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.validarCarrinhoAtivo(carrinho.status);

    const item = await carrinhosRepository.buscarItemPorId(itemId);

    if (!item || item.carrinhoId !== carrinhoId) {
      throw new Error("Item do carrinho não encontrado.");
    }

    const quantidadeNumber = this.validarQuantidade(quantidade);

    if (quantidadeNumber > item.variacao.estoque) {
      throw new Error("Quantidade solicitada maior que o estoque disponível.");
    }

    const { precoUnitario, subtotal } = this.calcularSubtotalItem(
      item.produto.precoFinal,
      item.variacao.precoAdicional,
      quantidadeNumber
    );

    const itemAtualizado = await carrinhosRepository.atualizarItemCarrinho(
      itemId,
      {
        quantidade: quantidadeNumber,
        precoUnitario,
        subtotal,
      }
    );

    return itemAtualizado;
  }

  async removerItem(data: RemoverItemCarrinhoDTO) {
    const { carrinhoId, itemId } = data;

    const carrinho = await carrinhosRepository.buscarCarrinhoSimplesPorId(
      carrinhoId
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.validarCarrinhoAtivo(carrinho.status);

    const item = await carrinhosRepository.buscarItemPorId(itemId);

    if (!item || item.carrinhoId !== carrinhoId) {
      throw new Error("Item do carrinho não encontrado.");
    }

    await carrinhosRepository.removerItemCarrinho(itemId);

    return {
      message: "Item removido do carrinho com sucesso.",
    };
  }

  async limpar(data: LimparCarrinhoDTO) {
    const { carrinhoId } = data;

    const carrinho = await carrinhosRepository.buscarCarrinhoSimplesPorId(
      carrinhoId
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    if (carrinho.status !== StatusCarrinho.ATIVO) {
      throw new Error("Não é possível limpar um carrinho que não está ativo.");
    }

    await carrinhosRepository.limparItensDoCarrinho(carrinhoId);

    return {
      message: "Carrinho limpo com sucesso.",
    };
  }

  async abandonar(data: AbandonarCarrinhoDTO) {
    const { carrinhoId } = data;

    const carrinho = await carrinhosRepository.buscarCarrinhoSimplesPorId(
      carrinhoId
    );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    if (carrinho.status !== StatusCarrinho.ATIVO) {
      throw new Error("Somente carrinho ativo pode ser abandonado.");
    }

    const carrinhoAtualizado = await carrinhosRepository.atualizarStatusCarrinho(
      carrinhoId,
      StatusCarrinho.ABANDONADO
    );

    return carrinhoAtualizado;
  }
}

export const carrinhosService = new CarrinhosService();