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
  caixa_id?: string;
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
  permitirEstoqueNegativo?: boolean;
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
export type SyncState = 'Sincronizado' | 'Sincronizando' | 'Erro';

export interface SyncStatus {
  supabase: SyncState;
  github: SyncState;
  vercel: SyncState;
  apis: SyncState;
  storage: SyncState;
  ultimaSincronizacao: string | null;
}

export interface SyncLog {
  dataHora: string;
  usuario: string;
  tempoExecucaoMs: number;
  servicos: string[];
  resultado: 'Sucesso' | 'Erro';
  detalhes?: string;
}

export type StatusCaixa = 'Aberto' | 'Fechado';

export interface Caixa {
  id: string;
  data_abertura: string;
  data_fechamento?: string;
  operador: string;
  terminal: string;
  turno: string;
  fundo_inicial: number;
  status: StatusCaixa;
  observacoes_abertura?: string;
  observacoes_fechamento?: string;
  valor_contado?: number;
  diferenca?: number;
  justificativa_divergencia?: string;
  total_vendido?: number;
  total_dinheiro?: number;
  total_pix?: number;
  total_cartao_credito?: number;
  total_cartao_debito?: number;
}

export type TipoMovimentacao = 'Sangria' | 'Suprimento';

export interface MovimentacaoCaixa {
  id: string;
  caixa_id: string;
  tipo: TipoMovimentacao;
  valor: number;
  motivo: string;
  observacoes?: string;
  operador: string;
  data_hora: string;
}
