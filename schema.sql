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
  formaPagamento TEXT NOT NULL
);

-- Tabela genérica para configurações (Empresa, Impressora e Login)
CREATE TABLE IF NOT EXISTS config (
  id TEXT PRIMARY KEY,
  password TEXT,
  empresa JSONB,
  printer JSONB
);

-- ATIVAÇÃO DE POLÍTICAS DE SEGURANÇA (RLS)
-- Como este é o seu banco privado que será acessado via nossa API do backend no Vercel,
-- permitimos o acesso para simplificar a integração com a Chave Anon.
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on produtos" ON produtos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on comandas" ON comandas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on vendas" ON vendas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on config" ON config FOR ALL USING (true) WITH CHECK (true);
