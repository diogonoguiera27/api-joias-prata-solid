import {
  AtualizarClienteDTO,
  BuscarClientePorIdDTO,
  CriarClienteDTO,
  RemoverClienteDTO,
} from "../models/cliente.model";
import { clientesRepository } from "../repositories/clientes.repository";

class ClientesService {
  private validarNome(nome: unknown) {
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

  private validarEmail(email: unknown) {
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

  async criar(data: CriarClienteDTO) {
    const nome = this.validarNome(data.nome);
    const email = this.validarEmail(data.email);

    const clienteExistente = await clientesRepository.buscarClientePorEmail(
      email
    );

    if (clienteExistente) {
      throw new Error("Já existe um cliente com esse email.");
    }

    return clientesRepository.criarCliente({
      nome,
      email,
      telefone: data.telefone,
      documento: data.documento,
    });
  }

  async listar() {
    return clientesRepository.listarClientes();
  }

  async buscarPorId(data: BuscarClientePorIdDTO) {
    const cliente = await clientesRepository.buscarClienteDetalhadoPorId(
      data.id
    );

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    return cliente;
  }

  async atualizar(data: AtualizarClienteDTO) {
    const cliente = await clientesRepository.buscarClientePorId(data.id);

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    const nome = this.validarNome(data.nome);
    const email = this.validarEmail(data.email);

    const clienteComMesmoEmail = await clientesRepository.buscarClientePorEmail(
      email
    );

    if (clienteComMesmoEmail && clienteComMesmoEmail.id !== data.id) {
      throw new Error("Já existe outro cliente com esse email.");
    }

    return clientesRepository.atualizarCliente(data.id, {
      nome,
      email,
      telefone: data.telefone,
      documento: data.documento,
    });
  }

  async remover(data: RemoverClienteDTO) {
    const cliente = await clientesRepository.buscarClienteComVinculosPorId(
      data.id
    );

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    if (cliente.carrinhos.length > 0 || cliente.pedidos.length > 0) {
      throw new Error(
        "Não é possível remover cliente com carrinhos ou pedidos vinculados."
      );
    }

    await clientesRepository.removerCliente(data.id);

    return {
      message: "Cliente removido com sucesso.",
    };
  }
}

export const clientesService = new ClientesService();
