import {
  AtualizarClienteDTO,
  BuscarClientePorIdDTO,
  CriarClienteDTO,
  RemoverClienteDTO,
} from "../models/cliente.model";
import { clientesRepository } from "../repositories/clientes.repository";

export interface DadosClienteValidados {
  nome: string;
  email: string;
  telefone?: string | null;
  documento?: string | null;
}

interface ClienteComVinculos {
  carrinhos: unknown[];
  pedidos: unknown[];
}

interface ClienteRepository {
  id: string;
}

export interface IEscritaClientesRepository {
  criarCliente(data: DadosClienteValidados): Promise<ClienteComVinculos>;
  atualizarCliente(
    id: string,
    data: DadosClienteValidados
  ): Promise<ClienteComVinculos>;
}

export interface ILeituraClientesRepository {
  listarClientes(): Promise<ClienteComVinculos[]>;
  buscarClientePorId(id: string): Promise<ClienteRepository | null>;
  buscarClienteDetalhadoPorId(id: string): Promise<ClienteComVinculos | null>;
  buscarClientePorEmail(email: string): Promise<ClienteRepository | null>;
  buscarClienteComVinculosPorId(
    id: string
  ): Promise<ClienteComVinculos | null>;
}

export interface IRemocaoClientesRepository {
  removerCliente(id: string): Promise<unknown>;
}

export interface IClientesRepository
  extends IEscritaClientesRepository,
    ILeituraClientesRepository,
    IRemocaoClientesRepository {}

export interface IValidadorDadosCliente {
  validar(data: CriarClienteDTO): DadosClienteValidados;
}

export interface IRegraRemocaoCliente {
  validar(cliente: ClienteComVinculos): void;
}

export class ValidadorDadosClientePadrao implements IValidadorDadosCliente {
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

  validar(data: CriarClienteDTO) {
    return {
      nome: this.validarNome(data.nome),
      email: this.validarEmail(data.email),
      telefone: data.telefone,
      documento: data.documento,
    };
  }
}

export class RegraRemocaoClienteSemVinculos implements IRegraRemocaoCliente {
  validar(cliente: ClienteComVinculos) {
    if (cliente.carrinhos.length > 0 || cliente.pedidos.length > 0) {
      throw new Error(
        "Não é possível remover cliente com carrinhos ou pedidos vinculados."
      );
    }
  }
}

export class ClientesService {
  constructor(
    private leituraClientesRepository: ILeituraClientesRepository,
    private escritaClientesRepository: IEscritaClientesRepository,
    private remocaoClientesRepository: IRemocaoClientesRepository,
    private validadorDadosCliente: IValidadorDadosCliente,
    private regraRemocaoCliente: IRegraRemocaoCliente
  ) {}

  async criar(data: CriarClienteDTO) {
    const dadosCliente = this.validadorDadosCliente.validar(data);

    const clienteExistente =
      await this.leituraClientesRepository.buscarClientePorEmail(
        dadosCliente.email
      );

    if (clienteExistente) {
      throw new Error("Já existe um cliente com esse email.");
    }

    return this.escritaClientesRepository.criarCliente(dadosCliente);
  }

  async listar() {
    return this.leituraClientesRepository.listarClientes();
  }

  async buscarPorId(data: BuscarClientePorIdDTO) {
    const cliente =
      await this.leituraClientesRepository.buscarClienteDetalhadoPorId(data.id);

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    return cliente;
  }

  async atualizar(data: AtualizarClienteDTO) {
    const cliente = await this.leituraClientesRepository.buscarClientePorId(
      data.id
    );

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    const dadosCliente = this.validadorDadosCliente.validar(data);

    const clienteComMesmoEmail =
      await this.leituraClientesRepository.buscarClientePorEmail(
        dadosCliente.email
      );

    if (clienteComMesmoEmail && clienteComMesmoEmail.id !== data.id) {
      throw new Error("Já existe outro cliente com esse email.");
    }

    return this.escritaClientesRepository.atualizarCliente(
      data.id,
      dadosCliente
    );
  }

  async remover(data: RemoverClienteDTO) {
    const cliente =
      await this.leituraClientesRepository.buscarClienteComVinculosPorId(
        data.id
      );

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

const validadorDadosCliente = new ValidadorDadosClientePadrao();
const regraRemocaoCliente = new RegraRemocaoClienteSemVinculos();

export const clientesService = new ClientesService(
  clientesRepository,
  clientesRepository,
  clientesRepository,
  validadorDadosCliente,
  regraRemocaoCliente
);
