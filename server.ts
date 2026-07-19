import express from 'express';
import path from 'path';
import fs from 'fs';
import { Produto, Comanda, Venda, ItemCarrinho, FormaPagamento, Empresa, PrinterConfig } from './src/types';

// Porta padrão exigida pela infraestrutura
const PORT = 3000;

// Interface para o banco de dados leve baseado em memória
interface DatabaseSchema {
  produtos: Produto[];
  comandas: Comanda[];
  vendas: Venda[];
  empresa: Empresa;
  printerConfig?: PrinterConfig;
}

const defaultEmpresa: Empresa = {
  nome: 'Sabor Gourmet',
  cnpj: '12.345.678/0001-99',
  endereco: 'Av. Paulista, 1000 - São Paulo, SP',
  telefone: '(11) 98765-4321',
  slogan: 'O melhor sabor da culinária brasileira',
  logo: ''
};

const defaultPrinterConfig: PrinterConfig = {
  cozinhaIp: '192.168.1.100',
  cozinhaPorta: 9100,
  caixaIp: '192.168.1.200',
  caixaPorta: 9100,
  usarApiRemota: false,
  apiUrl: 'http://localhost:8080/imprimir',
  apiToken: '',
  tipoImpressora: 'escpos'
};

// In-memory cache for ultra-fast, zero-latency synchronous reads
let dbMemoryCache: DatabaseSchema | null = null;

// Carrega o banco de dados inicial (chamado uma vez no startup do servidor)
async function initializeDb() {
  const defaultDb: DatabaseSchema = {
    produtos: [
      { id: '1', nome: 'Chopp Brahma 300ml', categoria: 'Bebidas', precoCusto: 3.50, precoVenda: 9.90, estoque: 150, controlarEstoque: true },
      { id: '2', nome: 'Coca-Cola Lata 350ml', categoria: 'Bebidas', precoCusto: 1.80, precoVenda: 6.00, estoque: 85, controlarEstoque: true },
      { id: '3', nome: 'Prato Feito de Frango', categoria: 'Almoço/Pratos', precoCusto: 10.00, precoVenda: 23.90, estoque: 0, controlarEstoque: false },
      { id: '4', nome: 'Feijoada Completa (Individual)', categoria: 'Almoço/Pratos', precoCusto: 16.50, precoVenda: 35.90, estoque: 0, controlarEstoque: false },
      { id: '5', nome: 'Pudim de Leite Condensado', categoria: 'Sobremesas', precoCusto: 2.20, precoVenda: 8.00, estoque: 20, controlarEstoque: true },
      { id: '6', nome: 'Água Mineral sem Gás 500ml', categoria: 'Bebidas', precoCusto: 1.00, precoVenda: 4.00, estoque: 100, controlarEstoque: true },
      { id: '7', nome: 'Executivo de Alcatra Grelhada', categoria: 'Almoço/Pratos', precoCusto: 19.00, precoVenda: 39.90, estoque: 0, controlarEstoque: false },
      { id: '8', nome: 'Mousse de Maracujá', categoria: 'Sobremesas', precoCusto: 2.50, precoVenda: 9.00, estoque: 12, controlarEstoque: true }
    ],
    comandas: [
      {
        id: 'c1',
        identificador: 'Mesa 3',
        ativa: true,
        itens: [
          { produtoId: '1', nome: 'Chopp Brahma 300ml', quantidade: 3, precoVenda: 9.90 },
          { produtoId: '4', nome: 'Feijoada Completa (Individual)', quantidade: 1, precoVenda: 35.90 }
        ],
        dataAbertura: new Date().toISOString()
      },
      {
        id: 'c2',
        identificador: 'Comanda 42 (Bruno)',
        ativa: true,
        itens: [
          { produtoId: '2', nome: 'Coca-Cola Lata 350ml', quantidade: 1, precoVenda: 6.00 },
          { produtoId: '3', nome: 'Prato Feito de Frango', quantidade: 1, precoVenda: 23.90 }
        ],
        dataAbertura: new Date().toISOString()
      }
    ],
    vendas: [],
    empresa: defaultEmpresa,
    printerConfig: defaultPrinterConfig
  };

  dbMemoryCache = defaultDb;
  console.log('[Database] Banco de dados in-memory inicializado com sucesso!');
}

// Retorna de forma síncrona o cache de memória atual para os endpoints
function loadDb(): DatabaseSchema {
  if (!dbMemoryCache) {
    dbMemoryCache = {
      produtos: [],
      comandas: [],
      vendas: [],
      empresa: defaultEmpresa,
      printerConfig: defaultPrinterConfig
    };
  }
  return dbMemoryCache!;
}

// Salva de forma imediata na memória
function saveDb(data: DatabaseSchema) {
  dbMemoryCache = data;
}

// Inicializa o banco de dados carregando na memória
initializeDb().catch(err => {
  console.error('[Database] Erro ao carregar banco de dados inicial:', err);
});

export const app = express();
app.use(express.json());

  // === ROTAS DA API ===

  // 1. GESTÃO DE PRODUTOS

  // Listar produtos
  app.get('/api/produtos', (req, res) => {
    const db = loadDb();
    res.json(db.produtos);
  });

  // Criar produto
  app.post('/api/produtos', (req, res) => {
    const db = loadDb();
    const { nome, categoria, precoCusto, precoVenda, estoque, controlarEstoque, estoqueMinimo } = req.body;

    if (!nome || !categoria || precoCusto === undefined || precoVenda === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const novoProduto: Produto = {
      id: Math.random().toString(36).substring(2, 9),
      nome,
      categoria,
      precoCusto: Number(precoCusto),
      precoVenda: Number(precoVenda),
      estoque: controlarEstoque ? Number(estoque || 0) : 0,
      controlarEstoque: Boolean(controlarEstoque),
      estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : undefined
    };

    db.produtos.push(novoProduto);
    saveDb(db);
    res.status(201).json(novoProduto);
  });

  // Atualizar produto
  app.put('/api/produtos/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    const { nome, categoria, precoCusto, precoVenda, estoque, controlarEstoque, estoqueMinimo } = req.body;

    const index = db.produtos.findIndex(p => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const pOriginal = db.produtos[index];
    db.produtos[index] = {
      ...pOriginal,
      nome: nome !== undefined ? nome : pOriginal.nome,
      categoria: categoria !== undefined ? categoria : pOriginal.categoria,
      precoCusto: precoCusto !== undefined ? Number(precoCusto) : pOriginal.precoCusto,
      precoVenda: precoVenda !== undefined ? Number(precoVenda) : pOriginal.precoVenda,
      estoque: controlarEstoque !== undefined ? (Boolean(controlarEstoque) ? Number(estoque || 0) : 0) : pOriginal.estoque,
      controlarEstoque: controlarEstoque !== undefined ? Boolean(controlarEstoque) : pOriginal.controlarEstoque,
      estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : pOriginal.estoqueMinimo
    };

    saveDb(db);
    res.json(db.produtos[index]);
  });

  // Deletar produto
  app.delete('/api/produtos/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;

    const filtrados = db.produtos.filter(p => p.id !== id);
    if (filtrados.length === db.produtos.length) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    db.produtos = filtrados;
    saveDb(db);
    res.json({ message: 'Produto removido com sucesso.' });
  });


  // 2. MÓDULO DE COMANDAS

  // Listar comandas ativas
  app.get('/api/comandas', (req, res) => {
    const db = loadDb();
    const ativasOnly = req.query.ativas === 'true';
    if (ativasOnly) {
      res.json(db.comandas.filter(c => c.ativa));
    } else {
      res.json(db.comandas);
    }
  });

  // Abrir comanda/mesa
  app.post('/api/comandas', (req, res) => {
    const db = loadDb();
    const { identificador } = req.body;

    if (!identificador || identificador.trim() === '') {
      return res.status(400).json({ error: 'O identificador da comanda/mesa é obrigatório.' });
    }

    // Verifica se já existe uma comanda ativa com o mesmo nome para evitar duplicados chatos
    const existente = db.comandas.find(c => c.ativa && c.identificador.toLowerCase() === identificador.toLowerCase());
    if (existente) {
      return res.status(400).json({ error: `Já existe uma comanda ativa para "${identificador}".` });
    }

    const novaComanda: Comanda = {
      id: Math.random().toString(36).substring(2, 9),
      identificador: identificador.trim(),
      ativa: true,
      itens: [],
      dataAbertura: new Date().toISOString()
    };

    db.comandas.push(novaComanda);
    saveDb(db);
    res.status(201).json(novaComanda);
  });

  // Adicionar ou atualizar itens gradativamente na comanda
  app.put('/api/comandas/:id/itens', (req, res) => {
    const db = loadDb();
    const { id } = req.params;
    const { itens } = req.body; // Array de ItemCarrinho

    if (!Array.isArray(itens)) {
      return res.status(400).json({ error: 'Formato de itens inválido.' });
    }

    const comanda = db.comandas.find(c => c.id === id && c.ativa);
    if (!comanda) {
      return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
    }

    comanda.itens = itens;
    saveDb(db);
    res.json(comanda);
  });

  // Cancelar comanda ativa inteira (excluir ou desativar)
  app.delete('/api/comandas/:id', (req, res) => {
    const db = loadDb();
    const { id } = req.params;

    const index = db.comandas.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Comanda não encontrada.' });
    }

    db.comandas.splice(index, 1);
    saveDb(db);
    res.json({ message: 'Comanda cancelada com sucesso.' });
  });


  // 3. MÓDULO DE PDV (FRENTE DE CAIXA) & FECHAMENTO DE COMPRA

  // Registrar Venda (seja Direta ou Fechando Comanda)
  app.post('/api/vendas', (req, res) => {
    const db = loadDb();
    const { comandaId, itens, formaPagamento } = req.body;

    if (!formaPagamento) {
      return res.status(400).json({ error: 'A forma de pagamento é obrigatória.' });
    }

    let itensVenda: ItemCarrinho[] = [];
    let comandaIdentificador: string | undefined;

    // Se vier de uma comanda
    if (comandaId) {
      const comandaIndex = db.comandas.findIndex(c => c.id === comandaId && c.ativa);
      if (comandaIndex === -1) {
        return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
      }
      
      const comanda = db.comandas[comandaIndex];
      itensVenda = comanda.itens;
      comandaIdentificador = comanda.identificador;

      if (itensVenda.length === 0) {
        return res.status(400).json({ error: 'Não é possível fechar uma comanda vazia.' });
      }

      // Desativa/fecha a comanda
      comanda.ativa = false;
    } else {
      // Venda direta de balcão
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
      }
      itensVenda = itens;
    }

    // Calcula o total
    const total = itensVenda.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

    // Baixa inteligente no estoque para os produtos vendidos
    itensVenda.forEach(item => {
      const prod = db.produtos.find(p => p.id === item.produtoId);
      if (prod) {
        // Verifica se o controle de estoque está ativo para o produto
        if (prod.controlarEstoque) {
          prod.estoque = Math.max(0, prod.estoque - item.quantidade); // Evita estoque negativo indesejado, mas deduz
        }
      }
    });

    // Registra a venda
    const novaVenda: Venda = {
      id: Math.random().toString(36).substring(2, 9),
      comandaId,
      comandaIdentificador,
      data: new Date().toISOString(),
      itens: itensVenda,
      total: Number(total.toFixed(2)),
      formaPagamento: formaPagamento as FormaPagamento
    };

    db.vendas.push(novaVenda);
    saveDb(db);

    res.status(201).json(novaVenda);
  });


  // 4. RELATÓRIOS E FECHAMENTO DE CAIXA

  app.get('/api/vendas/relatorio', (req, res) => {
    const db = loadDb();
    
    // Filtro opcional por período de dias (padrão: hoje)
    const hojeStr = new Date().toISOString().split('T')[0];

    const vendasHoje = db.vendas.filter(v => v.data.startsWith(hojeStr));

    const totalGeral = vendasHoje.reduce((acc, v) => acc + v.total, 0);

    // Separar por forma de pagamento
    const porForma = {
      'Dinheiro': 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0,
      'PIX': 0
    };

    vendasHoje.forEach(v => {
      if (porForma[v.formaPagamento] !== undefined) {
        porForma[v.formaPagamento] += v.total;
      }
    });

    // Calcula quantidade de produtos mais vendidos hoje
    const produtosVendidos: { [nome: string]: number } = {};
    vendasHoje.forEach(v => {
      v.itens.forEach(item => {
        produtosVendidos[item.nome] = (produtosVendidos[item.nome] || 0) + item.quantidade;
      });
    });

    const maisVendidos = Object.entries(produtosVendidos)
      .map(([nome, quantidade]) => ({ nome, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5);

    res.json({
      data: hojeStr,
      totalGeral: Number(totalGeral.toFixed(2)),
      porForma: {
        'Dinheiro': Number(porForma['Dinheiro'].toFixed(2)),
        'Cartão de Crédito': Number(porForma['Cartão de Crédito'].toFixed(2)),
        'Cartão de Débito': Number(porForma['Cartão de Débito'].toFixed(2)),
        'PIX': Number(porForma['PIX'].toFixed(2))
      },
      quantidadeVendas: vendasHoje.length,
      maisVendidos,
      vendasDetalhadas: vendasHoje
    });
  });

  // Limpar histórico de vendas/reiniciar caixa do dia (útil para testes rápidos)
  app.post('/api/vendas/reiniciar', (req, res) => {
    const db = loadDb();
    db.vendas = [];
    // Opcional: recarregar estoque dos produtos de controle para o padrão
    db.produtos.forEach(p => {
      if (p.id === '1') p.estoque = 150;
      if (p.id === '2') p.estoque = 85;
      if (p.id === '5') p.estoque = 20;
      if (p.id === '6') p.estoque = 100;
      if (p.id === '8') p.estoque = 12;
    });
    // Limpa comandas também para reiniciar testes limpos
    db.comandas = [
      {
        id: 'c1',
        identificador: 'Mesa 3',
        ativa: true,
        itens: [
          { produtoId: '1', nome: 'Chopp Brahma 300ml', quantidade: 3, precoVenda: 9.90 },
          { produtoId: '4', nome: 'Feijoada Completa (Individual)', quantidade: 1, precoVenda: 35.90 }
        ],
        dataAbertura: new Date().toISOString()
      },
      {
        id: 'c2',
        identificador: 'Comanda 42 (Bruno)',
        ativa: true,
        itens: [
          { produtoId: '2', nome: 'Coca-Cola Lata 350ml', quantidade: 1, precoVenda: 6.00 },
          { produtoId: '3', nome: 'Prato Feito de Frango', quantidade: 1, precoVenda: 23.90 }
        ],
        dataAbertura: new Date().toISOString()
      }
    ];
    saveDb(db);
    res.json({ message: 'Caixa e comandas reiniciados para valores de demonstração.' });
  });

  // 5. CADASTRO DE EMPRESA / ESTABELECIMENTO
  
  // Obter dados da empresa
  app.get('/api/empresa', (req, res) => {
    const db = loadDb();
    res.json(db.empresa || defaultEmpresa);
  });

  // Salvar dados da empresa
  app.put('/api/empresa', (req, res) => {
    const db = loadDb();
    const { nome, cnpj, endereco, telefone, slogan, logo } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
    }

    db.empresa = {
      nome: nome.trim(),
      cnpj: (cnpj || '').trim(),
      endereco: (endereco || '').trim(),
      telefone: (telefone || '').trim(),
      slogan: (slogan || '').trim(),
      logo: logo || ''
    };

    saveDb(db);
    res.json(db.empresa);
  });

  // --- CONFIGURAÇÃO DE IMPRESSORAS ---

  // Obter configurações de impressão
  app.get('/api/printer-config', (req, res) => {
    const db = loadDb();
    res.json(db.printerConfig || defaultPrinterConfig);
  });

  // Salvar configurações de impressão
  app.put('/api/printer-config', (req, res) => {
    const db = loadDb();
    const { cozinhaIp, cozinhaPorta, caixaIp, caixaPorta, usarApiRemota, apiUrl, apiToken, tipoImpressora } = req.body;

    db.printerConfig = {
      cozinhaIp: (cozinhaIp || '192.168.1.100').trim(),
      cozinhaPorta: Number(cozinhaPorta) || 9100,
      caixaIp: (caixaIp || '192.168.1.200').trim(),
      caixaPorta: Number(caixaPorta) || 9100,
      usarApiRemota: !!usarApiRemota,
      apiUrl: (apiUrl || '').trim(),
      apiToken: (apiToken || '').trim(),
      tipoImpressora: tipoImpressora || 'escpos'
    };

    saveDb(db);
    res.json(db.printerConfig);
  });

  // Enviar comando de impressão para API remota ou simular conexão direta
  app.post('/api/imprimir', async (req, res) => {
    const db = loadDb();
    const config = db.printerConfig || defaultPrinterConfig;
    const { tipo, identificador, itens, observacao, data, textoFormatado } = req.body;

    const ipDestino = tipo === 'cozinha' ? config.cozinhaIp : config.caixaIp;
    const portaDestino = tipo === 'cozinha' ? config.cozinhaPorta : config.caixaPorta;

    const payload = {
      timestamp: new Date().toISOString(),
      tipo,
      identificador,
      itens,
      observacao,
      data,
      textoFormatado,
      device: {
        ip: ipDestino,
        port: portaDestino,
        tipoImpressora: config.tipoImpressora
      }
    };

    // Caso o usuário queira disparar uma requisição real para um servidor de impressão
    if (config.usarApiRemota && config.apiUrl) {
      try {
        console.log(`[Printer] Disparando requisição remota de impressão para: ${config.apiUrl}`);
        
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        
        if (config.apiToken) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
        }

        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          // define um timeout pequeno para não travar a requisição se a API estiver fora
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const responseData = await response.json().catch(() => ({}));
          return res.json({
            success: true,
            metodo: 'api_remota',
            mensagem: `Impresso com sucesso via API Remota em: ${config.apiUrl}`,
            detalhes: responseData,
            payload
          });
        } else {
          return res.status(502).json({
            success: false,
            metodo: 'api_remota',
            error: `A API de Impressão respondeu com erro (${response.status}: ${response.statusText})`,
            payload
          });
        }
      } catch (err: any) {
        console.error('Erro ao conectar com API remota de impressão:', err);
        return res.status(504).json({
          success: false,
          metodo: 'api_remota',
          error: `Não foi possível conectar à API Remota de Impressão. Detalhes: ${err.message || err}`,
          payload
        });
      }
    }

    // Se não estiver usando API remota externa, fazemos a simulação local simulando rede
    console.log(`[Thermal Print Simulation] Enviando cupom (${tipo}) para ${ipDestino}:${portaDestino}`);
    
    // Retorna uma resposta estruturada de simulação que o front-end usará para mostrar o log real
    setTimeout(() => {
      res.json({
        success: true,
        metodo: 'conexao_direta_simulada',
        mensagem: `Dados enviados com sucesso para a impressora térmica em ${ipDestino}:${portaDestino}`,
        detalhes: {
          ip: ipDestino,
          porta: portaDestino,
          comando: config.tipoImpressora === 'escpos' ? 'ESC/POS Raw Bytes Generated' : 'Plain Text Data Stream',
          bytesEnviados: Buffer.byteLength(textoFormatado || '', 'utf-8')
        },
        payload
      });
    }, 800);
  });

  // Serve static files / Vite middleware & listen
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    if (process.env.VERCEL !== '1') {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`[PDV Server] Rodando com sucesso na porta ${PORT}`);
      });
    }
  }

  startServer().catch(err => {
    console.error('[Server] Erro ao iniciar servidor:', err);
  });

  export default app;
