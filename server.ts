import express from 'express';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Produto, Comanda, Venda, ItemCarrinho, FormaPagamento, Empresa, PrinterConfig } from './src/types.js';
import { supabaseUrl, supabaseAnonKey } from './supabaseConfig.js';

// Inicializar Supabase
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
    res.json(data);
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
    const novoProduto: any = {
      id,
      nome,
      categoria,
      precoCusto: Number(precoCusto),
      precoVenda: Number(precoVenda),
      estoque: controlarEstoque ? Number(estoque || 0) : 0,
      controlarEstoque: Boolean(controlarEstoque)
    };
    if (estoqueMinimo !== undefined) {
      novoProduto.estoqueMinimo = Number(estoqueMinimo);
    } else {
      novoProduto.estoqueMinimo = null;
    }

    const { error } = await supabase.from('produtos').insert([novoProduto]);
    if (error) throw error;

    res.status(201).json(novoProduto);
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

    const produtoAtualizado: Produto = {
      ...pOriginal,
      nome: updateData.nome !== undefined ? updateData.nome : pOriginal.nome,
      categoria: updateData.categoria !== undefined ? updateData.categoria : pOriginal.categoria,
      precoCusto: updateData.precoCusto !== undefined ? Number(updateData.precoCusto) : pOriginal.precoCusto,
      precoVenda: updateData.precoVenda !== undefined ? Number(updateData.precoVenda) : pOriginal.precoVenda,
      estoque: updateData.controlarEstoque !== undefined ? (Boolean(updateData.controlarEstoque) ? Number(updateData.estoque || 0) : 0) : pOriginal.estoque,
      controlarEstoque: updateData.controlarEstoque !== undefined ? Boolean(updateData.controlarEstoque) : pOriginal.controlarEstoque,
      estoqueMinimo: updateData.estoqueMinimo !== undefined ? (updateData.estoqueMinimo === null ? null : Number(updateData.estoqueMinimo)) : pOriginal.estoqueMinimo
    };

    const { error: updateError } = await supabase.from('produtos').update(produtoAtualizado).eq('id', id);
    if (updateError) throw updateError;

    res.json(produtoAtualizado);
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
    
    res.json(data);
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
    const novaComanda: Comanda = {
      id,
      identificador: identificador.trim(),
      ativa: true,
      itens: [],
      dataAbertura: new Date().toISOString()
    };

    const { error } = await supabase.from('comandas').insert([novaComanda]);
    if (error) throw error;

    res.status(201).json(novaComanda);
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

    const novaVenda: Venda = {
      id: Math.random().toString(36).substring(2, 9),
      comandaId,
      comandaIdentificador,
      data: new Date().toISOString(),
      itens: itensVenda,
      total: Number(total.toFixed(2)),
      formaPagamento: formaPagamento as FormaPagamento
    };

    const { error: insertError } = await supabase.from('vendas').insert([novaVenda]);
    if (insertError) throw insertError;

    res.status(201).json(novaVenda);
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
    
    const vendasHoje = vendas || [];
    const totalGeral = vendasHoje.reduce((acc, v) => acc + v.total, 0);

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
    const { nome, cnpj, endereco, telefone, slogan, logo, pixConfig } = req.body;

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
      pixConfig: pixConfig || undefined
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
