export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  controlarEstoque: boolean;
  estoqueMinimo?: number;
}

export interface ItemCarrinho {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoVenda: number;
}

export interface Comanda {
  id: string;
  identificador: string; // ex: "Mesa 4" ou "Carlos"
  ativa: boolean;
  itens: ItemCarrinho[];
  dataAbertura: string;
}

export type FormaPagamento = 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX';

export interface Venda {
  id: string;
  comandaId?: string;
  comandaIdentificador?: string;
  data: string;
  itens: ItemCarrinho[];
  total: number;
  formaPagamento: FormaPagamento;
}

export interface Empresa {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  slogan: string;
  logo: string; // Base64 ou URL da imagem
}

export interface PrinterConfig {
  cozinhaIp: string;
  cozinhaPorta: number;
  caixaIp: string;
  caixaPorta: number;
  usarApiRemota: boolean;
  apiUrl: string;
  apiToken: string;
  tipoImpressora: 'escpos' | 'raw' | 'json';
}


