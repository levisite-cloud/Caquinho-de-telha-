import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Produto, Comanda, Venda, ItemCarrinho, FormaPagamento, Empresa, PrinterConfig } from './src/types';
import { firebaseConfig } from './firebaseConfig.js';

// Inicializar Firebase
const firebaseApp = initializeApp(firebaseConfig);
const dbId = firebaseConfig.firestoreDatabaseId;
const db = dbId ? getFirestore(firebaseApp, dbId) : getFirestore(firebaseApp);

// Porta padrão exigida pela infraestrutura
const PORT = 3000;

export const app = express();
app.use(express.json());

// === DEFAULT VALUES ===
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

// === ROTAS DA API ===

// 1. GESTÃO DE PRODUTOS

// Listar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const produtosSnapshot = await getDocs(collection(db, 'produtos'));
    const produtos = produtosSnapshot.docs.map(doc => doc.data() as Produto);
    res.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// Criar produto
app.post('/api/produtos', async (req, res) => {
  try {
    const { nome, categoria, precoCusto, precoVenda, estoque, controlarEstoque, estoqueMinimo } = req.body;

    if (!nome || !categoria || precoCusto === undefined || precoVenda === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    }

    const id = Math.random().toString(36).substring(2, 9);
    const novoProduto: Produto = {
      id,
      nome,
      categoria,
      precoCusto: Number(precoCusto),
      precoVenda: Number(precoVenda),
      estoque: controlarEstoque ? Number(estoque || 0) : 0,
      controlarEstoque: Boolean(controlarEstoque),
      estoqueMinimo: estoqueMinimo !== undefined ? Number(estoqueMinimo) : undefined
    };

    await setDoc(doc(db, 'produtos', id), novoProduto);
    res.status(201).json(novoProduto);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const produtoRef = doc(db, 'produtos', id);
    const produtoSnap = await getDoc(produtoRef);

    if (!produtoSnap.exists()) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const pOriginal = produtoSnap.data() as Produto;
    const produtoAtualizado: Produto = {
      ...pOriginal,
      nome: updateData.nome !== undefined ? updateData.nome : pOriginal.nome,
      categoria: updateData.categoria !== undefined ? updateData.categoria : pOriginal.categoria,
      precoCusto: updateData.precoCusto !== undefined ? Number(updateData.precoCusto) : pOriginal.precoCusto,
      precoVenda: updateData.precoVenda !== undefined ? Number(updateData.precoVenda) : pOriginal.precoVenda,
      estoque: updateData.controlarEstoque !== undefined ? (Boolean(updateData.controlarEstoque) ? Number(updateData.estoque || 0) : 0) : pOriginal.estoque,
      controlarEstoque: updateData.controlarEstoque !== undefined ? Boolean(updateData.controlarEstoque) : pOriginal.controlarEstoque,
      estoqueMinimo: updateData.estoqueMinimo !== undefined ? Number(updateData.estoqueMinimo) : pOriginal.estoqueMinimo
    };

    await updateDoc(produtoRef, produtoAtualizado as any);
    res.json(produtoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const produtoRef = doc(db, 'produtos', id);
    const produtoSnap = await getDoc(produtoRef);

    if (!produtoSnap.exists()) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    await deleteDoc(produtoRef);
    res.json({ message: 'Produto removido com sucesso.' });
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// 2. MÓDULO DE COMANDAS

// Listar comandas ativas
app.get('/api/comandas', async (req, res) => {
  try {
    const ativasOnly = req.query.ativas === 'true';
    let comandasQuery;
    
    if (ativasOnly) {
      comandasQuery = query(collection(db, 'comandas'), where('ativa', '==', true));
    } else {
      comandasQuery = collection(db, 'comandas');
    }
    
    const comandasSnapshot = await getDocs(comandasQuery);
    const comandas = comandasSnapshot.docs.map(doc => doc.data() as Comanda);
    res.json(comandas);
  } catch (error) {
    console.error('Erro ao listar comandas:', error);
    res.status(500).json({ error: 'Erro ao listar comandas' });
  }
});

// Abrir comanda/mesa
app.post('/api/comandas', async (req, res) => {
  try {
    const { identificador } = req.body;

    if (!identificador || identificador.trim() === '') {
      return res.status(400).json({ error: 'O identificador da comanda/mesa é obrigatório.' });
    }

    const comandasSnapshot = await getDocs(query(collection(db, 'comandas'), where('ativa', '==', true)));
    const comandas = comandasSnapshot.docs.map(doc => doc.data() as Comanda);
    
    const existente = comandas.find(c => c.identificador.toLowerCase() === identificador.toLowerCase());
    if (existente) {
      return res.status(400).json({ error: `Já existe uma comanda ativa para "${identificador}".` });
    }

    const id = Math.random().toString(36).substring(2, 9);
    const novaComanda: Comanda = {
      id,
      identificador: identificador.trim(),
      ativa: true,
      itens: [],
      dataAbertura: new Date().toISOString()
    };

    await setDoc(doc(db, 'comandas', id), novaComanda);
    res.status(201).json(novaComanda);
  } catch (error) {
    console.error('Erro ao abrir comanda:', error);
    res.status(500).json({ error: 'Erro ao abrir comanda' });
  }
});

// Adicionar ou atualizar itens gradativamente na comanda
app.put('/api/comandas/:id/itens', async (req, res) => {
  try {
    const { id } = req.params;
    const { itens } = req.body;

    if (!Array.isArray(itens)) {
      return res.status(400).json({ error: 'Formato de itens inválido.' });
    }

    const comandaRef = doc(db, 'comandas', id);
    const comandaSnap = await getDoc(comandaRef);

    if (!comandaSnap.exists() || !comandaSnap.data().ativa) {
      return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
    }

    const comanda = comandaSnap.data() as Comanda;
    comanda.itens = itens;

    await updateDoc(comandaRef, { itens });
    res.json(comanda);
  } catch (error) {
    console.error('Erro ao atualizar itens da comanda:', error);
    res.status(500).json({ error: 'Erro ao atualizar itens da comanda' });
  }
});

// Cancelar comanda ativa inteira
app.delete('/api/comandas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const comandaRef = doc(db, 'comandas', id);
    const comandaSnap = await getDoc(comandaRef);

    if (!comandaSnap.exists()) {
      return res.status(404).json({ error: 'Comanda não encontrada.' });
    }

    await deleteDoc(comandaRef);
    res.json({ message: 'Comanda cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro ao cancelar comanda:', error);
    res.status(500).json({ error: 'Erro ao cancelar comanda' });
  }
});

// 3. MÓDULO DE PDV (FRENTE DE CAIXA) & FECHAMENTO DE COMPRA

// Registrar Venda
app.post('/api/vendas', async (req, res) => {
  try {
    const { comandaId, itens, formaPagamento } = req.body;

    if (!formaPagamento) {
      return res.status(400).json({ error: 'A forma de pagamento é obrigatória.' });
    }

    let itensVenda: ItemCarrinho[] = [];
    let comandaIdentificador: string | undefined;

    if (comandaId) {
      const comandaRef = doc(db, 'comandas', comandaId);
      const comandaSnap = await getDoc(comandaRef);

      if (!comandaSnap.exists() || !comandaSnap.data().ativa) {
        return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
      }
      
      const comanda = comandaSnap.data() as Comanda;
      itensVenda = comanda.itens;
      comandaIdentificador = comanda.identificador;

      if (itensVenda.length === 0) {
        return res.status(400).json({ error: 'Não é possível fechar uma comanda vazia.' });
      }

      await updateDoc(comandaRef, { ativa: false });
    } else {
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
      }
      itensVenda = itens;
    }

    const total = itensVenda.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

    // Baixa no estoque
    for (const item of itensVenda) {
      const prodRef = doc(db, 'produtos', item.produtoId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const prod = prodSnap.data() as Produto;
        if (prod.controlarEstoque) {
          const novoEstoque = Math.max(0, prod.estoque - item.quantidade);
          await updateDoc(prodRef, { estoque: novoEstoque });
        }
      }
    }

    const novaVenda: Venda = {
      id: Math.random().toString(36).substring(2, 9),
      comandaId,
      comandaIdentificador,
      data: new Date().toISOString(),
      itens: itensVenda,
      total: Number(total.toFixed(2)),
      formaPagamento: formaPagamento as FormaPagamento
    };

    await setDoc(doc(db, 'vendas', novaVenda.id), novaVenda);
    res.status(201).json(novaVenda);
  } catch (error) {
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro ao registrar venda' });
  }
});

// 4. RELATÓRIOS E FECHAMENTO DE CAIXA
app.get('/api/vendas/relatorio', async (req, res) => {
  try {
    const hojeStr = new Date().toISOString().split('T')[0];
    const vendasSnapshot = await getDocs(collection(db, 'vendas'));
    const vendas = vendasSnapshot.docs.map(doc => doc.data() as Venda);
    
    const vendasHoje = vendas.filter(v => v.data.startsWith(hojeStr));
    const totalGeral = vendasHoje.reduce((acc, v) => acc + v.total, 0);

    const porForma: Record<string, number> = {
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
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

app.post('/api/vendas/reiniciar', async (req, res) => {
  try {
    const vendasSnapshot = await getDocs(collection(db, 'vendas'));
    for (const d of vendasSnapshot.docs) {
      await deleteDoc(d.ref);
    }
    
    const comandasSnapshot = await getDocs(collection(db, 'comandas'));
    for (const d of comandasSnapshot.docs) {
      await deleteDoc(d.ref);
    }
    
    res.json({ message: 'Vendas e comandas limpas (demonstração).' });
  } catch (error) {
    console.error('Erro ao limpar base:', error);
    res.status(500).json({ error: 'Erro ao limpar base' });
  }
});

// 5. CADASTRO DE EMPRESA
app.get('/api/empresa', async (req, res) => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'empresa'));
    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.json(defaultEmpresa);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

app.put('/api/empresa', async (req, res) => {
  try {
    const { nome, cnpj, endereco, telefone, slogan, logo } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
    }

    const dadosEmpresa = {
      nome: nome.trim(),
      cnpj: (cnpj || '').trim(),
      endereco: (endereco || '').trim(),
      telefone: (telefone || '').trim(),
      slogan: (slogan || '').trim(),
      logo: logo || ''
    };

    await setDoc(doc(db, 'config', 'empresa'), dadosEmpresa);
    res.json(dadosEmpresa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// 6. IMPRESSORAS
app.get('/api/printer-config', async (req, res) => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'printer'));
    if (docSnap.exists()) {
      res.json(docSnap.data());
    } else {
      res.json(defaultPrinterConfig);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar config de impressora' });
  }
});

app.put('/api/printer-config', async (req, res) => {
  try {
    const { cozinhaIp, cozinhaPorta, caixaIp, caixaPorta, usarApiRemota, apiUrl, apiToken, tipoImpressora } = req.body;

    const printerConfig = {
      cozinhaIp: (cozinhaIp || '192.168.1.100').trim(),
      cozinhaPorta: Number(cozinhaPorta) || 9100,
      caixaIp: (caixaIp || '192.168.1.200').trim(),
      caixaPorta: Number(caixaPorta) || 9100,
      usarApiRemota: !!usarApiRemota,
      apiUrl: (apiUrl || '').trim(),
      apiToken: (apiToken || '').trim(),
      tipoImpressora: tipoImpressora || 'escpos'
    };

    await setDoc(doc(db, 'config', 'printer'), printerConfig);
    res.json(printerConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar impressora' });
  }
});

app.post('/api/imprimir', async (req, res) => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'printer'));
    const config = docSnap.exists() ? docSnap.data() as PrinterConfig : defaultPrinterConfig;
    
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

    if (config.usarApiRemota && config.apiUrl) {
      console.log(`[Printer] Disparando requisição remota de impressão para: ${config.apiUrl}`);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (config.apiToken) headers['Authorization'] = `Bearer ${config.apiToken}`;

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
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
          error: `A API respondeu com erro (${response.status})`,
          payload
        });
      }
    }

    console.log(`[Thermal Print Simulation] Enviando cupom (${tipo}) para ${ipDestino}:${portaDestino}`);
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
  } catch (error: any) {
    console.error('Erro ao imprimir:', error);
    res.status(500).json({ error: 'Erro ao processar impressão.' });
  }
});

// 7. AUTENTICAÇÃO / LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Buscar a senha configurada no banco (config/auth)
    const authSnap = await getDoc(doc(db, 'config', 'auth'));
    let correctPassword = 'admin'; // Senha padrão se não configurada

    if (authSnap.exists() && authSnap.data().password) {
      correctPassword = authSnap.data().password;
    } else {
      // Se não existir, cria o documento com a senha padrão para uso futuro
      await setDoc(doc(db, 'config', 'auth'), { password: correctPassword });
    }

    if (password === correctPassword) {
      // Para fins de simplicidade neste PDV, retornamos apenas um token estático / sucesso
      res.json({ success: true, token: 'pdv_authenticated_token' });
    } else {
      res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no servidor durante o login.' });
  }
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
      console.log(`[PDV Server] Rodando com Firebase Firestore na porta ${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error('[Server] Erro ao iniciar servidor:', err);
});

export default app;
