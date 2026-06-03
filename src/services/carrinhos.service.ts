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

export interface TotaisItemCarrinho {
  precoUnitario: number;
  subtotal: number;
}

interface ProdutoCarrinho {
  id: string;
  ativo: boolean;
  precoFinal: unknown;
}

interface VariacaoCarrinho {
  produtoId: string;
  ativo: boolean;
  estoque: number;
  precoAdicional: unknown;
}

interface ItemCarrinhoComProdutoVariacao {
  id?: string;
  carrinhoId: string;
  produto: {
    precoFinal: unknown;
  };
  variacao: {
    estoque: number;
    precoAdicional: unknown;
  };
}

interface CarrinhoSimplesRepository {
  status: StatusCarrinho;
}

interface ItemExistenteCarrinhoRepository {
  id: string;
  quantidade: number;
}

export interface IConsultaClienteCarrinhoRepository {
  buscarClientePorId(clienteId: string): Promise<unknown | null>;
}

export interface IEscritaCarrinhosRepository {
  criarCarrinho(clienteId?: string | null): Promise<unknown>;
}

export interface ILeituraCarrinhosRepository {
  listarCarrinhos(): Promise<unknown[]>;
  buscarCarrinhoPorId(id: string): Promise<unknown | null>;
  buscarCarrinhoSimplesPorId(
    id: string
  ): Promise<CarrinhoSimplesRepository | null>;
}

export interface IConsultaCatalogoCarrinhoRepository {
  buscarProdutoPorId(produtoId: string): Promise<ProdutoCarrinho | null>;
  buscarVariacaoPorId(
    variacaoId: string
  ): Promise<VariacaoCarrinho | null>;
}

export interface ILeituraItensCarrinhoRepository {
  buscarItemExistente(
    carrinhoId: string,
    produtoId: string,
    variacaoId: string
  ): Promise<ItemExistenteCarrinhoRepository | null>;
  buscarItemPorId(
    itemId: string
  ): Promise<ItemCarrinhoComProdutoVariacao | null>;
}

export interface IEscritaItensCarrinhoRepository {
  atualizarItemCarrinho(
    itemId: string,
    data: TotaisItemCarrinho & { quantidade: number }
  ): Promise<unknown>;
  criarItemCarrinho(
    data: TotaisItemCarrinho & {
      carrinhoId: string;
      produtoId: string;
      variacaoId: string;
      quantidade: number;
    }
  ): Promise<unknown>;
}

export interface IRemocaoItensCarrinhoRepository {
  removerItemCarrinho(itemId: string): Promise<unknown>;
  limparItensDoCarrinho(carrinhoId: string): Promise<unknown>;
}

export interface IStatusCarrinhosRepository {
  atualizarStatusCarrinho(
    carrinhoId: string,
    status: StatusCarrinho
  ): Promise<unknown>;
}

export interface ICarrinhosRepository
  extends IConsultaClienteCarrinhoRepository,
    IEscritaCarrinhosRepository,
    ILeituraCarrinhosRepository,
    IConsultaCatalogoCarrinhoRepository,
    ILeituraItensCarrinhoRepository,
    IEscritaItensCarrinhoRepository,
    IRemocaoItensCarrinhoRepository,
    IStatusCarrinhosRepository {}

export interface ICalculadoraTotaisItemCarrinho {
  calcular(
    precoFinalProduto: unknown,
    precoAdicionalVariacao: unknown,
    quantidade: number
  ): TotaisItemCarrinho;
}

export interface IValidadorQuantidadeCarrinho {
  validar(quantidade: unknown): number;
}

export interface IRegraCarrinhoAtivo {
  validar(status: StatusCarrinho, mensagem?: string): void;
}

export interface IRegraItemCarrinho {
  validarProduto(produto: ProdutoCarrinho): void;
  validarVariacao(produto: ProdutoCarrinho, variacao: VariacaoCarrinho): void;
  validarEstoque(quantidade: number, estoque: number): void;
  validarPertencimentoItem(
    item: ItemCarrinhoComProdutoVariacao | null,
    carrinhoId: string
  ): asserts item is ItemCarrinhoComProdutoVariacao;
}

export interface ICalculadoraQuantidadeFinalCarrinho {
  calcular(
    itemExistente: ItemExistenteCarrinhoRepository | null,
    quantidade: number
  ): number;
}

export class CalculadoraTotaisItemCarrinhoPadrao
  implements ICalculadoraTotaisItemCarrinho
{
  calcular(
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
}

export class CalculadoraQuantidadeFinalCarrinhoPadrao
  implements ICalculadoraQuantidadeFinalCarrinho
{
  calcular(
    itemExistente: ItemExistenteCarrinhoRepository | null,
    quantidade: number
  ) {
    return itemExistente ? itemExistente.quantidade + quantidade : quantidade;
  }
}

export class ValidadorQuantidadeCarrinhoPadrao
  implements IValidadorQuantidadeCarrinho
{
  validar(quantidade: unknown) {
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

export class RegraCarrinhoAtivoPadrao implements IRegraCarrinhoAtivo {
  validar(
    status: StatusCarrinho,
    mensagem = "Não é possível alterar um carrinho que não está ativo."
  ) {
    if (status !== StatusCarrinho.ATIVO) {
      throw new Error(mensagem);
    }
  }
}

export class RegraItemCarrinhoPadrao implements IRegraItemCarrinho {
  validarProduto(produto: ProdutoCarrinho) {
    if (!produto.ativo) {
      throw new Error("Produto inativo não pode ser adicionado ao carrinho.");
    }
  }

  validarVariacao(produto: ProdutoCarrinho, variacao: VariacaoCarrinho) {
    if (!variacao.ativo) {
      throw new Error("Variação inativa não pode ser adicionada ao carrinho.");
    }

    if (variacao.produtoId !== produto.id) {
      throw new Error("A variação informada não pertence ao produto informado.");
    }
  }

  validarEstoque(quantidade: number, estoque: number) {
    if (quantidade > estoque) {
      throw new Error("Quantidade solicitada maior que o estoque disponível.");
    }
  }

  validarPertencimentoItem(
    item: ItemCarrinhoComProdutoVariacao | null,
    carrinhoId: string
  ): asserts item is ItemCarrinhoComProdutoVariacao {
    if (!item || item.carrinhoId !== carrinhoId) {
      throw new Error("Item do carrinho não encontrado.");
    }
  }
}

export class CarrinhosService {
  constructor(
    private consultaClienteCarrinhoRepository: IConsultaClienteCarrinhoRepository,
    private escritaCarrinhosRepository: IEscritaCarrinhosRepository,
    private leituraCarrinhosRepository: ILeituraCarrinhosRepository,
    private consultaCatalogoCarrinhoRepository: IConsultaCatalogoCarrinhoRepository,
    private leituraItensCarrinhoRepository: ILeituraItensCarrinhoRepository,
    private escritaItensCarrinhoRepository: IEscritaItensCarrinhoRepository,
    private remocaoItensCarrinhoRepository: IRemocaoItensCarrinhoRepository,
    private statusCarrinhosRepository: IStatusCarrinhosRepository,
    private calculadoraTotaisItemCarrinho: ICalculadoraTotaisItemCarrinho,
    private calculadoraQuantidadeFinalCarrinho: ICalculadoraQuantidadeFinalCarrinho,
    private validadorQuantidadeCarrinho: IValidadorQuantidadeCarrinho,
    private regraCarrinhoAtivo: IRegraCarrinhoAtivo,
    private regraItemCarrinho: IRegraItemCarrinho
  ) {}

  async criar(data: CriarCarrinhoDTO) {
    const { clienteId } = data;

    if (clienteId) {
      const cliente = await this.consultaClienteCarrinhoRepository.buscarClientePorId(
        String(clienteId)
      );

      if (!cliente) {
        throw new Error("Cliente não encontrado.");
      }
    }

    const carrinho = await this.escritaCarrinhosRepository.criarCarrinho(
      clienteId ? String(clienteId) : null
    );

    return carrinho;
  }

  async listar() {
    const carrinhos = await this.leituraCarrinhosRepository.listarCarrinhos();

    return carrinhos;
  }

  async buscarPorId(id: string) {
    const carrinho = await this.leituraCarrinhosRepository.buscarCarrinhoPorId(
      id
    );

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

    const quantidadeNumber = this.validadorQuantidadeCarrinho.validar(
      quantidade
    );

    const carrinho =
      await this.leituraCarrinhosRepository.buscarCarrinhoSimplesPorId(
        carrinhoId
      );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCarrinhoAtivo.validar(carrinho.status);

    const produto = await this.consultaCatalogoCarrinhoRepository.buscarProdutoPorId(
      String(produtoId)
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    this.regraItemCarrinho.validarProduto(produto);

    const variacao = await this.consultaCatalogoCarrinhoRepository.buscarVariacaoPorId(
      String(variacaoId)
    );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    this.regraItemCarrinho.validarVariacao(produto, variacao);

    const itemExistente =
      await this.leituraItensCarrinhoRepository.buscarItemExistente(
        carrinhoId,
        String(produtoId),
        String(variacaoId)
      );

    const quantidadeFinal = this.calculadoraQuantidadeFinalCarrinho.calcular(
      itemExistente,
      quantidadeNumber
    );

    this.regraItemCarrinho.validarEstoque(quantidadeFinal, variacao.estoque);

    const { precoUnitario, subtotal } = this.calculadoraTotaisItemCarrinho.calcular(
      produto.precoFinal,
      variacao.precoAdicional,
      quantidadeFinal
    );

    if (itemExistente) {
      return this.escritaItensCarrinhoRepository.atualizarItemCarrinho(
        itemExistente.id,
        {
          quantidade: quantidadeFinal,
          precoUnitario,
          subtotal,
        }
      );
    }

    return this.escritaItensCarrinhoRepository.criarItemCarrinho({
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

    const carrinho =
      await this.leituraCarrinhosRepository.buscarCarrinhoSimplesPorId(
        carrinhoId
      );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCarrinhoAtivo.validar(carrinho.status);

    const item = await this.leituraItensCarrinhoRepository.buscarItemPorId(
      itemId
    );

    this.regraItemCarrinho.validarPertencimentoItem(item, carrinhoId);

    const quantidadeNumber = this.validadorQuantidadeCarrinho.validar(
      quantidade
    );

    this.regraItemCarrinho.validarEstoque(
      quantidadeNumber,
      item.variacao.estoque
    );

    const { precoUnitario, subtotal } = this.calculadoraTotaisItemCarrinho.calcular(
      item.produto.precoFinal,
      item.variacao.precoAdicional,
      quantidadeNumber
    );

    const itemAtualizado =
      await this.escritaItensCarrinhoRepository.atualizarItemCarrinho(
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

    const carrinho =
      await this.leituraCarrinhosRepository.buscarCarrinhoSimplesPorId(
        carrinhoId
      );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCarrinhoAtivo.validar(carrinho.status);

    const item = await this.leituraItensCarrinhoRepository.buscarItemPorId(
      itemId
    );

    this.regraItemCarrinho.validarPertencimentoItem(item, carrinhoId);

    await this.remocaoItensCarrinhoRepository.removerItemCarrinho(itemId);

    return {
      message: "Item removido do carrinho com sucesso.",
    };
  }

  async limpar(data: LimparCarrinhoDTO) {
    const { carrinhoId } = data;

    const carrinho =
      await this.leituraCarrinhosRepository.buscarCarrinhoSimplesPorId(
        carrinhoId
      );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCarrinhoAtivo.validar(
      carrinho.status,
      "Não é possível limpar um carrinho que não está ativo."
    );

    await this.remocaoItensCarrinhoRepository.limparItensDoCarrinho(
      carrinhoId
    );

    return {
      message: "Carrinho limpo com sucesso.",
    };
  }

  async abandonar(data: AbandonarCarrinhoDTO) {
    const { carrinhoId } = data;

    const carrinho =
      await this.leituraCarrinhosRepository.buscarCarrinhoSimplesPorId(
        carrinhoId
      );

    if (!carrinho) {
      throw new Error("Carrinho não encontrado.");
    }

    this.regraCarrinhoAtivo.validar(
      carrinho.status,
      "Somente carrinho ativo pode ser abandonado."
    );

    const carrinhoAtualizado =
      await this.statusCarrinhosRepository.atualizarStatusCarrinho(
        carrinhoId,
        StatusCarrinho.ABANDONADO
      );

    return carrinhoAtualizado;
  }
}

const calculadoraTotaisItemCarrinho = new CalculadoraTotaisItemCarrinhoPadrao();
const calculadoraQuantidadeFinalCarrinho =
  new CalculadoraQuantidadeFinalCarrinhoPadrao();
const validadorQuantidadeCarrinho = new ValidadorQuantidadeCarrinhoPadrao();
const regraCarrinhoAtivo = new RegraCarrinhoAtivoPadrao();
const regraItemCarrinho = new RegraItemCarrinhoPadrao();

export const carrinhosService = new CarrinhosService(
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  carrinhosRepository,
  calculadoraTotaisItemCarrinho,
  calculadoraQuantidadeFinalCarrinho,
  validadorQuantidadeCarrinho,
  regraCarrinhoAtivo,
  regraItemCarrinho
);
