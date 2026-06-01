"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.carrinhosService = exports.CarrinhosService = exports.RegraItemCarrinhoPadrao = exports.RegraCarrinhoAtivoPadrao = exports.ValidadorQuantidadeCarrinhoPadrao = exports.CalculadoraQuantidadeFinalCarrinhoPadrao = exports.CalculadoraTotaisItemCarrinhoPadrao = void 0;
const enums_1 = require("../generated/prisma/enums");
const carrinhos_repository_1 = require("../repositories/carrinhos.repository");
class CalculadoraTotaisItemCarrinhoPadrao {
    calcular(precoFinalProduto, precoAdicionalVariacao, quantidade) {
        const precoProduto = Number(precoFinalProduto);
        const precoAdicional = Number(precoAdicionalVariacao);
        const precoUnitario = precoProduto + precoAdicional;
        const subtotal = precoUnitario * quantidade;
        return {
            precoUnitario: Number(precoUnitario.toFixed(2)),
            subtotal: Number(subtotal.toFixed(2)),
        };
    }
}
exports.CalculadoraTotaisItemCarrinhoPadrao = CalculadoraTotaisItemCarrinhoPadrao;
class CalculadoraQuantidadeFinalCarrinhoPadrao {
    calcular(itemExistente, quantidade) {
        return itemExistente ? itemExistente.quantidade + quantidade : quantidade;
    }
}
exports.CalculadoraQuantidadeFinalCarrinhoPadrao = CalculadoraQuantidadeFinalCarrinhoPadrao;
class ValidadorQuantidadeCarrinhoPadrao {
    validar(quantidade) {
        const quantidadeNumber = Number(quantidade);
        if (Number.isNaN(quantidadeNumber) || !Number.isInteger(quantidadeNumber)) {
            throw new Error("A quantidade deve ser um número inteiro.");
        }
        if (quantidadeNumber < 1) {
            throw new Error("A quantidade deve ser maior ou igual a 1.");
        }
        return quantidadeNumber;
    }
}
exports.ValidadorQuantidadeCarrinhoPadrao = ValidadorQuantidadeCarrinhoPadrao;
class RegraCarrinhoAtivoPadrao {
    validar(status, mensagem = "Não é possível alterar um carrinho que não está ativo.") {
        if (status !== enums_1.StatusCarrinho.ATIVO) {
            throw new Error(mensagem);
        }
    }
}
exports.RegraCarrinhoAtivoPadrao = RegraCarrinhoAtivoPadrao;
class RegraItemCarrinhoPadrao {
    validarProduto(produto) {
        if (!produto.ativo) {
            throw new Error("Produto inativo não pode ser adicionado ao carrinho.");
        }
    }
    validarVariacao(produto, variacao) {
        if (!variacao.ativo) {
            throw new Error("Variação inativa não pode ser adicionada ao carrinho.");
        }
        if (variacao.produtoId !== produto.id) {
            throw new Error("A variação informada não pertence ao produto informado.");
        }
    }
    validarEstoque(quantidade, estoque) {
        if (quantidade > estoque) {
            throw new Error("Quantidade solicitada maior que o estoque disponível.");
        }
    }
    validarPertencimentoItem(item, carrinhoId) {
        if (!item || item.carrinhoId !== carrinhoId) {
            throw new Error("Item do carrinho não encontrado.");
        }
    }
}
exports.RegraItemCarrinhoPadrao = RegraItemCarrinhoPadrao;
class CarrinhosService {
    constructor(carrinhosRepository, calculadoraTotaisItemCarrinho, calculadoraQuantidadeFinalCarrinho, validadorQuantidadeCarrinho, regraCarrinhoAtivo, regraItemCarrinho) {
        this.carrinhosRepository = carrinhosRepository;
        this.calculadoraTotaisItemCarrinho = calculadoraTotaisItemCarrinho;
        this.calculadoraQuantidadeFinalCarrinho = calculadoraQuantidadeFinalCarrinho;
        this.validadorQuantidadeCarrinho = validadorQuantidadeCarrinho;
        this.regraCarrinhoAtivo = regraCarrinhoAtivo;
        this.regraItemCarrinho = regraItemCarrinho;
    }
    async criar(data) {
        const { clienteId } = data;
        if (clienteId) {
            const cliente = await this.carrinhosRepository.buscarClientePorId(String(clienteId));
            if (!cliente) {
                throw new Error("Cliente não encontrado.");
            }
        }
        const carrinho = await this.carrinhosRepository.criarCarrinho(clienteId ? String(clienteId) : null);
        return carrinho;
    }
    async listar() {
        const carrinhos = await this.carrinhosRepository.listarCarrinhos();
        return carrinhos;
    }
    async buscarPorId(id) {
        const carrinho = await this.carrinhosRepository.buscarCarrinhoPorId(id);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        return carrinho;
    }
    async adicionarItem(data) {
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
        const quantidadeNumber = this.validadorQuantidadeCarrinho.validar(quantidade);
        const carrinho = await this.carrinhosRepository.buscarCarrinhoSimplesPorId(carrinhoId);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCarrinhoAtivo.validar(carrinho.status);
        const produto = await this.carrinhosRepository.buscarProdutoPorId(String(produtoId));
        if (!produto) {
            throw new Error("Produto não encontrado.");
        }
        this.regraItemCarrinho.validarProduto(produto);
        const variacao = await this.carrinhosRepository.buscarVariacaoPorId(String(variacaoId));
        if (!variacao) {
            throw new Error("Variação de produto não encontrada.");
        }
        this.regraItemCarrinho.validarVariacao(produto, variacao);
        const itemExistente = await this.carrinhosRepository.buscarItemExistente(carrinhoId, String(produtoId), String(variacaoId));
        const quantidadeFinal = this.calculadoraQuantidadeFinalCarrinho.calcular(itemExistente, quantidadeNumber);
        this.regraItemCarrinho.validarEstoque(quantidadeFinal, variacao.estoque);
        const { precoUnitario, subtotal } = this.calculadoraTotaisItemCarrinho.calcular(produto.precoFinal, variacao.precoAdicional, quantidadeFinal);
        if (itemExistente) {
            return this.carrinhosRepository.atualizarItemCarrinho(itemExistente.id, {
                quantidade: quantidadeFinal,
                precoUnitario,
                subtotal,
            });
        }
        return this.carrinhosRepository.criarItemCarrinho({
            carrinhoId,
            produtoId: String(produtoId),
            variacaoId: String(variacaoId),
            quantidade: quantidadeNumber,
            precoUnitario,
            subtotal,
        });
    }
    async atualizarQuantidadeItem(data) {
        const { carrinhoId, itemId, quantidade } = data;
        const carrinho = await this.carrinhosRepository.buscarCarrinhoSimplesPorId(carrinhoId);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCarrinhoAtivo.validar(carrinho.status);
        const item = await this.carrinhosRepository.buscarItemPorId(itemId);
        this.regraItemCarrinho.validarPertencimentoItem(item, carrinhoId);
        const quantidadeNumber = this.validadorQuantidadeCarrinho.validar(quantidade);
        this.regraItemCarrinho.validarEstoque(quantidadeNumber, item.variacao.estoque);
        const { precoUnitario, subtotal } = this.calculadoraTotaisItemCarrinho.calcular(item.produto.precoFinal, item.variacao.precoAdicional, quantidadeNumber);
        const itemAtualizado = await this.carrinhosRepository.atualizarItemCarrinho(itemId, {
            quantidade: quantidadeNumber,
            precoUnitario,
            subtotal,
        });
        return itemAtualizado;
    }
    async removerItem(data) {
        const { carrinhoId, itemId } = data;
        const carrinho = await this.carrinhosRepository.buscarCarrinhoSimplesPorId(carrinhoId);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCarrinhoAtivo.validar(carrinho.status);
        const item = await this.carrinhosRepository.buscarItemPorId(itemId);
        this.regraItemCarrinho.validarPertencimentoItem(item, carrinhoId);
        await this.carrinhosRepository.removerItemCarrinho(itemId);
        return {
            message: "Item removido do carrinho com sucesso.",
        };
    }
    async limpar(data) {
        const { carrinhoId } = data;
        const carrinho = await this.carrinhosRepository.buscarCarrinhoSimplesPorId(carrinhoId);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCarrinhoAtivo.validar(carrinho.status, "Não é possível limpar um carrinho que não está ativo.");
        await this.carrinhosRepository.limparItensDoCarrinho(carrinhoId);
        return {
            message: "Carrinho limpo com sucesso.",
        };
    }
    async abandonar(data) {
        const { carrinhoId } = data;
        const carrinho = await this.carrinhosRepository.buscarCarrinhoSimplesPorId(carrinhoId);
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCarrinhoAtivo.validar(carrinho.status, "Somente carrinho ativo pode ser abandonado.");
        const carrinhoAtualizado = await this.carrinhosRepository.atualizarStatusCarrinho(carrinhoId, enums_1.StatusCarrinho.ABANDONADO);
        return carrinhoAtualizado;
    }
}
exports.CarrinhosService = CarrinhosService;
const calculadoraTotaisItemCarrinho = new CalculadoraTotaisItemCarrinhoPadrao();
const calculadoraQuantidadeFinalCarrinho = new CalculadoraQuantidadeFinalCarrinhoPadrao();
const validadorQuantidadeCarrinho = new ValidadorQuantidadeCarrinhoPadrao();
const regraCarrinhoAtivo = new RegraCarrinhoAtivoPadrao();
const regraItemCarrinho = new RegraItemCarrinhoPadrao();
exports.carrinhosService = new CarrinhosService(carrinhos_repository_1.carrinhosRepository, calculadoraTotaisItemCarrinho, calculadoraQuantidadeFinalCarrinho, validadorQuantidadeCarrinho, regraCarrinhoAtivo, regraItemCarrinho);
