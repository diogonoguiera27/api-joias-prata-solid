"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pedidosService = exports.PedidosService = exports.RegraCancelamentoPedidoPadrao = exports.RegraAtualizacaoStatusPedidoPadrao = exports.ValidadorItensPedidoPadrao = exports.ValidadorStatusPedidoPadrao = exports.MontadorDadosPedidoPadrao = exports.RegraCriacaoPedidoPadrao = exports.CalculadoraTotaisPedidoPadrao = void 0;
const enums_1 = require("../generated/prisma/enums");
const pedidos_repository_1 = require("../repositories/pedidos.repository");
class CalculadoraTotaisPedidoPadrao {
    calcular(itens) {
        const subtotal = itens.reduce((acc, item) => {
            return acc + Number(item.subtotal);
        }, 0);
        return {
            subtotal: Number(subtotal.toFixed(2)),
            totalDesconto: 0,
            totalFrete: 0,
            total: Number(subtotal.toFixed(2)),
        };
    }
}
exports.CalculadoraTotaisPedidoPadrao = CalculadoraTotaisPedidoPadrao;
class RegraCriacaoPedidoPadrao {
    validarCarrinho(carrinho) {
        if (carrinho.status !== enums_1.StatusCarrinho.ATIVO) {
            throw new Error("Somente carrinho ativo pode ser convertido em pedido.");
        }
        if (carrinho.itens.length === 0) {
            throw new Error("Não é possível criar pedido com carrinho vazio.");
        }
    }
}
exports.RegraCriacaoPedidoPadrao = RegraCriacaoPedidoPadrao;
class MontadorDadosPedidoPadrao {
    montar(carrinho, clienteId, totais) {
        return {
            clienteId,
            ...totais,
            status: enums_1.StatusPedido.PENDENTE_PAGAMENTO,
            itens: carrinho.itens.map((item) => ({
                produtoId: item.produtoId,
                variacaoId: item.variacaoId,
                nomeProduto: item.produto.nome,
                quantidade: item.quantidade,
                precoUnitario: item.precoUnitario,
                subtotal: item.subtotal,
            })),
        };
    }
}
exports.MontadorDadosPedidoPadrao = MontadorDadosPedidoPadrao;
class ValidadorStatusPedidoPadrao {
    validar(status) {
        if (!status) {
            throw new Error("O status é obrigatório.");
        }
        const statusFormatado = String(status).toUpperCase();
        const statusPermitidos = Object.values(enums_1.StatusPedido);
        if (!statusPermitidos.includes(statusFormatado)) {
            throw new Error("Status inválido. Use PENDENTE_PAGAMENTO, PAGO, EM_PREPARACAO, ENVIADO, ENTREGUE, CANCELADO ou REEMBOLSADO.");
        }
        return statusFormatado;
    }
}
exports.ValidadorStatusPedidoPadrao = ValidadorStatusPedidoPadrao;
class ValidadorItensPedidoPadrao {
    validar(itens) {
        for (const item of itens) {
            if (!item.produto.ativo) {
                throw new Error(`Produto ${item.produto.nome} está inativo.`);
            }
            if (!item.variacao.ativo) {
                throw new Error(`Variação ${item.variacao.nome} está inativa.`);
            }
            if (item.quantidade > item.variacao.estoque) {
                throw new Error(`Estoque insuficiente para o produto ${item.produto.nome}.`);
            }
        }
    }
}
exports.ValidadorItensPedidoPadrao = ValidadorItensPedidoPadrao;
class RegraAtualizacaoStatusPedidoPadrao {
    validar(pedido, novoStatus) {
        if (pedido.status === enums_1.StatusPedido.CANCELADO) {
            throw new Error("Pedido cancelado não pode ter status alterado.");
        }
        if (pedido.status === enums_1.StatusPedido.ENTREGUE &&
            novoStatus === enums_1.StatusPedido.CANCELADO) {
            throw new Error("Pedido entregue não pode ser cancelado diretamente.");
        }
        if (novoStatus === enums_1.StatusPedido.PAGO &&
            (!pedido.pagamento || pedido.pagamento.status !== enums_1.StatusPagamento.APROVADO)) {
            throw new Error("O pedido só pode ser marcado como PAGO após pagamento aprovado.");
        }
        if (novoStatus === enums_1.StatusPedido.ENVIADO &&
            pedido.status !== enums_1.StatusPedido.EM_PREPARACAO) {
            throw new Error("Pedido só pode ser enviado quando estiver em preparação.");
        }
        if (novoStatus === enums_1.StatusPedido.ENTREGUE &&
            pedido.status !== enums_1.StatusPedido.ENVIADO) {
            throw new Error("Pedido só pode ser entregue após ser enviado.");
        }
    }
}
exports.RegraAtualizacaoStatusPedidoPadrao = RegraAtualizacaoStatusPedidoPadrao;
class RegraCancelamentoPedidoPadrao {
    validar(pedido) {
        if (pedido.status === enums_1.StatusPedido.CANCELADO) {
            throw new Error("Pedido já está cancelado.");
        }
        if (pedido.status === enums_1.StatusPedido.ENTREGUE) {
            throw new Error("Pedido entregue não pode ser cancelado diretamente.");
        }
        if (pedido.status === enums_1.StatusPedido.ENVIADO) {
            throw new Error("Pedido enviado não pode ser cancelado diretamente.");
        }
    }
}
exports.RegraCancelamentoPedidoPadrao = RegraCancelamentoPedidoPadrao;
class PedidosService {
    constructor(pedidosRepository, calculadoraTotaisPedido, validadorStatusPedido, validadorItensPedido, regraAtualizacaoStatusPedido, regraCancelamentoPedido, regraCriacaoPedido, montadorDadosPedido) {
        this.pedidosRepository = pedidosRepository;
        this.calculadoraTotaisPedido = calculadoraTotaisPedido;
        this.validadorStatusPedido = validadorStatusPedido;
        this.validadorItensPedido = validadorItensPedido;
        this.regraAtualizacaoStatusPedido = regraAtualizacaoStatusPedido;
        this.regraCancelamentoPedido = regraCancelamentoPedido;
        this.regraCriacaoPedido = regraCriacaoPedido;
        this.montadorDadosPedido = montadorDadosPedido;
    }
    async criar(data) {
        if (!data.carrinhoId) {
            throw new Error("O carrinho é obrigatório para criar o pedido.");
        }
        const carrinho = await this.pedidosRepository.buscarCarrinhoPorId(String(data.carrinhoId));
        if (!carrinho) {
            throw new Error("Carrinho não encontrado.");
        }
        this.regraCriacaoPedido.validarCarrinho(carrinho);
        let clienteId = carrinho.clienteId;
        if (data.clienteId) {
            const cliente = await this.pedidosRepository.buscarClientePorId(String(data.clienteId));
            if (!cliente) {
                throw new Error("Cliente informado não encontrado.");
            }
            clienteId = String(data.clienteId);
        }
        this.validadorItensPedido.validar(carrinho.itens);
        const totais = this.calculadoraTotaisPedido.calcular(carrinho.itens);
        const dadosPedido = this.montadorDadosPedido.montar(carrinho, clienteId, totais);
        return this.pedidosRepository.executarTransacao(async (tx) => {
            const pedido = await this.pedidosRepository.criarPedido(dadosPedido, tx);
            const carrinhoAtualizado = await this.pedidosRepository.atualizarCarrinhoAposCriacaoPedido(carrinho.id, {
                status: enums_1.StatusCarrinho.CONVERTIDO_EM_PEDIDO,
                clienteId,
            }, tx);
            return {
                pedido,
                carrinho: carrinhoAtualizado,
            };
        });
    }
    async listar() {
        return this.pedidosRepository.listarPedidos();
    }
    async buscarPorId(data) {
        const pedido = await this.pedidosRepository.buscarPedidoPorId(data.id);
        if (!pedido) {
            throw new Error("Pedido não encontrado.");
        }
        return pedido;
    }
    async atualizarStatus(data) {
        const pedido = await this.pedidosRepository.buscarPedidoComPagamentoPorId(data.id);
        if (!pedido) {
            throw new Error("Pedido não encontrado.");
        }
        const status = this.validadorStatusPedido.validar(data.status);
        this.regraAtualizacaoStatusPedido.validar(pedido, status);
        return this.pedidosRepository.atualizarStatusPedido(data.id, status);
    }
    async cancelar(data) {
        const pedido = await this.pedidosRepository.buscarPedidoSimplesPorId(data.id);
        if (!pedido) {
            throw new Error("Pedido não encontrado.");
        }
        this.regraCancelamentoPedido.validar(pedido);
        return this.pedidosRepository.atualizarStatusPedido(data.id, enums_1.StatusPedido.CANCELADO);
    }
}
exports.PedidosService = PedidosService;
const calculadoraTotaisPedido = new CalculadoraTotaisPedidoPadrao();
const validadorStatusPedido = new ValidadorStatusPedidoPadrao();
const validadorItensPedido = new ValidadorItensPedidoPadrao();
const regraAtualizacaoStatusPedido = new RegraAtualizacaoStatusPedidoPadrao();
const regraCancelamentoPedido = new RegraCancelamentoPedidoPadrao();
const regraCriacaoPedido = new RegraCriacaoPedidoPadrao();
const montadorDadosPedido = new MontadorDadosPedidoPadrao();
exports.pedidosService = new PedidosService(pedidos_repository_1.pedidosRepository, calculadoraTotaisPedido, validadorStatusPedido, validadorItensPedido, regraAtualizacaoStatusPedido, regraCancelamentoPedido, regraCriacaoPedido, montadorDadosPedido);
