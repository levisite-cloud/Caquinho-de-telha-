import 'dotenv/config';
import express from 'express';
import path from 'path';
import Groq from 'groq-sdk';
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
import { createClient } from '@supabase/supabase-js';
import { Produto, Comanda, Venda, ItemCarrinho, FormaPagamento, Empresa, PrinterConfig } from './src/types.js';
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig.js';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Porta padrão exigida pela infraestrutura
const PORT = 3000;

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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

// === ROTAS DA API (SUPABASE) ===

// 1. GESTÃO DE PRODUTOS

// Listar produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { data, error } = await supabase.from('produtos').select('*');
    if (error) throw error;
    
    // Map postgres lowercase columns to camelCase expected by the frontend
    const mappedData = data.map((p: any) => ({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      precoCusto: p.precocusto,
      precoVenda: p.precovenda,
      estoque: p.estoque,
      controlarEstoque: p.controlarestoque,
      estoqueMinimo: p.estoqueminimo
    }));
    
    res.json(mappedData);
  } catch (error: any) {
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
    const novoProdutoDB: any = {
      id,
      nome,
      categoria,
      precocusto: Number(precoCusto),
      precovenda: Number(precoVenda),
      estoque: controlarEstoque ? Number(estoque || 0) : 0,
      controlarestoque: Boolean(controlarEstoque)
    };
    if (estoqueMinimo !== undefined && estoqueMinimo !== null) {
      novoProdutoDB.estoqueminimo = Number(estoqueMinimo);
    } else {
      novoProdutoDB.estoqueminimo = null;
    }

    const { error } = await supabase.from('produtos').insert([novoProdutoDB]);
    if (error) throw error;

    res.status(201).json({
      id: novoProdutoDB.id,
      nome: novoProdutoDB.nome,
      categoria: novoProdutoDB.categoria,
      precoCusto: novoProdutoDB.precocusto,
      precoVenda: novoProdutoDB.precovenda,
      estoque: novoProdutoDB.estoque,
      controlarEstoque: novoProdutoDB.controlarestoque,
      estoqueMinimo: novoProdutoDB.estoqueminimo
    });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ error: 'Erro ao criar produto: ' + error.message });
  }
});

// Atualizar produto
app.put('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Buscar produto original
    const { data: pOriginal, error: getError } = await supabase.from('produtos').select('*').eq('id', id).single();
    
    if (getError || !pOriginal) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    const produtoAtualizadoDB: any = {
      ...pOriginal,
      nome: updateData.nome !== undefined ? updateData.nome : pOriginal.nome,
      categoria: updateData.categoria !== undefined ? updateData.categoria : pOriginal.categoria,
      precocusto: updateData.precoCusto !== undefined ? Number(updateData.precoCusto) : pOriginal.precocusto,
      precovenda: updateData.precoVenda !== undefined ? Number(updateData.precoVenda) : pOriginal.precovenda,
      estoque: updateData.controlarEstoque !== undefined ? (Boolean(updateData.controlarEstoque) ? Number(updateData.estoque || 0) : 0) : pOriginal.estoque,
      controlarestoque: updateData.controlarEstoque !== undefined ? Boolean(updateData.controlarEstoque) : pOriginal.controlarestoque,
      estoqueminimo: updateData.estoqueMinimo !== undefined ? (updateData.estoqueMinimo === null ? null : Number(updateData.estoqueMinimo)) : pOriginal.estoqueminimo
    };

    const { error: updateError } = await supabase.from('produtos').update(produtoAtualizadoDB).eq('id', id);
    if (updateError) throw updateError;

    res.json({
      id: produtoAtualizadoDB.id,
      nome: produtoAtualizadoDB.nome,
      categoria: produtoAtualizadoDB.categoria,
      precoCusto: produtoAtualizadoDB.precocusto,
      precoVenda: produtoAtualizadoDB.precovenda,
      estoque: produtoAtualizadoDB.estoque,
      controlarEstoque: produtoAtualizadoDB.controlarestoque,
      estoqueMinimo: produtoAtualizadoDB.estoqueminimo
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ error: 'Erro ao atualizar produto: ' + error.message });
  }
});

// Deletar produto
app.delete('/api/produtos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('produtos').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Produto removido com sucesso.' });
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ error: 'Erro ao deletar produto: ' + error.message });
  }
});

// 2. MÓDULO DE COMANDAS

// Listar comandas ativas
app.get('/api/comandas', async (req, res) => {
  try {
    const ativasOnly = req.query.ativas === 'true';
    let query = supabase.from('comandas').select('*');
    
    if (ativasOnly) {
      query = query.eq('ativa', true);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    const mappedData = data.map((c: any) => ({
      id: c.id,
      identificador: c.identificador,
      ativa: c.ativa,
      itens: c.itens,
      dataAbertura: c.dataabertura
    }));
    
    res.json(mappedData);
  } catch (error: any) {
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

    // Verificar se já existe comanda ativa com este nome
    const { data: existentes, error: checkError } = await supabase
      .from('comandas')
      .select('*')
      .eq('ativa', true)
      .ilike('identificador', identificador.trim());
      
    if (checkError) throw checkError;

    if (existentes && existentes.length > 0) {
      return res.status(400).json({ error: `Já existe uma comanda ativa para "${identificador}".` });
    }

    const id = Math.random().toString(36).substring(2, 9);
    const novaComandaDB = {
      id,
      identificador: identificador.trim(),
      ativa: true,
      itens: [],
      dataabertura: new Date().toISOString()
    };

    const { error } = await supabase.from('comandas').insert([novaComandaDB]);
    if (error) throw error;

    res.status(201).json({
      id: novaComandaDB.id,
      identificador: novaComandaDB.identificador,
      ativa: novaComandaDB.ativa,
      itens: novaComandaDB.itens,
      dataAbertura: novaComandaDB.dataabertura
    });
  } catch (error: any) {
    console.error('Erro ao abrir comanda:', error);
    res.status(500).json({ error: 'Erro ao abrir comanda: ' + error.message });
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

    const { data: comanda, error: getError } = await supabase.from('comandas').select('*').eq('id', id).single();

    if (getError || !comanda || !comanda.ativa) {
      return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
    }

    const { error: updateError } = await supabase.from('comandas').update({ itens }).eq('id', id);
    if (updateError) throw updateError;

    comanda.itens = itens;
    res.json(comanda);
  } catch (error: any) {
    console.error('Erro ao atualizar itens da comanda:', error);
    res.status(500).json({ error: 'Erro ao atualizar itens da comanda' });
  }
});

// Cancelar comanda ativa inteira
app.delete('/api/comandas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('comandas').delete().eq('id', id);
    if (error) throw error;
    res.json({ message: 'Comanda cancelada com sucesso.' });
  } catch (error: any) {
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
      const { data: comanda, error: getError } = await supabase.from('comandas').select('*').eq('id', comandaId).single();

      if (getError || !comanda || !comanda.ativa) {
        return res.status(404).json({ error: 'Comanda ativa não encontrada.' });
      }
      
      itensVenda = comanda.itens;
      comandaIdentificador = comanda.identificador;

      if (itensVenda.length === 0) {
        return res.status(400).json({ error: 'Não é possível fechar uma comanda vazia.' });
      }

      await supabase.from('comandas').update({ ativa: false }).eq('id', comandaId);
    } else {
      if (!itens || !Array.isArray(itens) || itens.length === 0) {
        return res.status(400).json({ error: 'O carrinho está vazio.' });
      }
      itensVenda = itens;
    }

    const total = itensVenda.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

    // Baixa no estoque
    for (const item of itensVenda) {
      const { data: prod } = await supabase.from('produtos').select('*').eq('id', item.produtoId).single();
      if (prod && prod.controlarEstoque) {
        const novoEstoque = Math.max(0, prod.estoque - item.quantidade);
        await supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.produtoId);
      }
    }

    const novaVendaDB: any = {
      id: Math.random().toString(36).substring(2, 9),
      comandaid: comandaId,
      comandaidentificador: comandaIdentificador,
      data: new Date().toISOString(),
      itens: itensVenda,
      total: Number(total.toFixed(2)),
      formapagamento: formaPagamento as FormaPagamento
    };

    const { error: insertError } = await supabase.from('vendas').insert([novaVendaDB]);
    if (insertError) throw insertError;

    res.status(201).json({
      id: novaVendaDB.id,
      comandaId: novaVendaDB.comandaid,
      comandaIdentificador: novaVendaDB.comandaidentificador,
      data: novaVendaDB.data,
      itens: novaVendaDB.itens,
      total: novaVendaDB.total,
      formaPagamento: novaVendaDB.formapagamento
    });
  } catch (error: any) {
    console.error('Erro ao registrar venda:', error);
    res.status(500).json({ error: 'Erro ao registrar venda: ' + error.message });
  }
});

// 4. RELATÓRIOS E FECHAMENTO DE CAIXA
app.get('/api/vendas/relatorio', async (req, res) => {
  try {
    const hojeStr = new Date().toISOString().split('T')[0];
    
    // Pegar vendas que a data começa com hoje
    const { data: vendas, error } = await supabase
      .from('vendas')
      .select('*')
      .like('data', `${hojeStr}%`);
      
    if (error) throw error;
    
    const vendasHoje = (vendas || []).map((v: any) => ({
      id: v.id,
      comandaId: v.comandaid,
      comandaIdentificador: v.comandaidentificador,
      data: v.data,
      itens: v.itens,
      total: v.total,
      formaPagamento: v.formapagamento
    }));
    const totalGeral = vendasHoje.reduce((acc: any, v: any) => acc + v.total, 0);

    const porForma: Record<string, number> = {
      'Dinheiro': 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0,
      'PIX': 0
    };

    vendasHoje.forEach((v: any) => {
      if (v.formaPagamento.startsWith('Cartão de Crédito')) {
        porForma['Cartão de Crédito'] += v.total;
      } else if (porForma[v.formaPagamento] !== undefined) {
        porForma[v.formaPagamento] += v.total;
      }
    });

    const produtosVendidos: { [nome: string]: number } = {};
    vendasHoje.forEach(v => {
      v.itens.forEach((item: any) => {
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
  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
});

app.post('/api/vendas/reiniciar', async (req, res) => {
  try {
    // Delete all from vendas and comandas (demonstração)
    await supabase.from('vendas').delete().neq('id', '0');
    await supabase.from('comandas').delete().neq('id', '0');
    
    res.json({ message: 'Vendas e comandas limpas (demonstração).' });
  } catch (error: any) {
    console.error('Erro ao limpar base:', error);
    res.status(500).json({ error: 'Erro ao limpar base' });
  }
});

// 5. CADASTRO DE EMPRESA
app.get('/api/empresa', async (req, res) => {
  try {
    const { data: configSnap } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    if (configSnap && configSnap.empresa) {
      res.json(configSnap.empresa);
    } else {
      res.json(defaultEmpresa);
    }
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
});

app.put('/api/empresa', async (req, res) => {
  try {
    const { nome, cnpj, endereco, telefone, slogan, logo, pixConfig, nfceConfig } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome da empresa é obrigatório.' });
    }

    const dadosEmpresa = {
      nome: nome.trim(),
      cnpj: (cnpj || '').trim(),
      endereco: (endereco || '').trim(),
      telefone: (telefone || '').trim(),
      slogan: (slogan || '').trim(),
      logo: logo || '',
      pixConfig: pixConfig || undefined,
      nfceConfig: nfceConfig || undefined
    };

    const { error } = await supabase.from('config').upsert({ id: 'empresa', empresa: dadosEmpresa });
    if (error) throw error;

    res.json(dadosEmpresa);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// 6. IMPRESSORAS
app.get('/api/printer-config', async (req, res) => {
  try {
    const { data: configSnap } = await supabase.from('config').select('printer').eq('id', 'printer').single();
    if (configSnap && configSnap.printer) {
      res.json(configSnap.printer);
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

    const { error } = await supabase.from('config').upsert({ id: 'printer', printer: printerConfig });
    if (error) throw error;
    
    res.json(printerConfig);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar impressora' });
  }
});

app.post('/api/imprimir', async (req, res) => {
  try {
    const { data: configSnap } = await supabase.from('config').select('printer').eq('id', 'printer').single();
    const config = (configSnap && configSnap.printer) ? configSnap.printer as PrinterConfig : defaultPrinterConfig;
    
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
    const { data: authSnap } = await supabase.from('config').select('password').eq('id', 'auth').single();
    let correctPassword = 'admin'; // Senha padrão se não configurada

    if (authSnap && authSnap.password) {
      correctPassword = authSnap.password;
    } else {
      // Se não existir, cria o documento com a senha padrão para uso futuro
      await supabase.from('config').upsert({ id: 'auth', password: correctPassword });
    }

    // CHECAR LICENÇA DO SISTEMA ANTES DO LOGIN
    const { data: licencaSnap } = await supabase.from('config').select('licenca_validade').eq('id', 'licenca').single();
    if (licencaSnap && licencaSnap.licenca_validade) {
      const validade = new Date(licencaSnap.licenca_validade);
      if (validade < new Date()) {
        return res.status(403).json({ success: false, error: 'LICENCA_EXPIRADA', message: 'Sua licença expirou. Entre em contato com o suporte ou insira uma nova licença.' });
      }
    } else {
      // Se não existir, consideramos expirada (ou podemos considerar período de teste de 7 dias, mas vamos bloquear)
      // Para não travar sistemas antigos, vamos liberar por padrão se não tiver nada ainda,
      // mas na prática, o dono deveria configurar isso. 
      // Para garantir que o usuário não perca acesso instantâneo agora, criaremos uma licença provisória de 3 dias se não existir.
      const tresDias = new Date();
      tresDias.setDate(tresDias.getDate() + 3);
      await supabase.from('config').upsert({ id: 'licenca', licenca_validade: tresDias.toISOString() });
    }

    if (password === correctPassword) {
      // Para fins de simplicidade neste PDV, retornamos apenas um token estático / sucesso
      res.json({ success: true, token: 'pdv_authenticated_token' });
    } else {
      res.status(401).json({ success: false, error: 'Senha incorreta.' });
    }
  } catch (error: any) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro no Supabase: ' + (error.message || String(error)) });
  }
});

// 8. LICENCIAMENTO (SaaS)
// MASTER ADMIN: Gerar nova licença
app.post('/api/master/licencas', async (req, res) => {
  try {
    const { masterPassword, cpf_cnpj, validade_dias } = req.body;
    
    // Hardcoded master password para o desenvolvedor
    if (masterPassword !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }

    if (!cpf_cnpj) {
      return res.status(400).json({ error: 'CPF ou CNPJ é obrigatório.' });
    }

    const dias = validade_dias ? Number(validade_dias) : 30;
    
    // Gerar código único: LIC-XXXX-XXXX
    const randPart1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const codigo = `LIC-${randPart1}-${randPart2}`;

    const novaLicenca = {
      id: Math.random().toString(36).substring(2, 9),
      codigo,
      cpf_cnpj,
      data_geracao: new Date().toISOString(),
      validade_dias: dias,
      usada: false
    };

    const { error } = await supabase.from('licencas').insert([novaLicenca]);
    if (error) throw error;

    res.json(novaLicenca);
  } catch (error: any) {
    console.error('Erro ao gerar licença:', error);
    res.status(500).json({ error: 'Erro ao gerar licença' });
  }
});

// MASTER ADMIN: Status do Sistema Local
app.get('/api/master/status-sistema', async (req, res) => {
  try {
    const { masterPassword } = req.query;
    if (masterPassword !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }
    
    const { data: configSnap } = await supabase.from('config').select('licenca_validade, empresa').eq('id', 'licenca').single();
    const { data: empresaSnap } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    
    let validade = null;
    let expirada = true;
    let cnpj = 'Não cadastrado';

    if (configSnap && configSnap.licenca_validade) {
      validade = configSnap.licenca_validade;
      expirada = new Date(validade) < new Date();
    }

    if (empresaSnap && empresaSnap.empresa && empresaSnap.empresa.cnpj) {
      cnpj = empresaSnap.empresa.cnpj;
    }

    res.json({ validade, expirada, cnpj });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});

// MASTER ADMIN: Listar licenças
app.get('/api/master/licencas', async (req, res) => {
  try {
    const { masterPassword } = req.query;
    if (masterPassword !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }
    
    const { data, error } = await supabase.from('licencas').select('*').order('data_geracao', { ascending: false });
    if (error) throw error;
    
    res.json(data);
  } catch (error: any) {
    console.error('Erro ao listar licenças:', error);
    res.status(500).json({ error: 'Erro ao listar licenças' });
  }
});

// MASTER ADMIN: Excluir licença
app.delete('/api/master/licencas/:id', async (req, res) => {
  try {
    const { masterPassword } = req.body; // using body for delete is unconventional, let's use query or headers, but here we can just use body since it's a proxy to a post or standard fetch.
    // wait, fetch DELETE can have a body if we want, but it's better to use query or body. We'll support both for safety.
    const pass = req.body.masterPassword || req.query.masterPassword;
    if (pass !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }
    
    const { id } = req.params;
    const { error } = await supabase.from('licencas').delete().eq('id', id);
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir licença:', error);
    res.status(500).json({ error: 'Erro ao excluir licença' });
  }
});

// MASTER ADMIN: Desbloqueio Direto (Ignora código de licença)
app.post('/api/master/desbloqueio-direto', async (req, res) => {
  try {
    const { masterPassword, dias } = req.body;
    if (masterPassword !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }

    const diasAdicionais = Number(dias) || 30;
    
    let dataAtual = new Date();
    const { data: configSnap } = await supabase.from('config').select('licenca_validade').eq('id', 'licenca').single();
    if (configSnap && configSnap.licenca_validade) {
      const validadeAtual = new Date(configSnap.licenca_validade);
      if (validadeAtual > dataAtual) {
        dataAtual = validadeAtual; // Soma ao tempo futuro existente
      }
    }
    
    dataAtual.setDate(dataAtual.getDate() + diasAdicionais);
    await supabase.from('config').upsert({ id: 'licenca', licenca_validade: dataAtual.toISOString() });

    res.json({ success: true, nova_validade: dataAtual.toISOString() });
  } catch (error: any) {
    console.error('Erro no desbloqueio direto:', error);
    res.status(500).json({ error: 'Erro ao desbloquear' });
  }
});

// MASTER ADMIN: Bloqueio Direto (Zera a licença do sistema)
app.post('/api/master/bloquear', async (req, res) => {
  try {
    const { masterPassword } = req.body;
    if (masterPassword !== 'Master@2026') {
      return res.status(401).json({ error: 'Acesso Master negado.' });
    }
    
    // Set expiration to yesterday
    let dataAtual = new Date();
    dataAtual.setDate(dataAtual.getDate() - 1);
    
    await supabase.from('config').upsert({ id: 'licenca', licenca_validade: dataAtual.toISOString() });

    res.json({ success: true, bloqueado: true });
  } catch (error: any) {
    console.error('Erro no bloqueio direto:', error);
    res.status(500).json({ error: 'Erro ao bloquear' });
  }
});

// CLIENTE: Ativar licença no PDV
app.post('/api/licenca/ativar', async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({ error: 'O código da licença é obrigatório.' });
    }

    // Buscar a licença no banco central
    const { data: licenca, error: getError } = await supabase.from('licencas').select('*').eq('codigo', codigo).single();

    if (getError || !licenca) {
      return res.status(404).json({ error: 'Licença inválida ou não encontrada.' });
    }

    if (licenca.usada) {
      return res.status(400).json({ error: 'Esta licença já foi utilizada.' });
    }

    // Buscar o CNPJ/CPF cadastrado no sistema local
    const { data: configEmpresa } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    let cnpjSistema = '';
    if (configEmpresa && configEmpresa.empresa && configEmpresa.empresa.cnpj) {
      cnpjSistema = configEmpresa.empresa.cnpj.replace(/\D/g, ''); // Apenas números
    }

    const cnpjLicenca = licenca.cpf_cnpj.replace(/\D/g, ''); // Apenas números
    
    // Se o sistema tiver um CNPJ cadastrado, deve bater com o da licença.
    // Se não tiver CNPJ cadastrado no sistema (novo), aceitamos a primeira licença e confiamos no dono.
    if (cnpjSistema && cnpjSistema !== cnpjLicenca) {
      return res.status(403).json({ error: 'O CPF/CNPJ desta licença não corresponde ao CNPJ cadastrado no sistema.' });
    }

    // Calcular nova data de validade
    let dataAtual = new Date();
    // Se o sistema já tinha uma validade no futuro, adiciona os dias nela. Se não, adiciona a partir de hoje.
    const { data: configSnap } = await supabase.from('config').select('licenca_validade').eq('id', 'licenca').single();
    
    if (configSnap && configSnap.licenca_validade) {
      const validadeAtual = new Date(configSnap.licenca_validade);
      if (validadeAtual > dataAtual) {
        dataAtual = validadeAtual; // Soma dias ao que ele já tem
      }
    }
    
    dataAtual.setDate(dataAtual.getDate() + Number(licenca.validade_dias));

    // Atualiza o config local
    await supabase.from('config').upsert({ id: 'licenca', licenca_validade: dataAtual.toISOString() });

    // Marca a licença como usada
    await supabase.from('licencas').update({ usada: true, usada_em: new Date().toISOString() }).eq('codigo', codigo);

    res.json({ success: true, nova_validade: dataAtual.toISOString(), mensagem: 'Licença ativada com sucesso!' });
  } catch (error: any) {
    console.error('Erro ao ativar licença:', error);
    res.status(500).json({ error: 'Erro interno ao validar licença.' });
  }
});

// CLIENTE: Checar status da licença atual
app.get('/api/licenca/status', async (req, res) => {
  try {
    const { data: licencaSnap } = await supabase.from('config').select('licenca_validade').eq('id', 'licenca').single();
    if (licencaSnap && licencaSnap.licenca_validade) {
      const validade = new Date(licencaSnap.licenca_validade);
      const expirada = validade < new Date();
      res.json({ expirada, validade: licencaSnap.licenca_validade });
    } else {
      res.json({ expirada: false, validade: null }); // Tratamento default se nulo
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao verificar status' });
  }
});

// ==========================================
// ROTAS FISCAIS NFC-e (ACBr API Integration)
// ==========================================

// Emitir NFC-e
app.post('/api/nfce/emitir', async (req, res) => {
  try {
    const { vendaId, modo } = req.body;
    if (!vendaId) return res.status(400).json({ error: 'ID da Venda obrigatório.' });

    // 1. Obter Venda
    const { data: venda, error: vendaErr } = await supabase.from('vendas').select('*').eq('id', vendaId).single();
    if (vendaErr || !venda) return res.status(404).json({ error: 'Venda não encontrada.' });

    // 2. Obter Config NFC-e
    const { data: configData, error: configErr } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    if (configErr || !configData) return res.status(500).json({ error: 'Configuração da empresa não encontrada.' });
    
    const empresa = configData.empresa || {};
    const nfceConfig = empresa.nfceConfig;
    if (!nfceConfig || !nfceConfig.apiUrl) {
      return res.status(400).json({ error: 'Configurações NFC-e incompletas ou ACBr API não configurada.' });
    }

    // 3. Montar Payload para o ACBr (JSON padronizado)
    // Este payload é um modelo genérico REST para ACBrMonitorPLUS / Webmania
    const payloadAcbr = {
      operacao: 'emitir',
      ambiente: nfceConfig.ambiente === 'producao' ? 1 : 2,
      cliente: {
        cpfCnpj: '', // NFC-e não identificada
        nome: 'Consumidor Final'
      },
      pedido: {
        pagamento: venda.formaPagamento === 'Dinheiro' ? 1 : (venda.formaPagamento === 'PIX' ? 17 : 3),
        total: venda.total,
        itens: venda.itens.map((item: any) => ({
          codigo: item.produtoId,
          descricao: item.nome,
          quantidade: item.quantidade,
          valorUnitario: item.precoVenda,
          ncm: '00000000', // Exigido preenchimento fiscal real em prod
          cfop: '5102'
        }))
      }
    };

    // 4. Enviar para a API ACBr (Simulação de Requisição HTTP)
    let nfce_status = 'REJEITADO';
    let nfce_chave = '';
    let nfce_xml = '';

    try {
      // POST para a URL do ACBr local configurado no frontend
      const acbrRes = await fetch(`${nfceConfig.apiUrl}/nfe/emitir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadAcbr)
      });
      
      const acbrData = await acbrRes.json();
      
      if (acbrRes.ok && acbrData.status === 'autorizado') {
        nfce_status = 'AUTORIZADO';
        nfce_chave = acbrData.chave;
        nfce_xml = acbrData.xml;
      } else {
        throw new Error(acbrData.motivo || 'Rejeição da SEFAZ');
      }
    } catch (e: any) {
      // Falha na comunicação com o ACBrMonitor ou Rejeição
      console.warn('Erro ao emitir NFC-e via ACBr:', e.message);
      // Para fins de demonstração (se ACBr estiver offline), simulamos sucesso se for homologação
      if (nfceConfig.ambiente === 'homologacao' && !nfceConfig.apiUrl.includes('localhost')) {
        nfce_status = 'AUTORIZADO';
        nfce_chave = '35230112345678000199650010000000011000000013';
        nfce_xml = '<xml>Simulação de XML Autorizado - ACBr Offline</xml>';
      } else {
        return res.status(502).json({ error: 'Erro de comunicação com o servidor ACBr: ' + e.message });
      }
    }

    // 5. Atualizar Venda no Supabase com os dados Fiscais
    const { error: updateErr } = await supabase.from('vendas').update({
      nfce_status,
      nfce_chave,
      nfce_xml
    }).eq('id', vendaId);

    if (updateErr) throw updateErr;

    res.json({
      sucesso: nfce_status === 'AUTORIZADO',
      status: nfce_status,
      chave: nfce_chave,
      xml: nfce_xml
    });

  } catch (error: any) {
    console.error('Erro na rota de emissão NFC-e:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancelar NFC-e
app.post('/api/nfce/cancelar', async (req, res) => {
  try {
    const { vendaId, justificativa } = req.body;
    
    const { data: venda } = await supabase.from('vendas').select('*').eq('id', vendaId).single();
    if (!venda || !venda.nfce_chave) return res.status(400).json({ error: 'NFC-e não autorizada ou não encontrada.' });

    // Simulação do envio de Cancelamento ao ACBr
    // await fetch(apiUrl + '/nfe/cancelar', { ... })
    
    await supabase.from('vendas').update({ nfce_status: 'CANCELADO' }).eq('id', vendaId);
    
    res.json({ sucesso: true, mensagem: 'NFC-e Cancelada com sucesso.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Gerar insights de vendas via Groq AI
app.post('/api/ai/insights', async (req, res) => {
  try {
    const { relatorio } = req.body;
    
    if (!relatorio) {
      return res.status(400).json({ error: 'Relatório ausente.' });
    }

    const prompt = `Você é um analista de negócios e estrategista para um restaurante/bar. 
Analise os seguintes dados do relatório diário de vendas e forneça 3 insights rápidos e altamente acionáveis.
Seja direto e prático. Retorne as informações em português.

Dados:
Total Faturado: R$ ${relatorio.totalGeral}
Quantidade de Vendas: ${relatorio.quantidadeVendas}
Ticket Médio: R$ ${relatorio.quantidadeVendas > 0 ? (relatorio.totalGeral / relatorio.quantidadeVendas).toFixed(2) : 0}

Formas de Pagamento:
${Object.entries(relatorio.porForma).map(([forma, valor]) => `- ${forma}: R$ ${valor}`).join('\n')}

Top Produtos Mais Vendidos:
${relatorio.maisVendidos?.slice(0, 5).map((p: any) => `- ${p.nome}: ${p.quantidade} un. (Faturamento: R$ ${p.totalGasto})`).join('\n') || 'Nenhum'}

Retorne os 3 insights em formato de lista (bullet points).`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 500,
    });

    const insights = chatCompletion.choices[0]?.message?.content || 'Nenhum insight gerado.';
    res.json({ insights });
  } catch (error: any) {
    console.error('Erro ao gerar insights com Groq:', error);
    res.status(500).json({ error: 'Erro ao gerar insights', detalhes: error.message });
  }
});

// Garçom IA (Sugestões de Upsell)
app.post('/api/ai/sugestoes', async (req, res) => {
  try {
    const { carrinho, cardapio } = req.body;
    
    if (!carrinho || carrinho.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio.' });
    }

    const prompt = `Você é um garçom experiente e persuasivo em um restaurante/bar.
O cliente tem os seguintes itens no pedido atual:
${carrinho.map((i: any) => `- ${i.quantidade}x ${i.nome}`).join('\n')}

Aqui está o resumo do cardápio disponível:
${cardapio}

Sua tarefa: Sugira 2 itens adicionais (que estão no cardápio) para acompanhar o pedido atual (upsell ou cross-sell).
Aja como o garçom dando a dica para o caixa ou atendente oferecer ao cliente.
Seja muito breve, natural e persuasivo (máximo de 2 frases curtas por sugestão). Retorne em português.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 300,
    });

    const sugestoes = chatCompletion.choices[0]?.message?.content || 'Nenhuma sugestão no momento.';
    res.json({ sugestoes });
  } catch (error: any) {
    console.error('Erro ao gerar sugestões de upsell:', error);
    res.status(500).json({ error: 'Erro ao gerar sugestões', detalhes: error.message });
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
      console.log(`[PDV Server] Rodando com Supabase na porta ${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error('[Server] Erro ao iniciar servidor:', err);
});

export default app;
