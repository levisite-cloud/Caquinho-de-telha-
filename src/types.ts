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
  parcelas?: number;
  nfce_chave?: string;
  nfce_status?: string;
  nfce_xml?: string;
  nfce_recibo?: string;
}

export interface NfceConfig {
  ambiente: 'homologacao' | 'producao';
  uf: string;
  cnpj: string;
  inscricaoEstadual: string;
  csc: string;
  idCsc: string;
  apiUrl: string;
  certificadoBase64: string;
  certificadoSenha: string;
}

export interface PixConfig {
  chave: string;
  tipoChave: 'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatoria';
  nomeRecebedor: string;
  cidadeRecebedor: string;
}

export interface Empresa {
  nome: string;
  cnpj: string;
  endereco: string;
  telefone: string;
  slogan: string;
  logo: string; // Base64 ou URL da imagem
  pixConfig?: PixConfig;
  nfceConfig?: NfceConfig;
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


