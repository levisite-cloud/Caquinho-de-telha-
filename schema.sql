-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  precoCusto NUMERIC NOT NULL,
  precoVenda NUMERIC NOT NULL,
  estoque NUMERIC NOT NULL,
  controlarEstoque BOOLEAN NOT NULL,
  estoqueMinimo NUMERIC
);

-- Tabela de Comandas
CREATE TABLE IF NOT EXISTS comandas (
  id TEXT PRIMARY KEY,
  identificador TEXT NOT NULL,
  ativa BOOLEAN NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  dataAbertura TEXT NOT NULL
);

-- Tabela de Vendas
CREATE TABLE IF NOT EXISTS vendas (
  id TEXT PRIMARY KEY,
  comandaId TEXT,
  comandaIdentificador TEXT,
  data TEXT NOT NULL,
  itens JSONB NOT NULL DEFAULT '[]',
  total NUMERIC NOT NULL,
  formaPagamento TEXT NOT NULL,
  nfce_chave TEXT,
  nfce_status TEXT,
  nfce_xml TEXT,
  nfce_recibo TEXT
);

-- Tabela genérica para configurações (Empresa, Impressora e Login)
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  password TEXT,
  empresa JSONB,
  printer JSONB,
  licenca_validade TEXT
);

-- Tabela Central de Licenças (Para o dono gerenciar vendas SaaS)
CREATE TABLE IF NOT EXISTS licencas (
  id TEXT PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  cpf_cnpj TEXT NOT NULL,
  data_geracao TEXT NOT NULL,
  validade_dias NUMERIC NOT NULL,
  usada BOOLEAN NOT NULL DEFAULT false,
  usada_em TEXT
);

-- ATIVAÇÃO DE POLÍTICAS DE SEGURANÇA (RLS)
-- Como este é o seu banco privado que será acessado via nossa API do backend no Vercel,
-- permitimos o acesso para simplificar a integração com a Chave Anon.
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE licencas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendas" ON vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on config" ON config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on licencas" ON licencas FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Usuários (Operadores)
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  pin TEXT NOT NULL,
  data_criacao TEXT NOT NULL
);

-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS logs_auditoria (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  acao TEXT NOT NULL,
  detalhes TEXT,
  data_hora TEXT NOT NULL
);

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on logs_auditoria" ON logs_auditoria FOR ALL USING (true) WITH CHECK (true);

-- Tabela de Caixas
CREATE TABLE IF NOT EXISTS caixas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operador TEXT NOT NULL,
  terminal TEXT NOT NULL,
  turno TEXT NOT NULL,
  fundo_inicial NUMERIC NOT NULL,
  observacoes_abertura TEXT,
  status TEXT NOT NULL,
  data_abertura TEXT NOT NULL,
  data_fechamento TEXT,
  observacoes_fechamento TEXT,
  valor_contado NUMERIC,
  diferenca NUMERIC,
  justificativa_divergencia TEXT,
  total_vendido NUMERIC,
  total_dinheiro NUMERIC,
  total_pix NUMERIC,
  total_cartao_credito NUMERIC,
  total_cartao_debito NUMERIC
);

-- Tabela de Movimentações de Caixa
CREATE TABLE IF NOT EXISTS movimentacoes_caixa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id UUID REFERENCES caixas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  motivo TEXT,
  observacoes TEXT,
  operador TEXT NOT NULL,
  data_hora TEXT NOT NULL
);

ALTER TABLE caixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes_caixa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on caixas" ON caixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on movimentacoes_caixa" ON movimentacoes_caixa FOR ALL USING (true) WITH CHECK (true);
