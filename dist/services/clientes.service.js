"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientesService = exports.ClientesService = exports.RegraRemocaoClienteSemVinculos = exports.ValidadorDadosClientePadrao = void 0;
const clientes_repository_1 = require("../repositories/clientes.repository");
class ValidadorDadosClientePadrao {
    validarNome(nome) {
        if (!nome) {
            throw new Error("O nome do cliente é obrigatório.");
        }
        if (typeof nome !== "string") {
            throw new Error("O nome do cliente deve ser um texto.");
        }
        if (nome.trim().length < 3) {
            throw new Error("O nome do cliente deve ter pelo menos 3 caracteres.");
        }
        return nome.trim();
    }
    validarEmail(email) {
        if (!email) {
            throw new Error("O email do cliente é obrigatório.");
        }
        if (typeof email !== "string") {
            throw new Error("O email do cliente deve ser um texto.");
        }
        if (!email.includes("@")) {
            throw new Error("Email inválido.");
        }
        return email.trim().toLowerCase();
    }
    validar(data) {
        return {
            nome: this.validarNome(data.nome),
            email: this.validarEmail(data.email),
            telefone: data.telefone,
            documento: data.documento,
        };
    }
}
exports.ValidadorDadosClientePadrao = ValidadorDadosClientePadrao;
class RegraRemocaoClienteSemVinculos {
    validar(cliente) {
        if (cliente.carrinhos.length > 0 || cliente.pedidos.length > 0) {
            throw new Error("Não é possível remover cliente com carrinhos ou pedidos vinculados.");
        }
    }
}
exports.RegraRemocaoClienteSemVinculos = RegraRemocaoClienteSemVinculos;
class ClientesService {
    constructor(leituraClientesRepository, escritaClientesRepository, remocaoClientesRepository, validadorDadosCliente, regraRemocaoCliente) {
        this.leituraClientesRepository = leituraClientesRepository;
        this.escritaClientesRepository = escritaClientesRepository;
        this.remocaoClientesRepository = remocaoClientesRepository;
        this.validadorDadosCliente = validadorDadosCliente;
        this.regraRemocaoCliente = regraRemocaoCliente;
    }
    async criar(data) {
        const dadosCliente = this.validadorDadosCliente.validar(data);
        const clienteExistente = await this.leituraClientesRepository.buscarClientePorEmail(dadosCliente.email);
        if (clienteExistente) {
            throw new Error("Já existe um cliente com esse email.");
        }
        return this.escritaClientesRepository.criarCliente(dadosCliente);
    }
    async listar() {
        return this.leituraClientesRepository.listarClientes();
    }
    async buscarPorId(data) {
        const cliente = await this.leituraClientesRepository.buscarClienteDetalhadoPorId(data.id);
        if (!cliente) {
            throw new Error("Cliente não encontrado.");
        }
        return cliente;
    }
    async atualizar(data) {
        const cliente = await this.leituraClientesRepository.buscarClientePorId(data.id);
        if (!cliente) {
            throw new Error("Cliente não encontrado.");
        }
        const dadosCliente = this.validadorDadosCliente.validar(data);
        const clienteComMesmoEmail = await this.leituraClientesRepository.buscarClientePorEmail(dadosCliente.email);
        if (clienteComMesmoEmail && clienteComMesmoEmail.id !== data.id) {
            throw new Error("Já existe outro cliente com esse email.");
        }
        return this.escritaClientesRepository.atualizarCliente(data.id, dadosCliente);
    }
    async remover(data) {
        const cliente = await this.leituraClientesRepository.buscarClienteComVinculosPorId(data.id);
        if (!cliente) {
            throw new Error("Cliente não encontrado.");
        }
        this.regraRemocaoCliente.validar(cliente);
        await this.remocaoClientesRepository.removerCliente(data.id);
        return {
            message: "Cliente removido com sucesso.",
        };
    }
}
exports.ClientesService = ClientesService;
const validadorDadosCliente = new ValidadorDadosClientePadrao();
const regraRemocaoCliente = new RegraRemocaoClienteSemVinculos();
exports.clientesService = new ClientesService(clientes_repository_1.clientesRepository, clientes_repository_1.clientesRepository, clientes_repository_1.clientesRepository, validadorDadosCliente, regraRemocaoCliente);
