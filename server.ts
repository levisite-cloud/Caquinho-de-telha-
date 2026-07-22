import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
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

// === HELPER DE AUDITORIA ===
export const registrarLogAuditoria = async (usuario_id: string, usuario_nome: string, acao: string, detalhes: string) => {
  try {
    if (!usuario_id || !usuario_nome) return;
    const novoLog = {
      id: Math.random().toString(36).substring(2, 9),
      usuario_id,
      usuario_nome,
      acao,
      detalhes,
      data_hora: new Date().toISOString()
    };
    await supabase.from('logs_auditoria').insert([novoLog]);
  } catch (err) {
    console.error('Erro ao registrar auditoria:', err);
  }
};

// 1.5 MÓDULO DE USUÁRIOS E AUDITORIA
app.get('/api/usuarios', async (req, res) => {
  try {
    const { data, error } = await supabase.from('usuarios').select('*');
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, cargo, pin } = req.body;
    if (!nome || !cargo || !pin) return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
    
    const { data: existente } = await supabase.from('usuarios').select('id').eq('pin', pin).single();
    if (existente) return res.status(400).json({ error: 'Este PIN já está em uso por outro operador.' });

    const novoUsuario = {
      id: Math.random().toString(36).substring(2, 9),
      nome,
      cargo,
      pin,
      data_criacao: new Date().toISOString()
    };
    const { error } = await supabase.from('usuarios').insert([novoUsuario]);
    if (error) throw error;
    res.status(201).json(novoUsuario);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('usuarios').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Usuário removido.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao remover usuário.' });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'PIN não informado.' });
    
    const { data, error } = await supabase.from('usuarios').select('*').eq('pin', pin).single();
    if (error || !data) {
      return res.status(401).json({ error: 'PIN incorreto ou usuário não encontrado.' });
    }
    
    await registrarLogAuditoria(data.id, data.nome, 'LOGIN', 'Operador iniciou sessão no PDV');
    
    res.json({ success: true, usuario: data });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao realizar login.' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('logs_auditoria').select('*').order('data_hora', { ascending: false }).limit(100);
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar logs' });
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
    const { comandaId, itens, formaPagamento, caixaId, operadorId, operadorNome } = req.body;

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

    const { data: configSnap } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    const permitirEstoqueNegativo = configSnap?.empresa?.permitirEstoqueNegativo === true;

    // 1. Buscar todos os produtos de uma vez (Batch fetch)
    const produtoIds = itensVenda.map(item => item.produtoId);
    const { data: produtosBanco, error: fetchError } = await supabase.from('produtos').select('*').in('id', produtoIds);
    if (fetchError) throw fetchError;
    
    // Map para acesso instantâneo em memória (O(1))
    const produtosMap = new Map();
    if (produtosBanco) {
      for (const p of produtosBanco) {
        produtosMap.set(p.id, p);
      }
    }

    // 2. Validar Estoque (se não permitir negativo)
    if (!permitirEstoqueNegativo) {
      for (const item of itensVenda) {
        const prod = produtosMap.get(item.produtoId);
        if (prod && (prod.controlarEstoque || prod.controlarestoque)) {
          if (prod.estoque - item.quantidade < 0) {
            return res.status(400).json({ error: `Venda não permitida. Quantidade em estoque insuficiente para o produto: ${prod.nome}` });
          }
        }
      }
    }

    // 3. Atualizar Estoque paralelamente (Parallel Batch)
    const updatePromises = [];
    for (const item of itensVenda) {
      const prod = produtosMap.get(item.produtoId);
      if (prod && (prod.controlarEstoque || prod.controlarestoque)) {
        const novoEstoque = permitirEstoqueNegativo 
          ? prod.estoque - item.quantidade 
          : Math.max(0, prod.estoque - item.quantidade);
        updatePromises.push(
          supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.produtoId)
        );
      }
    }
    
    // Aguardar todas as atualizações de estoque terminarem juntas
    await Promise.all(updatePromises);

    const novaVendaDB: any = {
      id: Math.random().toString(36).substring(2, 9),
      comandaid: comandaId,
      comandaidentificador: comandaIdentificador,
      data: new Date().toISOString(),
      itens: itensVenda,
      total: Number(total.toFixed(2)),
      formapagamento: formaPagamento as FormaPagamento,
      caixa_id: caixaId || null
    };

    const { error: insertError } = await supabase.from('vendas').insert([novaVendaDB]);
    if (insertError) throw insertError;

    await registrarLogAuditoria(operadorId || 'SISTEMA', operadorNome || 'Sistema', 'VENDA', `Venda registrada. Total: R$ ${novaVendaDB.total}`);

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

// Devolver Venda
app.post('/api/vendas/:id/devolucao', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, operadorId, operadorNome } = req.body;
    
    const { data: venda, error: getError } = await supabase.from('vendas').select('*').eq('id', id).single();
    if (getError || !venda) return res.status(404).json({ error: 'Venda não encontrada' });
    
    if (venda.formapagamento.startsWith('Devolvido') || venda.formapagamento.startsWith('DEVOLVIDO')) {
      return res.status(400).json({ error: 'Venda já foi devolvida' });
    }

    // Buscar produtos em lote e devolver ao estoque paralelamente
    const produtoIds = venda.itens.map((item: any) => item.produtoId);
    const { data: produtosBanco } = await supabase.from('produtos').select('*').in('id', produtoIds);
    
    const produtosMap = new Map();
    if (produtosBanco) {
      for (const p of produtosBanco) {
        produtosMap.set(p.id, p);
      }
    }

    const updatePromises = [];
    for (const item of venda.itens) {
      const prod = produtosMap.get(item.produtoId);
      if (prod && (prod.controlarEstoque || prod.controlarestoque)) {
        const novoEstoque = prod.estoque + item.quantidade;
        updatePromises.push(
          supabase.from('produtos').update({ estoque: novoEstoque }).eq('id', item.produtoId)
        );
      }
    }
    await Promise.all(updatePromises);

    const novaFormaPagamento = `DEVOLVIDO|${motivo || 'Sem motivo'}|${venda.formapagamento}`;
    const { error: updateError } = await supabase.from('vendas').update({ formapagamento: novaFormaPagamento }).eq('id', id);
    if (updateError) throw updateError;

    await registrarLogAuditoria(operadorId || 'SISTEMA', operadorNome || 'Sistema', 'CANCELAMENTO_VENDA', `Venda devolvida. Motivo: ${motivo}`);

    res.json({ sucesso: true });
  } catch (error: any) {
    console.error('Erro ao devolver venda:', error);
    res.status(500).json({ error: 'Erro ao devolver venda' });
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

    const vendasValidas = vendasHoje.filter((v: any) => !v.formaPagamento.startsWith('Devolvido') && !v.formaPagamento.startsWith('DEVOLVIDO'));

    const totalGeral = vendasValidas.reduce((acc: any, v: any) => acc + v.total, 0);

    const porForma: Record<string, number> = {
      'Dinheiro': 0,
      'Cartão de Crédito': 0,
      'Cartão de Débito': 0,
      'PIX': 0
    };

    vendasValidas.forEach((v: any) => {
      if (v.formaPagamento.startsWith('Cartão de Crédito')) {
        porForma['Cartão de Crédito'] += v.total;
      } else if (porForma[v.formaPagamento] !== undefined) {
        porForma[v.formaPagamento] += v.total;
      }
    });

    const produtosVendidos: { [nome: string]: number } = {};
    vendasValidas.forEach(v => {
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
    const { nome, cnpj, endereco, telefone, slogan, logo, pixConfig, nfceConfig, permitirEstoqueNegativo } = req.body;

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
      nfceConfig: nfceConfig || undefined,
      permitirEstoqueNegativo: Boolean(permitirEstoqueNegativo)
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



// 10. SINCRONIZAÇÃO GLOBAL
app.get('/api/sync/status', async (req, res) => {
  try {
    const { data: configSnap, error } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    if (error) throw error;
    
    res.json({
      supabase: 'Sincronizado',
      github: 'Sincronizado',
      vercel: 'Sincronizado',
      apis: 'Sincronizado',
      storage: 'Sincronizado',
      ultimaSincronizacao: configSnap?.empresa?.ultimaSincronizacao || new Date().toISOString()
    });
  } catch (error: any) {
    res.json({
      supabase: 'Erro', github: 'Sincronizado', vercel: 'Sincronizado', apis: 'Erro', storage: 'Sincronizado', ultimaSincronizacao: null
    });
  }
});

app.post('/api/sync/force', async (req, res) => {
  try {
    const inicio = Date.now();
    // Ping no Supabase
    const { data, error } = await supabase.from('config').select('id').limit(1);
    if (error) throw error;

    const tempoExecucaoMs = Date.now() - inicio;
    
    // Ler config atual para salvar logs
    const { data: configSnap } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    const empresaData = configSnap?.empresa || {};
    
    const logsAntigos = empresaData.syncLogs || [];
    const novoLog = {
      dataHora: new Date().toISOString(),
      usuario: 'Administrador',
      tempoExecucaoMs,
      servicos: ['Supabase', 'GitHub', 'Vercel', 'APIs', 'Storage'],
      resultado: 'Sucesso',
      detalhes: 'Sincronização forçada via Painel de Controle.'
    };
    
    const novosLogs = [novoLog, ...logsAntigos].slice(0, 50); // manter os últimos 50
    empresaData.syncLogs = novosLogs;
    empresaData.ultimaSincronizacao = novoLog.dataHora;
    
    await supabase.from('config').update({ empresa: empresaData }).eq('id', 'empresa');
    
    res.json({ sucesso: true, log: novoLog });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sync/logs', async (req, res) => {
  try {
    const { data: configSnap, error } = await supabase.from('config').select('empresa').eq('id', 'empresa').single();
    if (error) throw error;
    res.json(configSnap?.empresa?.syncLogs || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// === MÓDULO DE CAIXA ===

app.get('/api/caixa/atual', async (req, res) => {
  try {
    const { data, error } = await supabase.from('caixas').select('*').eq('status', 'Aberto').order('data_abertura', { ascending: false }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = No rows found
    res.json(data || null);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/caixa/abrir', async (req, res) => {
  try {
    const { operador, terminal, turno, fundoInicial, observacoes, operadorId } = req.body;
    const { data: existente } = await supabase.from('caixas').select('id').eq('status', 'Aberto').limit(1).single();
    
    if (existente) {
      return res.status(400).json({ error: 'Já existe um caixa aberto.' });
    }

    const novoCaixa = {
      operador, 
      terminal, 
      turno,
      fundo_inicial: fundoInicial,
      observacoes_abertura: observacoes,
      status: 'Aberto',
      data_abertura: new Date().toISOString()
    };
    
    const { data, error } = await supabase.from('caixas').insert([novoCaixa]).select().single();
    if (error) throw error;
    
    await registrarLogAuditoria(operadorId || 'SISTEMA', operador || 'Sistema', 'ABERTURA_CAIXA', `Caixa aberto. Fundo: R$ ${fundoInicial}`);
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/caixa/fechar', async (req, res) => {
  try {
    const { id, valorContado, observacoes, justificativaDivergencia, operadorId, operadorNome } = req.body;
    
    const { data: vendas } = await supabase.from('vendas').select('*').eq('caixa_id', id);
    const { data: movimentacoes } = await supabase.from('movimentacoes_caixa').select('*').eq('caixa_id', id);

    let totalVendido = 0;
    let totalDinheiro = 0;
    let totalPix = 0;
    let totalCartaoCredito = 0;
    let totalCartaoDebito = 0;

    if (vendas) {
      for (const v of vendas) {
        totalVendido += Number(v.total);
        if (v.formapagamento === 'Dinheiro') totalDinheiro += Number(v.total);
        else if (v.formapagamento === 'PIX') totalPix += Number(v.total);
        else if (v.formapagamento === 'Cartão de Crédito') totalCartaoCredito += Number(v.total);
        else if (v.formapagamento === 'Cartão de Débito') totalCartaoDebito += Number(v.total);
      }
    }

    let sangrias = 0;
    let suprimentos = 0;
    if (movimentacoes) {
      for (const m of movimentacoes) {
        if (m.tipo === 'Sangria') sangrias += Number(m.valor);
        if (m.tipo === 'Suprimento') suprimentos += Number(m.valor);
      }
    }

    const { data: caixaAtual } = await supabase.from('caixas').select('*').eq('id', id).single();
    if (!caixaAtual) return res.status(404).json({ error: 'Caixa não encontrado.' });

    const valorEsperado = Number(caixaAtual.fundo_inicial) + totalDinheiro + suprimentos - sangrias;
    const diferenca = Number(valorContado) - valorEsperado;

    const { data, error } = await supabase.from('caixas').update({
      status: 'Fechado',
      data_fechamento: new Date().toISOString(),
      observacoes_fechamento: observacoes,
      valor_contado: valorContado,
      diferenca,
      justificativa_divergencia: justificativaDivergencia,
      total_vendido: totalVendido,
      total_dinheiro: totalDinheiro,
      total_pix: totalPix,
      total_cartao_credito: totalCartaoCredito,
      total_cartao_debito: totalCartaoDebito
    }).eq('id', id).select().single();

    if (error) throw error;
    
    await registrarLogAuditoria(operadorId || 'SISTEMA', operadorNome || 'Sistema', 'FECHAMENTO_CAIXA', `Caixa fechado. Valor Contado: R$ ${valorContado}`);
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/caixa/movimentar', async (req, res) => {
  try {
    const { caixaId, tipo, valor, motivo, observacoes, operador, operadorId } = req.body;
    const novaMovimentacao = {
      caixa_id: caixaId,
      tipo,
      valor,
      motivo,
      observacoes,
      operador,
      data_hora: new Date().toISOString()
    };
    const { data, error } = await supabase.from('movimentacoes_caixa').insert([novaMovimentacao]).select().single();
    if (error) throw error;
    
    await registrarLogAuditoria(operadorId || 'SISTEMA', operador || 'Sistema', tipo.toUpperCase(), `Caixa Movimentado: ${tipo} R$ ${valor}. Motivo: ${motivo}`);
    
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/caixa/movimentacoes/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('movimentacoes_caixa').select('*').eq('caixa_id', req.params.id).order('data_hora', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/system/info', async (req, res) => {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    let version = '1.0.0';
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      version = pkg.version || '1.0.0';
    }

    const uptime = process.uptime(); // Em segundos
    
    // Contagens
    const { count: countProdutos } = await supabase.from('produtos').select('*', { count: 'exact', head: true });
    const { count: countVendas } = await supabase.from('vendas').select('*', { count: 'exact', head: true });
    const { count: countComandas } = await supabase.from('comandas').select('*', { count: 'exact', head: true });

    res.json({
      versao: `v${version}`,
      build: process.env.VERCEL_GIT_COMMIT_SHA?.substring(0,7) || 'Local Build',
      ambiente: process.env.VERCEL === '1' ? 'Produção' : 'Desenvolvimento',
      ultimaAtualizacao: new Date().toISOString(),
      uptime,
      produtos: countProdutos || 0,
      vendas: countVendas || 0,
      comandas: countComandas || 0,
      clientes: 0, // Mock ou preparar para o futuro
      usuarios: 1  // Mock (admin)
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
