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

export interface DadosVariacaoProdutoValidados {
  nome: string;
  sku: string;
  tamanho?: string | null;
  cor?: string | null;
  precoAdicional: number;
  estoque: number;
}

export interface DadosAjusteEstoqueVariacao {
  novoEstoque: number;
  diferenca: number;
  estoqueAtual: number;
  motivo?: string | null;
}

interface ProdutoVariacaoRepository {
  ativo: boolean;
}

interface VariacaoProdutoRepository {
  id: string;
  ativo: boolean;
  estoque: number;
}

export interface IConsultaProdutoVariacaoRepository {
  buscarProdutoPorId(
    produtoId: string
  ): Promise<ProdutoVariacaoRepository | null>;
}

export interface IEscritaVariacoesProdutoRepository {
  criarVariacao(
    data: DadosVariacaoProdutoValidados & { produtoId: string }
  ): Promise<unknown>;
  atualizarVariacao(
    id: string,
    data: DadosVariacaoProdutoValidados & { produtoId: string }
  ): Promise<unknown>;
}

export interface ILeituraVariacoesProdutoRepository {
  buscarVariacaoPorSku(
    sku: string
  ): Promise<VariacaoProdutoRepository | null>;
  listarVariacoesAtivas(): Promise<unknown[]>;
  listarVariacoesPorProduto(produtoId: string): Promise<unknown[]>;
  buscarVariacaoPorId(id: string): Promise<VariacaoProdutoRepository | null>;
  buscarVariacaoDetalhadaPorId(id: string): Promise<unknown | null>;
}

export interface IEstoqueVariacoesProdutoRepository {
  atualizarEstoque(
    id: string,
    data: DadosAjusteEstoqueVariacao
  ): Promise<unknown>;
}

export interface IStatusVariacoesProdutoRepository {
  atualizarStatusVariacao(id: string, ativo: boolean): Promise<unknown>;
}

export interface IVariacoesProdutoRepository
  extends IConsultaProdutoVariacaoRepository,
    IEscritaVariacoesProdutoRepository,
    ILeituraVariacoesProdutoRepository,
    IEstoqueVariacoesProdutoRepository,
    IStatusVariacoesProdutoRepository {}

export interface IValidadorDadosVariacaoProduto {
  validar(data: CriarVariacaoProdutoDTO): DadosVariacaoProdutoValidados;
}

export interface IValidadorEstoqueVariacaoProduto {
  validar(estoque: unknown, mensagemObrigatorio?: string): number;
}

export interface ICalculadoraAjusteEstoqueVariacaoProduto {
  calcular(data: {
    novoEstoque: number;
    estoqueAtual: number;
    motivo?: string | null;
  }): DadosAjusteEstoqueVariacao;
}

export interface IRegraStatusVariacaoProduto {
  validarAtivacao(variacao: { ativo: boolean }): void;
  validarDesativacao(variacao: { ativo: boolean }): void;
}

export class ValidadorEstoqueVariacaoProdutoPadrao
  implements IValidadorEstoqueVariacaoProduto
{
  validar(estoque: unknown, mensagemObrigatorio?: string) {
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
}

export class ValidadorDadosVariacaoProdutoPadrao
  implements IValidadorDadosVariacaoProduto
{
  constructor(
    private validadorEstoqueVariacaoProduto: IValidadorEstoqueVariacaoProduto
  ) {}

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

  validar(data: CriarVariacaoProdutoDTO) {
    return {
      nome: this.validarNome(data.nome),
      sku: this.validarSku(data.sku),
      tamanho: data.tamanho,
      cor: data.cor,
      precoAdicional: this.validarPrecoAdicional(data.precoAdicional),
      estoque: this.validadorEstoqueVariacaoProduto.validar(data.estoque),
    };
  }
}

export class CalculadoraAjusteEstoqueVariacaoProdutoPadrao
  implements ICalculadoraAjusteEstoqueVariacaoProduto
{
  calcular(data: {
    novoEstoque: number;
    estoqueAtual: number;
    motivo?: string | null;
  }) {
    return {
      novoEstoque: data.novoEstoque,
      diferenca: data.novoEstoque - data.estoqueAtual,
      estoqueAtual: data.estoqueAtual,
      motivo: data.motivo,
    };
  }
}

export class RegraStatusVariacaoProdutoPadrao
  implements IRegraStatusVariacaoProduto
{
  validarAtivacao(variacao: { ativo: boolean }) {
    if (variacao.ativo) {
      throw new Error("Variação já está ativa.");
    }
  }

  validarDesativacao(variacao: { ativo: boolean }) {
    if (!variacao.ativo) {
      throw new Error("Variação já está desativada.");
    }
  }
}

export class VariacoesProdutoService {
  constructor(
    private consultaProdutoVariacaoRepository: IConsultaProdutoVariacaoRepository,
    private leituraVariacoesProdutoRepository: ILeituraVariacoesProdutoRepository,
    private escritaVariacoesProdutoRepository: IEscritaVariacoesProdutoRepository,
    private estoqueVariacoesProdutoRepository: IEstoqueVariacoesProdutoRepository,
    private statusVariacoesProdutoRepository: IStatusVariacoesProdutoRepository,
    private validadorDadosVariacaoProduto: IValidadorDadosVariacaoProduto,
    private validadorEstoqueVariacaoProduto: IValidadorEstoqueVariacaoProduto,
    private calculadoraAjusteEstoqueVariacaoProduto: ICalculadoraAjusteEstoqueVariacaoProduto,
    private regraStatusVariacaoProduto: IRegraStatusVariacaoProduto
  ) {}

  private async validarProduto(produtoId: unknown, mensagemInativo: string) {
    if (!produtoId) {
      throw new Error("O produto é obrigatório.");
    }

    const produto = await this.consultaProdutoVariacaoRepository.buscarProdutoPorId(
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

  async criar(data: CriarVariacaoProdutoDTO) {
    const produtoId = await this.validarProduto(
      data.produtoId,
      "Não é possível criar variação para um produto inativo."
    );
    const dadosVariacao = this.validadorDadosVariacaoProduto.validar(data);

    const variacaoComMesmoSku =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorSku(
        dadosVariacao.sku
      );

    if (variacaoComMesmoSku) {
      throw new Error("Já existe uma variação com esse SKU.");
    }

    return this.escritaVariacoesProdutoRepository.criarVariacao({
      produtoId,
      ...dadosVariacao,
    });
  }

  async listar() {
    return this.leituraVariacoesProdutoRepository.listarVariacoesAtivas();
  }

  async listarPorProduto(data: ListarVariacoesProdutoDTO) {
    const produto = await this.consultaProdutoVariacaoRepository.buscarProdutoPorId(
      data.produtoId
    );

    if (!produto) {
      throw new Error("Produto não encontrado.");
    }

    return this.leituraVariacoesProdutoRepository.listarVariacoesPorProduto(
      data.produtoId
    );
  }

  async buscarPorId(data: BuscarVariacaoProdutoPorIdDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoDetalhadaPorId(
        data.id
      );

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    return variacao;
  }

  async atualizar(data: AtualizarVariacaoProdutoDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorId(data.id);

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const produtoId = await this.validarProduto(
      data.produtoId,
      "Não é possível vincular a variação a um produto inativo."
    );
    const dadosVariacao = this.validadorDadosVariacaoProduto.validar(data);

    const variacaoComMesmoSku =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorSku(
        dadosVariacao.sku
      );

    if (variacaoComMesmoSku && variacaoComMesmoSku.id !== data.id) {
      throw new Error("Já existe outra variação com esse SKU.");
    }

    return this.escritaVariacoesProdutoRepository.atualizarVariacao(data.id, {
      produtoId,
      ...dadosVariacao,
    });
  }

  async atualizarEstoque(data: AtualizarEstoqueVariacaoProdutoDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorId(data.id);

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const novoEstoque = this.validadorEstoqueVariacaoProduto.validar(
      data.estoque,
      "O estoque é obrigatório."
    );
    const dadosAjuste =
      this.calculadoraAjusteEstoqueVariacaoProduto.calcular({
        novoEstoque,
        estoqueAtual: variacao.estoque,
        motivo: data.motivo,
      });

    return this.estoqueVariacoesProdutoRepository.atualizarEstoque(data.id, {
      ...dadosAjuste,
    });
  }

  async desativar(data: DesativarVariacaoProdutoDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorId(data.id);

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    this.regraStatusVariacaoProduto.validarDesativacao(variacao);

    return this.statusVariacoesProdutoRepository.atualizarStatusVariacao(
      data.id,
      false
    );
  }

  async ativar(data: AtivarVariacaoProdutoDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorId(data.id);

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    this.regraStatusVariacaoProduto.validarAtivacao(variacao);

    return this.statusVariacoesProdutoRepository.atualizarStatusVariacao(
      data.id,
      true
    );
  }

  async remover(data: RemoverVariacaoProdutoDTO) {
    const variacao =
      await this.leituraVariacoesProdutoRepository.buscarVariacaoPorId(data.id);

    if (!variacao) {
      throw new Error("Variação de produto não encontrada.");
    }

    const variacaoRemovida =
      await this.statusVariacoesProdutoRepository.atualizarStatusVariacao(
        data.id,
        false
      );

    return {
      message: "Variação removida com sucesso.",
      variacao: variacaoRemovida,
    };
  }
}

const validadorEstoqueVariacaoProduto =
  new ValidadorEstoqueVariacaoProdutoPadrao();
const validadorDadosVariacaoProduto = new ValidadorDadosVariacaoProdutoPadrao(
  validadorEstoqueVariacaoProduto
);
const calculadoraAjusteEstoqueVariacaoProduto =
  new CalculadoraAjusteEstoqueVariacaoProdutoPadrao();
const regraStatusVariacaoProduto = new RegraStatusVariacaoProdutoPadrao();

export const variacoesProdutoService = new VariacoesProdutoService(
  variacoesProdutoRepository,
  variacoesProdutoRepository,
  variacoesProdutoRepository,
  variacoesProdutoRepository,
  variacoesProdutoRepository,
  validadorDadosVariacaoProduto,
  validadorEstoqueVariacaoProduto,
  calculadoraAjusteEstoqueVariacaoProduto,
  regraStatusVariacaoProduto
);
