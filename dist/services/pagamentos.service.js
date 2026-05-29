"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagamentosService = exports.PagamentosService = exports.RegraReembolsoPagamentoPadrao = exports.RegraCancelamentoPagamentoPadrao = exports.RegraRecusaPagamentoPadrao = exports.RegraAprovacaoPagamentoPadrao = exports.ValidadorMetodoPagamentoPadrao = void 0;
const enums_1 = require("../generated/prisma/enums");
const pagamentos_repository_1 = require("../repositories/pagamentos.repository");
class ValidadorMetodoPagamentoPadrao {
    validar(metodo) {
        if (!metodo) {
            throw new Error("O método de pagamento é obrigatório.");
        }
        const metodoFormatado = String(metodo).toUpperCase();
        const metodosPermitidos = Object.values(enums_1.MetodoPagamento);
        if (!metodosPermitidos.includes(metodoFormatado)) {
            throw new Error("Método de pagamento inválido. Use PIX, CARTAO_CREDITO, CARTAO_DEBITO ou BOLETO.");
        }
        return metodoFormatado;
    }
}
exports.ValidadorMetodoPagamentoPadrao = ValidadorMetodoPagamentoPadrao;
class RegraAprovacaoPagamentoPadrao {
    validar(pagamento) {
        if (pagamento.status === enums_1.StatusPagamento.APROVADO) {
            throw new Error("Pagamento já está aprovado.");
        }
        if (pagamento.status === enums_1.StatusPagamento.CANCELADO) {
            throw new Error("Pagamento cancelado não pode ser aprovado.");
        }
        if (pagamento.status === enums_1.StatusPagamento.REEMBOLSADO) {
            throw new Error("Pagamento reembolsado não pode ser aprovado.");
        }
        if (pagamento.pedido.status === enums_1.StatusPedido.CANCELADO) {
            throw new Error("Não é possível aprovar pagamento de pedido cancelado.");
        }
        for (const item of pagamento.pedido.itens) {
            if (item.quantidade > item.variacao.estoque) {
                throw new Error(`Estoque insuficiente para o produto ${item.produto.nome}.`);
            }
        }
    }
}
exports.RegraAprovacaoPagamentoPadrao = RegraAprovacaoPagamentoPadrao;
class RegraRecusaPagamentoPadrao {
    validar(pagamento) {
        if (pagamento.status === enums_1.StatusPagamento.APROVADO) {
            throw new Error("Pagamento aprovado não pode ser recusado.");
        }
        if (pagamento.status === enums_1.StatusPagamento.CANCELADO) {
            throw new Error("Pagamento cancelado não pode ser recusado.");
        }
    }
}
exports.RegraRecusaPagamentoPadrao = RegraRecusaPagamentoPadrao;
class RegraCancelamentoPagamentoPadrao {
    validar(pagamento) {
        if (pagamento.status === enums_1.StatusPagamento.APROVADO) {
            throw new Error("Pagamento aprovado não pode ser cancelado diretamente.");
        }
        if (pagamento.status === enums_1.StatusPagamento.CANCELADO) {
            throw new Error("Pagamento já está cancelado.");
        }
    }
}
exports.RegraCancelamentoPagamentoPadrao = RegraCancelamentoPagamentoPadrao;
class RegraReembolsoPagamentoPadrao {
    validar(pagamento) {
        if (pagamento.status !== enums_1.StatusPagamento.APROVADO) {
            throw new Error("Somente pagamento aprovado pode ser reembolsado.");
        }
        if (pagamento.pedido.status === enums_1.StatusPedido.ENTREGUE) {
            throw new Error("Pedido entregue não pode ser reembolsado diretamente por esta rota.");
        }
    }
}
exports.RegraReembolsoPagamentoPadrao = RegraReembolsoPagamentoPadrao;
class PagamentosService {
    constructor(pagamentosRepository, validadorMetodoPagamento, regraAprovacaoPagamento, regraRecusaPagamento, regraCancelamentoPagamento, regraReembolsoPagamento) {
        this.pagamentosRepository = pagamentosRepository;
        this.validadorMetodoPagamento = validadorMetodoPagamento;
        this.regraAprovacaoPagamento = regraAprovacaoPagamento;
        this.regraRecusaPagamento = regraRecusaPagamento;
        this.regraCancelamentoPagamento = regraCancelamentoPagamento;
        this.regraReembolsoPagamento = regraReembolsoPagamento;
    }
    validarMetodoPagamento(metodo) {
        return this.validadorMetodoPagamento.validar(metodo);
    }
    async criar(data) {
        if (!data.pedidoId) {
            throw new Error("O pedido é obrigatório.");
        }
        const pedidoId = String(data.pedidoId);
        const pedido = await this.pagamentosRepository.buscarPedidoPorId(pedidoId);
        if (!pedido) {
            throw new Error("Pedido não encontrado.");
        }
        if (pedido.status === enums_1.StatusPedido.CANCELADO) {
            throw new Error("Não é possível criar pagamento para pedido cancelado.");
        }
        if (pedido.status === enums_1.StatusPedido.PAGO) {
            throw new Error("Pedido já está pago.");
        }
        if (pedido.pagamento) {
            throw new Error("Este pedido já possui um pagamento vinculado.");
        }
        const metodo = this.validarMetodoPagamento(data.metodo);
        return this.pagamentosRepository.criarPagamento({
            pedidoId,
            metodo,
            valor: pedido.total,
        });
    }
    async listar() {
        return this.pagamentosRepository.listarPagamentos();
    }
    async buscarPorId(data) {
        const pagamento = await this.pagamentosRepository.buscarPagamentoPorId(data.id);
        if (!pagamento) {
            throw new Error("Pagamento não encontrado.");
        }
        return pagamento;
    }
    async aprovar(data) {
        const pagamento = await this.pagamentosRepository.buscarPagamentoParaAprovacao(data.id);
        if (!pagamento) {
            throw new Error("Pagamento não encontrado.");
        }
        this.regraAprovacaoPagamento.validar(pagamento);
        return this.pagamentosRepository.executarTransacao(async (tx) => {
            const pagamentoAprovado = await this.pagamentosRepository.marcarPagamentoComoAprovado(data.id, tx);
            const pedidoAtualizado = await this.pagamentosRepository.atualizarStatusPedido(pagamento.pedidoId, enums_1.StatusPedido.PAGO, tx);
            for (const item of pagamento.pedido.itens) {
                await this.pagamentosRepository.atualizarEstoqueVariacao(item.variacaoId, item.variacao.estoque - item.quantidade, tx);
                await this.pagamentosRepository.criarMovimentacaoEstoque({
                    variacaoId: item.variacaoId,
                    tipo: enums_1.TipoMovimentacaoEstoque.VENDA,
                    quantidade: item.quantidade,
                    motivo: `Baixa automática após pagamento aprovado do pedido ${pagamento.pedidoId}.`,
                }, tx);
            }
            return {
                pagamento: pagamentoAprovado,
                pedido: pedidoAtualizado,
            };
        });
    }
    async recusar(data) {
        const pagamento = await this.pagamentosRepository.buscarPagamentoComPedido(data.id);
        if (!pagamento) {
            throw new Error("Pagamento não encontrado.");
        }
        this.regraRecusaPagamento.validar(pagamento);
        return this.pagamentosRepository.atualizarStatusPagamento(data.id, enums_1.StatusPagamento.RECUSADO);
    }
    async cancelar(data) {
        const pagamento = await this.pagamentosRepository.buscarPagamentoSimplesPorId(data.id);
        if (!pagamento) {
            throw new Error("Pagamento não encontrado.");
        }
        this.regraCancelamentoPagamento.validar(pagamento);
        return this.pagamentosRepository.atualizarStatusPagamento(data.id, enums_1.StatusPagamento.CANCELADO);
    }
    async reembolsar(data) {
        const pagamento = await this.pagamentosRepository.buscarPagamentoParaReembolso(data.id);
        if (!pagamento) {
            throw new Error("Pagamento não encontrado.");
        }
        this.regraReembolsoPagamento.validar(pagamento);
        return this.pagamentosRepository.executarTransacao(async (tx) => {
            const pagamentoReembolsado = await this.pagamentosRepository.marcarPagamentoComoReembolsado(data.id, tx);
            const pedidoReembolsado = await this.pagamentosRepository.atualizarStatusPedido(pagamento.pedidoId, enums_1.StatusPedido.REEMBOLSADO, tx);
            for (const item of pagamento.pedido.itens) {
                await this.pagamentosRepository.atualizarEstoqueVariacao(item.variacaoId, item.variacao.estoque + item.quantidade, tx);
                await this.pagamentosRepository.criarMovimentacaoEstoque({
                    variacaoId: item.variacaoId,
                    tipo: enums_1.TipoMovimentacaoEstoque.DEVOLUCAO_CANCELAMENTO,
                    quantidade: item.quantidade,
                    motivo: `Devolução automática após reembolso do pedido ${pagamento.pedidoId}.`,
                }, tx);
            }
            return {
                pagamento: pagamentoReembolsado,
                pedido: pedidoReembolsado,
            };
        });
    }
}
exports.PagamentosService = PagamentosService;
const validadorMetodoPagamento = new ValidadorMetodoPagamentoPadrao();
const regraAprovacaoPagamento = new RegraAprovacaoPagamentoPadrao();
const regraRecusaPagamento = new RegraRecusaPagamentoPadrao();
const regraCancelamentoPagamento = new RegraCancelamentoPagamentoPadrao();
const regraReembolsoPagamento = new RegraReembolsoPagamentoPadrao();
exports.pagamentosService = new PagamentosService(pagamentos_repository_1.pagamentosRepository, validadorMetodoPagamento, regraAprovacaoPagamento, regraRecusaPagamento, regraCancelamentoPagamento, regraReembolsoPagamento);
