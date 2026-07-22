import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Plus,
  Minus,
  Trash2,
  PlusCircle,
  DollarSign,
  CreditCard,
  QrCode,
  Receipt,
  Package,
  Layers,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FileText,
  CheckCircle,
  X,
  User,
  Coffee,
  Edit,
  ChevronRight,
  Search,
  Check,
  AlertCircle,
  Printer,
  Store,
  Upload,
  Cloud,
  LogOut,
  KeyRound,
  Sparkles,
  Undo2,
  Activity,
  Database,
  Github,
  Globe,
  Server,
  Folder,
  ClipboardList,
  Info,
  Wallet,
  Lock,
  Unlock,
  Download,
  Settings,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Users,
  Menu
} from 'lucide-react';
import { MasterAdmin } from './pages/MasterAdmin';
import { AtivacaoLicenca } from './components/AtivacaoLicenca';
import { Produto, Comanda, Venda, ItemCarrinho, FormaPagamento, Empresa, PrinterConfig, PixConfig } from './types';
import { generatePixCopiaECola } from './utils/pixGenerator';

export default function App() {
  // Autenticação
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pdv_auth') === 'true';
  });
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Licenciamento
  const [isCheckingLicense, setIsCheckingLicense] = useState(true);
  const [isLicenseExpired, setIsLicenseExpired] = useState(false);
  const [licencaValidade, setLicencaValidade] = useState<string | null>(null);
  const [showRenovarModal, setShowRenovarModal] = useState(false);

  useEffect(() => {
    const checkLicense = async () => {
      try {
        const res = await fetch('/api/licenca/status');
        const data = await res.json();
        if (data.expirada) {
          setIsLicenseExpired(true);
          setLicencaValidade(data.validade);
          setIsAuthenticated(false);
          localStorage.removeItem('pdv_auth');
        }
      } catch (err) {
        console.error('Erro ao verificar licença:', err);
      } finally {
        setIsCheckingLicense(false);
      }
    };
    checkLicense();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('pdv_auth', 'true');
      } else {
        if (data.error === 'LICENCA_EXPIRADA') {
          setIsLicenseExpired(true);
        } else {
          setLoginError(data.error || 'Senha incorreta');
        }
      }
    } catch (err: any) {
      setLoginError('Erro de conexão: ' + (err.message || String(err)));
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Controle de Abas
  const [activeTab, setActiveTab] = useState<'pdv' | 'comandas' | 'produtos' | 'relatorios' | 'empresa' | 'impressoras' | 'sincronizacao' | 'nfce' | 'info' | 'caixa'>('pdv');
  const [openMenus, setOpenMenus] = useState<string[]>(['caixa', 'configuracoes']);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMenu = (menuName: string) => {
    setOpenMenus(prev => 
      prev.includes(menuName) ? prev.filter(m => m !== menuName) : [...prev, menuName]
    );
  };

  // Estados dos Dados
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [relatorio, setRelatorio] = useState<any>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estados de Sincronização Global
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [syncLogs, setSyncLogs] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showSyncLogsModal, setShowSyncLogsModal] = useState<boolean>(false);
  
  // Estado de Informações do Sistema
  const [systemInfo, setSystemInfo] = useState<any>(null);

  // Estado de Caixa
  const [caixaAtivo, setCaixaAtivo] = useState<any>(null);
  
  // Estados de Formulário Caixa
  const [caixaOperadorForm, setCaixaOperadorForm] = useState('');
  const [caixaTerminalForm, setCaixaTerminalForm] = useState('Terminal 1');
  const [caixaTurnoForm, setCaixaTurnoForm] = useState('Manhã');
  const [caixaFundoForm, setCaixaFundoForm] = useState(0);
  
  const [showSangriaModal, setShowSangriaModal] = useState(false);
  const [showSuprimentoModal, setShowSuprimentoModal] = useState(false);
  const [showFecharCaixaModal, setShowFecharCaixaModal] = useState(false);
  
  const [caixaMovValorForm, setCaixaMovValorForm] = useState(0);
  const [caixaMovMotivoForm, setCaixaMovMotivoForm] = useState('');
  const [caixaValorContadoForm, setCaixaValorContadoForm] = useState(0);
  const [caixaJustificativaForm, setCaixaJustificativaForm] = useState('');
  
  const [caixaMovimentacoes, setCaixaMovimentacoes] = useState<any[]>([]);

  const fetchCaixa = async () => {
    try {
      const res = await fetch('/api/caixa/atual');
      if (res.ok) {
        const data = await res.json();
        setCaixaAtivo(data);
      } else {
        setCaixaAtivo(null);
      }
    } catch (err) {
      setCaixaAtivo(null);
    }
  };

  useEffect(() => {
    fetchCaixa();
  }, []);

  const carregarMovimentacoes = async () => {
    if (!caixaAtivo) return;
    try {
      const res = await fetch(`/api/caixa/movimentacoes/${caixaAtivo.id}`);
      if (res.ok) {
        const data = await res.json();
        setCaixaMovimentacoes(data);
      }
    } catch (err) {}
  };

  useEffect(() => {
    if (activeTab === 'caixa' && caixaAtivo) {
      carregarMovimentacoes();
    }
  }, [activeTab, caixaAtivo]);

  const abrirCaixa = async () => {
    if (!caixaOperadorForm) {
      mostrarFeedback('Preencha o nome do operador.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/caixa/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operador: caixaOperadorForm,
          terminal: caixaTerminalForm,
          turno: caixaTurnoForm,
          fundoInicial: caixaFundoForm
        })
      });
      if (res.ok) {
        const novoCaixa = await res.json();
        setCaixaAtivo(novoCaixa);
        mostrarFeedback('Caixa aberto com sucesso!', 'success');
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao abrir caixa.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão.', 'error');
    }
  };

  const registrarMovimentacao = async (tipo: 'Sangria' | 'Suprimento') => {
    if (caixaMovValorForm <= 0 || !caixaMovMotivoForm) {
      mostrarFeedback('Preencha o valor e o motivo.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/caixa/movimentar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caixaId: caixaAtivo.id,
          tipo,
          valor: caixaMovValorForm,
          motivo: caixaMovMotivoForm,
          operador: caixaAtivo.operador
        })
      });
      if (res.ok) {
        mostrarFeedback(`${tipo} registrada com sucesso!`, 'success');
        setShowSangriaModal(false);
        setShowSuprimentoModal(false);
        setCaixaMovValorForm(0);
        setCaixaMovMotivoForm('');
        carregarMovimentacoes();
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao registrar.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão.', 'error');
    }
  };

  const fecharCaixa = async () => {
    if (caixaValorContadoForm < 0) {
      mostrarFeedback('Valor contado inválido.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: caixaAtivo.id,
          valorContado: caixaValorContadoForm,
          justificativaDivergencia: caixaJustificativaForm
        })
      });
      if (res.ok) {
        setCaixaAtivo(null);
        setShowFecharCaixaModal(false);
        setCaixaValorContadoForm(0);
        setCaixaJustificativaForm('');
        mostrarFeedback('Caixa fechado com sucesso!', 'success');
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao fechar caixa.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão.', 'error');
    }
  };

  // Polling de Sincronização (a cada 60s)
  useEffect(() => {
    const fetchSyncStatus = async () => {
      try {
        const res = await fetch('/api/sync/status');
        if (res.ok) {
          const data = await res.json();
          setSyncStatus(data);
          
          if (data.supabase === 'Erro' || data.apis === 'Erro') {
            mostrarFeedback('Atenção: Falha na Sincronização detectada!', 'error');
          }
        }
      } catch (err) {
        console.error('Erro ao checar status de sincronização', err);
      }
    };
    
    // Buscar imediatamente se logado
    if (isAuthenticated) {
      fetchSyncStatus();
      const intervalId = setInterval(fetchSyncStatus, 60000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);

  const handleForceSync = async () => {
    setIsSyncing(true);
    setSyncStatus({
      supabase: 'Sincronizando',
      github: 'Sincronizando',
      vercel: 'Sincronizando',
      apis: 'Sincronizando',
      storage: 'Sincronizando',
      ultimaSincronizacao: syncStatus?.ultimaSincronizacao || new Date().toISOString()
    });
    
    try {
      const res = await fetch('/api/sync/force', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSyncStatus({
          supabase: 'Sincronizado',
          github: 'Sincronizado',
          vercel: 'Sincronizado',
          apis: 'Sincronizado',
          storage: 'Sincronizado',
          ultimaSincronizacao: data.log.dataHora
        });
        setSyncLogs(prev => [data.log, ...prev].slice(0, 50));
        mostrarFeedback('Sincronização concluída com sucesso.', 'success');
      } else {
        const erro = await res.json();
        throw new Error(erro.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      setSyncStatus({
        supabase: 'Erro',
        github: 'Sincronizado',
        vercel: 'Sincronizado',
        apis: 'Erro',
        storage: 'Sincronizado',
        ultimaSincronizacao: syncStatus?.ultimaSincronizacao
      });
      mostrarFeedback(`Falha na sincronização: ${err.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleVerLogs = async () => {
    try {
      const res = await fetch('/api/sync/logs');
      if (res.ok) {
        const data = await res.json();
        setSyncLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    }
    setShowSyncLogsModal(true);
  };

  // Estados do PDV (Carrinho & Comandas)
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');
  const [buscaProduto, setBuscaProduto] = useState<string>('');
  const [comandaSelecionadaId, setComandaSelecionadaId] = useState<string>('');
  const [modoVenda, setModoVenda] = useState<'direta' | 'comanda'>('direta');

  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [parcelasCredito, setParcelasCredito] = useState(1);

  // Modais e Formulários
  const [showNovaComandaModal, setShowNovaComandaModal] = useState<boolean>(false);
  const [novaComandaIdentificador, setNovaComandaIdentificador] = useState<string>('');
  
  const [showProdutoModal, setShowProdutoModal] = useState<boolean>(false);
  const [produtoEmEdicao, setProdutoEmEdicao] = useState<Produto | null>(null);
  const [prodFormNome, setProdFormNome] = useState<string>('');
  const [prodFormCategoria, setProdFormCategoria] = useState<string>('Bebidas');
  const [prodFormPrecoCusto, setProdFormPrecoCusto] = useState<number>(0);
  const [prodFormPrecoVenda, setProdFormPrecoVenda] = useState<number>(0);
  const [prodFormEstoque, setProdFormEstoque] = useState<number>(0);
  const [prodFormControlarEstoque, setProdFormControlarEstoque] = useState<boolean>(true);
  const [prodFormEstoqueMinimo, setProdFormEstoqueMinimo] = useState<number>(5);

  // Estados de Cadastro de Empresa
  const [empresa, setEmpresa] = useState<Empresa>({
    nome: 'Sabor Gourmet',
    cnpj: '12.345.678/0001-99',
    endereco: 'Av. Paulista, 1000 - São Paulo, SP',
    telefone: '(11) 98765-4321',
    slogan: 'O melhor sabor da culinária brasileira',
    logo: ''
  });
  const [filtroEstoqueNegativo, setFiltroEstoqueNegativo] = useState<boolean>(false);
  const [empresaFormNome, setEmpresaFormNome] = useState<string>('');
  const [empresaFormCnpj, setEmpresaFormCnpj] = useState<string>('');
  const [empresaFormEndereco, setEmpresaFormEndereco] = useState<string>('');
  const [empresaFormTelefone, setEmpresaFormTelefone] = useState<string>('');
  const [empresaFormSlogan, setEmpresaFormSlogan] = useState<string>('');
  const [empresaFormLogo, setEmpresaFormLogo] = useState<string>('');
  const [empresaFormPixChave, setEmpresaFormPixChave] = useState<string>('');
  const [empresaFormPixTipo, setEmpresaFormPixTipo] = useState<'CPF' | 'CNPJ' | 'Email' | 'Telefone' | 'Aleatoria'>('CPF');
  const [empresaFormPixNome, setEmpresaFormPixNome] = useState<string>('');
  const [empresaFormPixCidade, setEmpresaFormPixCidade] = useState<string>('');
  const [gerarPixQR, setGerarPixQR] = useState<boolean>(false);
  const [showPixModal, setShowPixModal] = useState<boolean>(false);
  const [pixEmptyCartAlert, setPixEmptyCartAlert] = useState<boolean>(false);
  const [empresaFormPermitirEstoqueNegativo, setEmpresaFormPermitirEstoqueNegativo] = useState<boolean>(false);

  // Estados de Configuração NFC-e
  const [empresaFormNfceAmbiente, setEmpresaFormNfceAmbiente] = useState<'homologacao' | 'producao'>('homologacao');
  const [empresaFormNfceUf, setEmpresaFormNfceUf] = useState<string>('');
  const [empresaFormNfceCnpj, setEmpresaFormNfceCnpj] = useState<string>('');
  const [empresaFormNfceIe, setEmpresaFormNfceIe] = useState<string>('');
  const [empresaFormNfceCsc, setEmpresaFormNfceCsc] = useState<string>('');
  const [empresaFormNfceIdCsc, setEmpresaFormNfceIdCsc] = useState<string>('');
  const [empresaFormNfceApiUrl, setEmpresaFormNfceApiUrl] = useState<string>('');
  const [empresaFormNfceCertificadoBase64, setEmpresaFormNfceCertificadoBase64] = useState<string>('');
  const [empresaFormNfceCertificadoSenha, setEmpresaFormNfceCertificadoSenha] = useState<string>('');

  // Estados de Configuração de Impressão
  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>({
    cozinhaIp: '192.168.1.100',
    cozinhaPorta: 9100,
    caixaIp: '192.168.1.200',
    caixaPorta: 9100,
    usarApiRemota: false,
    apiUrl: 'http://localhost:8080/imprimir',
    apiToken: '',
    tipoImpressora: 'escpos'
  });
  const [printerFormCozinhaIp, setPrinterFormCozinhaIp] = useState<string>('');
  const [printerFormCozinhaPorta, setPrinterFormCozinhaPorta] = useState<number>(9100);
  const [printerFormCaixaIp, setPrinterFormCaixaIp] = useState<string>('');
  const [printerFormCaixaPorta, setPrinterFormCaixaPorta] = useState<number>(9100);
  const [printerFormUsarApiRemota, setPrinterFormUsarApiRemota] = useState<boolean>(false);
  const [printerFormApiUrl, setPrinterFormApiUrl] = useState<string>('');
  const [printerFormApiToken, setPrinterFormApiToken] = useState<string>('');
  const [printerFormTipoImpressora, setPrinterFormTipoImpressora] = useState<'escpos' | 'raw' | 'json'>('escpos');

  // Modal de Venda Concluída (Cupom Fiscal)
  const [showCupomModal, setShowCupomModal] = useState<boolean>(false);
  const [showDevolucaoModal, setShowDevolucaoModal] = useState<boolean>(false);
  const [vendaDevolucaoId, setVendaDevolucaoId] = useState<string>('');
  const [motivoDevolucao, setMotivoDevolucao] = useState<string>('');
  const [vendaRecente, setVendaRecente] = useState<Venda | null>(null);

  // Estados para Simulação de Impressão (Cozinha e Cliente)
  const [showImpressaoModal, setShowImpressaoModal] = useState<boolean>(false);
  const [dadosImpressao, setDadosImpressao] = useState<{
    tipo: 'cozinha' | 'cupom';
    identificador: string;
    itens: { nome: string; quantidade: number; precoVenda?: number }[];
    data: string;
    idReferencia?: string;
  } | null>(null);
  const [destinoImpressao, setDestinoImpressao] = useState<'cozinha' | 'copa' | 'ambas'>('cozinha');
  const [incluirObservacao, setIncluirObservacao] = useState<boolean>(false);
  const [observacaoTexto, setObservacaoTexto] = useState<string>('');
  const [gerarArquivoTxt, setGerarArquivoTxt] = useState<boolean>(true);
  const [isSimulandoImpressao, setIsSimulandoImpressao] = useState<boolean>(false);

  const handleAbrirSimuladorImpressao = (
    tipo: 'cozinha' | 'cupom' | 'conferencia',
    identificador: string,
    itens: { nome: string; quantidade: number; precoVenda?: number }[],
    data: string,
    idReferencia?: string
  ) => {
    setDadosImpressao({
      tipo,
      identificador,
      itens,
      data,
      idReferencia
    });
    setDestinoImpressao(tipo === 'cozinha' ? 'cozinha' : 'ambas');
    setIncluirObservacao(false);
    setObservacaoTexto('');
    setGerarArquivoTxt(true);
    setShowImpressaoModal(true);
  };

  const executarImpressaoSimulada = async () => {
    if (!dadosImpressao) return;
    
    setIsSimulandoImpressao(true);
    
    let cabecalho = 'CUPOM DE VENDA';
    if (dadosImpressao.tipo === 'cozinha') {
      cabecalho = 'PEDIDO DE COZINHA';
    } else if (dadosImpressao.tipo === 'conferencia') {
      cabecalho = 'COMANDA PARA CONFERENCIA - SEM VALOR FISCAL';
    }

    const nomeEmpresa = (empresa.nome || 'Sabor Gourmet').toUpperCase();
    let txt = `======================================\n`;
    txt += ` ${nomeEmpresa.padStart(Math.max(0, Math.floor((36 - nomeEmpresa.length) / 2)) + nomeEmpresa.length).padEnd(36, ' ')} \n`;
    txt += `======================================\n`;
    txt += `MODO: ${cabecalho}\n`;
    txt += `DESTINO: ${destinoImpressao.toUpperCase()}\n`;
    txt += `DATA: ${new Date(dadosImpressao.data).toLocaleString('pt-BR')}\n`;
    txt += `IDENTIFICADOR: ${dadosImpressao.identificador}\n`;
    if (dadosImpressao.idReferencia) {
      txt += `REFERENCIA ID: ${dadosImpressao.idReferencia}\n`;
    }
    txt += `--------------------------------------\n`;
    txt += `QTD    DESCRIÇÃO DO ITEM\n`;
    txt += `--------------------------------------\n`;
    
    let totalConferencia = 0;
    dadosImpressao.itens.forEach(item => {
      const qtdStr = `${item.quantidade}x`.padEnd(6, ' ');
      if (dadosImpressao.tipo === 'conferencia' && item.precoVenda !== undefined) {
        const sub = item.quantidade * item.precoVenda;
        totalConferencia += sub;
        txt += `${qtdStr} ${item.nome.padEnd(20, ' ').substring(0, 20)} R$ ${sub.toFixed(2)}\n`;
      } else {
        txt += `${qtdStr} ${item.nome}\n`;
      }
    });

    if (dadosImpressao.tipo === 'conferencia') {
      txt += `--------------------------------------\n`;
      txt += `TOTAL A PAGAR: R$ ${totalConferencia.toFixed(2)}\n`;
    }
    
    if (incluirObservacao && observacaoTexto.trim()) {
      txt += `--------------------------------------\n`;
      txt += `OBSERVAÇÃO: ${observacaoTexto.trim()}\n`;
    }
    
    if (empresa.slogan) {
      txt += `--------------------------------------\n`;
      txt += `"${empresa.slogan}"\n`;
    }

    if (printerConfig.usarApiRemota) {
      txt += `--------------------------------------\n`;
      txt += `API REMOTA: ${printerConfig.apiUrl}\n`;
    } else {
      txt += `--------------------------------------\n`;
      txt += `IP IMPRESSORA: ${dadosImpressao.tipo === 'cozinha' ? printerConfig.cozinhaIp : printerConfig.caixaIp}:${dadosImpressao.tipo === 'cozinha' ? printerConfig.cozinhaPorta : printerConfig.caixaPorta}\n`;
    }
    txt += `======================================\n`;
    txt += `         CUPOM DE IMPRESSÃO           \n`;
    txt += `======================================\n`;

    // 1. Gerar impressão via iframe invisível para evitar bloqueador de pop-ups (Funciona melhor em todos os dispositivos e não bloqueia)
    try {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.write(`
          <html>
            <head>
              <title>Impressão PDV</title>
              <style>
                @page { margin: 0; }
                body { margin: 15px; font-family: monospace; font-size: 14px; white-space: pre-wrap; width: 300px; color: #000; background: #fff; }
              </style>
            </head>
            <body>${txt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
          </html>
        `);
        iframeDoc.close();
        
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000); // Dá tempo para a janela de impressão do SO abrir
        }, 250);
      }
    } catch (err) {
      console.error('Erro ao tentar gerar impressão nativa:', err);
    }

    // 2. Continua o fluxo simulado de enviar para o servidor
    try {
      const response = await fetch('/api/imprimir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: dadosImpressao.tipo,
          identificador: dadosImpressao.identificador,
          itens: dadosImpressao.itens,
          observacao: incluirObservacao ? observacaoTexto.trim() : '',
          data: dadosImpressao.data,
          textoFormatado: txt
        })
      });

      const result = await response.json();
      setIsSimulandoImpressao(false);

      if (response.ok && result.success) {
        // Se selecionou para baixar o arquivo .txt (opcional)
        if (gerarArquivoTxt) {
          const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `impressao_${dadosImpressao.tipo}_${dadosImpressao.identificador.replace(/[\s/]/g, '_')}.txt`;
          link.click();
          URL.revokeObjectURL(url);
        }

        // Feedback
        if (result.metodo === 'api_remota') {
          mostrarFeedback(`Impresso via API remota com sucesso!`);
        } else {
          mostrarFeedback(`Enviado para impressora térmica (${result.detalhes.ip}:${result.detalhes.porta}) com sucesso!`);
        }
        
        setShowImpressaoModal(false);
      } else {
        mostrarFeedback(result.error || 'Erro ao enviar comando de impressão para o servidor.', 'error');
      }
    } catch (err: any) {
      setIsSimulandoImpressao(false);
      mostrarFeedback('Erro de conexão ao enviar impressão.', 'error');
    }
  };

  // --- BUSCA DE DADOS ---

  const carregarProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        setProdutos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const carregarComandas = async () => {
    try {
      const res = await fetch('/api/comandas?ativas=true');
      if (res.ok) {
        const data = await res.json();
        setComandas(data);
      }
    } catch (err) {
      console.error('Erro ao buscar comandas:', err);
    }
  };

  const carregarRelatorio = async () => {
    try {
      const res = await fetch('/api/vendas/relatorio');
      if (res.ok) {
        const data = await res.json();
        setRelatorio(data);
      }
    } catch (err) {
      console.error('Erro ao buscar relatório:', err);
    }
  };



  const carregarEmpresa = async () => {
    try {
      const res = await fetch('/api/empresa');
      if (res.ok) {
        const data = await res.json();
        setEmpresa(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados da empresa:', err);
    }
  };

  const handleCertificadoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
        mostrarFeedback('O certificado deve ser um arquivo .pfx ou .p12', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          // Extrair apenas o base64 descartando "data:application/x-pkcs12;base64,"
          const base64 = reader.result.split(',')[1] || reader.result;
          setEmpresaFormNfceCertificadoBase64(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const salvarEmpresaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaFormNome.trim()) {
      mostrarFeedback('O nome da empresa é obrigatório.', 'error');
      return;
    }

    const payload = {
      nome: empresaFormNome.trim(),
      cnpj: empresaFormCnpj.trim(),
      endereco: empresaFormEndereco.trim(),
      telefone: empresaFormTelefone.trim(),
      slogan: empresaFormSlogan.trim(),
      logo: empresaFormLogo,
      permitirEstoqueNegativo: empresaFormPermitirEstoqueNegativo,
      pixConfig: empresaFormPixChave.trim() ? {
        chave: empresaFormPixChave.trim(),
        tipoChave: empresaFormPixTipo,
        nomeRecebedor: empresaFormPixNome.trim(),
        cidadeRecebedor: empresaFormPixCidade.trim()
      } : undefined,
      nfceConfig: empresaFormNfceCnpj.trim() ? {
        ambiente: empresaFormNfceAmbiente,
        uf: empresaFormNfceUf.trim(),
        cnpj: empresaFormNfceCnpj.trim(),
        inscricaoEstadual: empresaFormNfceIe.trim(),
        csc: empresaFormNfceCsc.trim(),
        idCsc: empresaFormNfceIdCsc.trim(),
        apiUrl: empresaFormNfceApiUrl.trim(),
        certificadoBase64: empresaFormNfceCertificadoBase64,
        certificadoSenha: empresaFormNfceCertificadoSenha
      } : undefined
    };

    try {
      const res = await fetch('/api/empresa', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setEmpresa(data);
        mostrarFeedback('Dados da empresa atualizados com sucesso!');
      } else {
        mostrarFeedback('Erro ao salvar dados da empresa.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao salvar dados da empresa.', 'error');
    }
  };

  const abrirAbaEmpresa = () => {
    setEmpresaFormNome(empresa.nome || '');
    setEmpresaFormCnpj(empresa.cnpj || '');
    setEmpresaFormEndereco(empresa.endereco || '');
    setEmpresaFormTelefone(empresa.telefone || '');
    setEmpresaFormSlogan(empresa.slogan || '');
    setEmpresaFormLogo(empresa.logo || '');
    setEmpresaFormPermitirEstoqueNegativo(empresa.permitirEstoqueNegativo || false);
    setEmpresaFormPixChave(empresa.pixConfig?.chave || '');
    setEmpresaFormPixTipo(empresa.pixConfig?.tipoChave || 'CPF');
    setEmpresaFormPixNome(empresa.pixConfig?.nomeRecebedor || '');
    setEmpresaFormPixCidade(empresa.pixConfig?.cidadeRecebedor || '');
    setActiveTab('empresa');
  };

  const abrirAbaNfce = () => {
    setEmpresaFormNfceAmbiente(empresa.nfceConfig?.ambiente || 'homologacao');
    setEmpresaFormNfceUf(empresa.nfceConfig?.uf || '');
    setEmpresaFormNfceCnpj(empresa.nfceConfig?.cnpj || '');
    setEmpresaFormNfceIe(empresa.nfceConfig?.inscricaoEstadual || '');
    setEmpresaFormNfceCsc(empresa.nfceConfig?.csc || '');
    setEmpresaFormNfceIdCsc(empresa.nfceConfig?.idCsc || '');
    setEmpresaFormNfceApiUrl(empresa.nfceConfig?.apiUrl || '');
    setEmpresaFormNfceCertificadoBase64(empresa.nfceConfig?.certificadoBase64 || '');
    setEmpresaFormNfceCertificadoSenha(empresa.nfceConfig?.certificadoSenha || '');
    setActiveTab('nfce');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        mostrarFeedback('A imagem da logo deve ter no máximo 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setEmpresaFormLogo(reader.result);
          mostrarFeedback('Logo carregada! Lembre de salvar as alterações.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const carregarPrinterConfig = async () => {
    try {
      const res = await fetch('/api/printer-config');
      if (res.ok) {
        const data = await res.json();
        setPrinterConfig(data);
      }
    } catch (err) {
      console.error('Erro ao buscar configuração de impressoras:', err);
    }
  };

  const salvarPrinterConfigForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      cozinhaIp: printerFormCozinhaIp.trim(),
      cozinhaPorta: Number(printerFormCozinhaPorta) || 9100,
      caixaIp: printerFormCaixaIp.trim(),
      caixaPorta: Number(printerFormCaixaPorta) || 9100,
      usarApiRemota: printerFormUsarApiRemota,
      apiUrl: printerFormApiUrl.trim(),
      apiToken: printerFormApiToken.trim(),
      tipoImpressora: printerFormTipoImpressora
    };

    try {
      const res = await fetch('/api/printer-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setPrinterConfig(data);
        mostrarFeedback('Configurações de impressoras atualizadas com sucesso!');
      } else {
        mostrarFeedback('Erro ao salvar configurações de impressoras.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao salvar configurações de impressoras.', 'error');
    }
  };

  const abrirAbaImpressoras = () => {
    setPrinterFormCozinhaIp(printerConfig.cozinhaIp || '192.168.1.100');
    setPrinterFormCozinhaPorta(printerConfig.cozinhaPorta || 9100);
    setPrinterFormCaixaIp(printerConfig.caixaIp || '192.168.1.200');
    setPrinterFormCaixaPorta(printerConfig.caixaPorta || 9100);
    setPrinterFormUsarApiRemota(!!printerConfig.usarApiRemota);
    setPrinterFormApiUrl(printerConfig.apiUrl || '');
    setPrinterFormApiToken(printerConfig.apiToken || '');
    setPrinterFormTipoImpressora(printerConfig.tipoImpressora || 'escpos');
    setActiveTab('impressoras');
  };

  const inicializarDados = async () => {
    setIsLoading(true);
    await Promise.all([
      carregarProdutos(),
      carregarComandas(),
      carregarRelatorio(),
      carregarEmpresa(),
      carregarPrinterConfig()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    inicializarDados();
  }, []);

  // Exibe feedback temporário na tela
  const mostrarFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // --- MÉTODOS DO PDV E CARRINHO ---

  // Ao alterar o modo de venda (Direta ou Comanda)
  useEffect(() => {
    if (modoVenda === 'direta') {
      setCarrinho([]);
      setComandaSelecionadaId('');
    } else if (modoVenda === 'comanda' && comandaSelecionadaId) {
      const comanda = comandas.find(c => c.id === comandaSelecionadaId);
      if (comanda) {
        setCarrinho(comanda.itens);
      }
    } else {
      setCarrinho([]);
    }
  }, [modoVenda, comandaSelecionadaId]);

  // Se o usuário selecionar uma comanda na lista enquanto no modo comanda
  const handleSelecionarComanda = (id: string) => {
    setComandaSelecionadaId(id);
    const comanda = comandas.find(c => c.id === id);
    if (comanda) {
      setCarrinho(comanda.itens);
      mostrarFeedback(`Comanda "${comanda.identificador}" carregada no PDV.`);
    }
  };

  // Adicionar produto ao carrinho
  const adicionarAoCarrinho = (produto: Produto) => {
    // Alerta de estoque baixo opcional
    if (produto.controlarEstoque && produto.estoque <= 0) {
      mostrarFeedback(`Atenção: "${produto.nome}" está sem estoque, mas a venda será permitida.`, 'error');
    }

    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.produtoId === produto.id);
      if (itemExistente) {
        return prev.map(item =>
          item.produtoId === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            produtoId: produto.id,
            nome: produto.nome,
            quantidade: 1,
            precoVenda: produto.precoVenda
          }
        ];
      }
    });
  };

  // Alterar quantidade do item no carrinho
  const alterarQuantidade = (produtoId: string, delta: number) => {
    setCarrinho(prev => {
      return prev
        .map(item => {
          if (item.produtoId === produtoId) {
            const novaQtd = item.quantidade + delta;
            return { ...item, quantidade: novaQtd };
          }
          return item;
        })
        .filter(item => item.quantidade > 0);
    });
  };

  // Remover item do carrinho
  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produtoId !== produtoId));
  };

  // Calcular total do carrinho
  const totalCarrinho = carrinho.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);

  // Salvar itens atuais na comanda ativa (sem fechar/pagar)
  const salvarItensNaComanda = async () => {
    if (!comandaSelecionadaId) {
      mostrarFeedback('Selecione ou abra uma comanda primeiro.', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/comandas/${comandaSelecionadaId}/itens`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens: carrinho })
      });
      if (res.ok) {
        mostrarFeedback('Comanda atualizada com sucesso no servidor!');
        await carregarComandas();
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao atualizar comanda.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao salvar comanda.', 'error');
    }
  };

  // Finalizar e receber pagamento (Fecha a venda e dá baixa no estoque)
  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      mostrarFeedback('O carrinho está vazio!', 'error');
      return;
    }

    try {
      const body: any = {
        formaPagamento: formaPagamento === 'Cartão de Crédito' ? `Cartão de Crédito - ${parcelasCredito}x` : formaPagamento,
        comandaId: modoVenda === 'comanda' ? comandaSelecionadaId : undefined,
        itens: modoVenda === 'direta' ? carrinho : undefined,
        parcelas: formaPagamento === 'Cartão de Crédito' ? parcelasCredito : undefined,
        caixaId: caixaAtivo?.id
      };

      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const vendaEfetuada: Venda = await res.json();
        setVendaRecente(vendaEfetuada);
        setShowCupomModal(true);
        mostrarFeedback('Venda realizada e registrada com sucesso!');
        
        // Limpa carrinho e estados de seleção
        setCarrinho([]);
        setComandaSelecionadaId('');
        
        // Atualiza dados
        await inicializarDados();
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao processar venda.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao processar venda.', 'error');
    }
  };

  const handleDevolverVenda = async (e: React.MouseEvent, vendaId: string) => {
    e.stopPropagation();
    setVendaDevolucaoId(vendaId);
    setMotivoDevolucao('');
    setShowDevolucaoModal(true);
  };

  const confirmarDevolucao = async () => {
    if (!motivoDevolucao.trim()) {
      mostrarFeedback('Por favor, informe o motivo da devolução.', 'error');
      return;
    }
    mostrarFeedback('Processando devolução...');
    setShowDevolucaoModal(false);
    try {
      const res = await fetch(`/api/vendas/${vendaDevolucaoId}/devolucao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoDevolucao })
      });
      if (res.ok) {
        mostrarFeedback('Venda devolvida com sucesso!');
        await carregarRelatorio();
        await inicializarDados(); // Para atualizar o estoque na tela
      } else {
        const err = await res.json();
        mostrarFeedback(`Erro: ${err.error}`, 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao devolver venda.', 'error');
    }
  };

  const handleEmitirNfce = async (vendaId: string) => {
    mostrarFeedback('Emitindo NFC-e, aguarde...');
    try {
      const res = await fetch('/api/nfce/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendaId })
      });
      
      const data = await res.json();
      
      if (res.ok && data.sucesso) {
        mostrarFeedback('NFC-e Autorizada com sucesso!');
        // Atualizar a vendaRecente localmente
        if (vendaRecente && vendaRecente.id === vendaId) {
          setVendaRecente({ ...vendaRecente, nfce_status: data.status, nfce_chave: data.chave });
        }
        // Atualizar relatórios e histórico
        carregarRelatorio();
      } else {
        mostrarFeedback(`Rejeição NFC-e: ${data.error || 'Erro desconhecido'}`, 'error');
      }
    } catch (err: any) {
      mostrarFeedback('Erro de conexão ao emitir NFC-e: ' + err.message, 'error');
    }
  };

  // --- MÉTODOS DE CRIAÇÃO E MANIPULAÇÃO DE COMANDAS ---

  const criarNovaComanda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaComandaIdentificador.trim()) {
      mostrarFeedback('Digite uma mesa ou nome válido.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/comandas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identificador: novaComandaIdentificador })
      });

      if (res.ok) {
        const novaC: Comanda = await res.json();
        mostrarFeedback(`Comanda "${novaC.identificador}" aberta!`);
        setNovaComandaIdentificador('');
        setShowNovaComandaModal(false);
        await carregarComandas();
        
        // Seleciona automaticamente no PDV
        setModoVenda('comanda');
        setComandaSelecionadaId(novaC.id);
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao abrir comanda.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao criar comanda.', 'error');
    }
  };

  const deletarComanda = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta comanda ativa? Todos os itens adicionados serão perdidos.')) {
      return;
    }
    try {
      const res = await fetch(`/api/comandas/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        mostrarFeedback('Comanda cancelada.');
        if (comandaSelecionadaId === id) {
          setComandaSelecionadaId('');
          setCarrinho([]);
        }
        await carregarComandas();
      } else {
        mostrarFeedback('Erro ao cancelar comanda.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão.', 'error');
    }
  };

  // --- MÉTODOS DE PRODUTOS (CRUD) ---

  const abrirModalProduto = (produto: Produto | null = null) => {
    if (produto) {
      setProdutoEmEdicao(produto);
      setProdFormNome(produto.nome);
      setProdFormCategoria(produto.categoria);
      setProdFormPrecoCusto(produto.precoCusto);
      setProdFormPrecoVenda(produto.precoVenda);
      setProdFormEstoque(produto.estoque);
      setProdFormControlarEstoque(produto.controlarEstoque);
      setProdFormEstoqueMinimo(produto.estoqueMinimo !== undefined ? produto.estoqueMinimo : 5);
    } else {
      setProdutoEmEdicao(null);
      setProdFormNome('');
      setProdFormCategoria('Bebidas');
      setProdFormPrecoCusto(0);
      setProdFormPrecoVenda(0);
      setProdFormEstoque(10);
      setProdFormControlarEstoque(true);
      setProdFormEstoqueMinimo(5);
    }
    setShowProdutoModal(true);
  };

  const salvarProdutoForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormNome.trim()) {
      mostrarFeedback('O nome do produto é obrigatório.', 'error');
      return;
    }
    if (prodFormPrecoVenda <= 0) {
      mostrarFeedback('O preço de venda deve ser maior que zero.', 'error');
      return;
    }

    const payload = {
      nome: prodFormNome.trim(),
      categoria: prodFormCategoria,
      precoCusto: Number(prodFormPrecoCusto),
      precoVenda: Number(prodFormPrecoVenda),
      estoque: prodFormControlarEstoque ? Number(prodFormEstoque) : 0,
      controlarEstoque: prodFormControlarEstoque,
      estoqueMinimo: prodFormControlarEstoque ? Number(prodFormEstoqueMinimo) : null
    };

    try {
      let res;
      if (produtoEmEdicao) {
        res = await fetch(`/api/produtos/${produtoEmEdicao.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        mostrarFeedback(produtoEmEdicao ? 'Produto atualizado!' : 'Produto cadastrado!');
        setShowProdutoModal(false);
        setProdutoEmEdicao(null);
        await carregarProdutos();
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao salvar produto.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao salvar produto.', 'error');
    }
  };

  const deletarProduto = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este produto?')) {
      return;
    }
    try {
      const res = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        mostrarFeedback('Produto removido.');
        await carregarProdutos();
      } else {
        const err = await res.json();
        mostrarFeedback(err.error || 'Erro ao remover produto.', 'error');
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão.', 'error');
    }
  };

  // --- FUNÇÃO AUXILIAR DE DEMONSTRAÇÃO ---

  const reiniciarDemonstracao = async () => {
    if (!window.confirm('Deseja reiniciar as vendas de hoje, comandas e estoque para os valores iniciais de teste?')) {
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/vendas/reiniciar', { method: 'POST' });
      if (res.ok) {
        mostrarFeedback('Caixa e Comandas reiniciados para demonstração!');
        setCarrinho([]);
        setComandaSelecionadaId('');
        await inicializarDados();
      }
    } catch (err) {
      mostrarFeedback('Erro de conexão ao reiniciar.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtragem de produtos para exibição no PDV
  const produtosFiltrados = produtos.filter(p => {
    const correspondeCategoria = categoriaAtiva === 'Todos' || p.categoria === categoriaAtiva;
    const correspondeBusca = p.nome.toLowerCase().includes(buscaProduto.toLowerCase());
    return correspondeCategoria && correspondeBusca;
  });

  // ==========================================
  // RENDERIZAÇÃO
  // ==========================================

  if (window.location.pathname === '/master-admin') {
    return <MasterAdmin />;
  }

  if (isCheckingLicense) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-amber-500">
        <RefreshCw className="animate-spin w-8 h-8" />
      </div>
    );
  }

  if (isLicenseExpired) {
    return (
      <AtivacaoLicenca
        validadeAtual={licencaValidade}
        onSuccess={() => {
          setIsLicenseExpired(false);
          window.location.reload();
        }}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex flex-col items-center justify-center p-4 selection:bg-amber-500/30 text-zinc-100 font-sans">
        <div className="w-full max-w-md">
          {/* Logo / Header */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
              <Store className="text-zinc-950 w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              {empresa.nome || 'Sabor Gourmet'} PDV
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Acesso Restrito ao Caixa</p>
          </div>

          {/* Form Card */}
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Digite a senha do caixa"
                    className="w-full bg-[#1E1E22] border border-zinc-700/50 rounded-xl px-4 py-3.5 text-zinc-100 font-medium placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">
                    <CheckCircle className={`w-5 h-5 transition-colors ${loginPassword.length > 0 ? 'text-amber-500' : 'text-zinc-600'}`} />
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex items-start gap-2 text-rose-500 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-medium mt-0.5">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || !loginPassword}
                className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-zinc-950 font-bold py-3.5 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 group mt-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="text-center mt-8 flex flex-col items-center gap-1.5">
            <p className="text-xs text-zinc-500 font-medium flex items-center justify-center gap-2">
              Sistema PDV Seguro <span className="bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded text-[9px] font-bold">v1.0.0</span>
            </p>
            <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase mt-1">
              Desenvolvido por <a href="https://github.com/levisite-cloud" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-400 transition-colors">Levisite Cloud</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-zinc-100 flex font-sans overflow-hidden" id="pdv-app-container">
      {/* OVERLAY MOBILE */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* SIDEBAR LATERAL */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121214] border-r border-zinc-800 flex flex-col shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         {/* Logo / Título da Empresa */}
         <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0 h-16">
           <div className="flex items-center gap-3">
             <div className="p-1.5 bg-amber-500 rounded-lg text-zinc-950 flex items-center justify-center overflow-hidden w-9 h-9 shrink-0">
               {empresa.logo ? (
                 <img src={empresa.logo} alt="Logo" referrerPolicy="no-referrer" className="w-full h-full object-cover rounded-md" id="header-empresa-logo" />
               ) : (
                 <Utensils className="w-5 h-5" />
               )}
             </div>
             <div className="overflow-hidden">
               <h1 className="text-sm font-bold text-white truncate">
                 {empresa.nome}
               </h1>
               <p className="text-[10px] text-amber-500 font-medium tracking-wider">PDV & BAR</p>
             </div>
           </div>
           
           {/* Close button for mobile */}
           <button 
             className="md:hidden p-1 text-zinc-400 hover:text-white rounded-md bg-zinc-800/50"
             onClick={() => setIsMobileMenuOpen(false)}
           >
             <X className="w-5 h-5" />
           </button>
         </div>
         
         <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1 custom-scrollbar">
           {/* Root items */}
           <button onClick={() => { setActiveTab('pdv'); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === 'pdv' ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-zinc-400 hover:bg-[#1E1E22] hover:text-zinc-100'}`}>
             <LayoutDashboard className="w-4 h-4" /> Dashboard (PDV)
           </button>
           
           <button onClick={() => { setActiveTab('produtos'); carregarProdutos(); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === 'produtos' ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-zinc-400 hover:bg-[#1E1E22] hover:text-zinc-100'}`}>
             <Package className="w-4 h-4" /> Produtos
           </button>
           
           <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-zinc-600 cursor-not-allowed`} title="Em breve">
             <Users className="w-4 h-4" /> Clientes
           </button>
           
           <button onClick={() => { setActiveTab('comandas'); carregarComandas(); setIsMobileMenuOpen(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${activeTab === 'comandas' ? 'bg-amber-500/10 text-amber-500 font-bold' : 'text-zinc-400 hover:bg-[#1E1E22] hover:text-zinc-100'}`}>
             <div className="flex items-center gap-3"><ClipboardList className="w-4 h-4" /> Pedidos</div>
             {comandas.length > 0 && <span className="bg-amber-500 text-zinc-950 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{comandas.length}</span>}
           </button>
           
           {/* ACCORDION CAIXA */}
           <div className="mt-2">
             <button onClick={() => toggleMenu('caixa')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-zinc-300 hover:bg-[#1E1E22]`}>
               <div className="flex items-center gap-3"><Wallet className="w-4 h-4 text-emerald-500" /> Controle de Caixa</div>
               {openMenus.includes('caixa') ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
             </button>
             {openMenus.includes('caixa') && (
               <div className="flex flex-col gap-1 mt-1 border-l border-zinc-800 ml-5 pl-3">
                 <button onClick={() => { setActiveTab('caixa'); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'caixa' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Abertura / Histórico</button>
                 <button onClick={() => { setShowFecharCaixaModal(true); setIsMobileMenuOpen(false); }} className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22] transition-colors cursor-pointer">Fechamento de Caixa</button>
                 <button onClick={() => { setShowSangriaModal(true); setIsMobileMenuOpen(false); }} className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22] transition-colors cursor-pointer">Sangria</button>
                 <button onClick={() => { setShowSuprimentoModal(true); setIsMobileMenuOpen(false); }} className="text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22] transition-colors cursor-pointer">Suprimento</button>
                 <button onClick={() => { setActiveTab('relatorios'); carregarRelatorio(); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'relatorios' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Relatórios</button>
               </div>
             )}
           </div>
           
           <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-2 text-zinc-600 cursor-not-allowed`} title="Em breve">
             <TrendingUp className="w-4 h-4" /> Financeiro
           </button>
           
           {/* ACCORDION CONFIG */}
           <div className="mt-2">
             <button onClick={() => toggleMenu('config')} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer text-zinc-300 hover:bg-[#1E1E22]`}>
               <div className="flex items-center gap-3"><Settings className="w-4 h-4 text-zinc-400" /> Configurações</div>
               {openMenus.includes('config') ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
             </button>
             {openMenus.includes('config') && (
               <div className="flex flex-col gap-1 mt-1 border-l border-zinc-800 ml-5 pl-3">
                 <button onClick={() => { abrirAbaEmpresa(); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'empresa' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Dados da Empresa</button>
                 <button onClick={() => { abrirAbaImpressoras(); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'impressoras' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Impressoras</button>
                 <button onClick={() => { abrirAbaNfce(); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'nfce' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>NFC-e / ACBr</button>
                 <button onClick={() => { setActiveTab('sincronizacao'); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'sincronizacao' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Sincronização</button>
                 <button onClick={() => { setActiveTab('info'); fetch('/api/system/info').then(res => res.json()).then(setSystemInfo); setIsMobileMenuOpen(false); }} className={`text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${activeTab === 'info' ? 'bg-amber-500/10 text-amber-500 font-medium' : 'text-zinc-400 hover:text-zinc-100 hover:bg-[#1E1E22]'}`}>Informações do Sistema</button>
               </div>
             )}
           </div>
           
         </nav>
         <div className="p-4 border-t border-zinc-800 flex flex-col items-center justify-center gap-1">
            <p className="font-bold text-zinc-300 text-xs text-center">ERP Bar e Restaurante</p>
            <p className="text-[10px] text-zinc-500">Versão v1.0.0</p>
            <p className="text-[10px] text-zinc-500 mt-1">Desenvolvido por Levi</p>
            <p className="text-[9px] text-zinc-600 mt-2 text-center">&copy; 2026 - Todos os direitos reservados.</p>
         </div>
      </aside>
      
      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Notificação Global de Estoque Mínimo */}
        {produtos.filter(p => p.controlarEstoque && p.estoque <= (p.estoqueMinimo ?? 5)).length > 0 && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 text-amber-500 px-4 py-2 flex items-center justify-center gap-2 text-sm font-bold shadow-md z-50 shrink-0">
            <AlertTriangle className="w-5 h-5" />
            <span>Atenção: Você possui {produtos.filter(p => p.controlarEstoque && p.estoque <= (p.estoqueMinimo ?? 5)).length} produto(s) com estoque baixo!</span>
          </div>
        )}

        {/* FEEDBACK FLOATING TOAST */}
        {feedbackMsg && (
          <div
            className={`absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl border text-sm max-w-sm animate-bounce ${
              feedbackMsg.type === 'success'
                ? 'bg-[#121214] text-emerald-400 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-[#121214] text-rose-400 border-rose-500/30 shadow-rose-500/10'
            }`}
            id="floating-feedback"
          >
            {feedbackMsg.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* HEADER TOP BAR */}
        <header className="bg-[#121214] text-white shadow-md border-b border-zinc-800 h-16 shrink-0 flex items-center px-4 md:px-6 justify-between">
          <div className="flex items-center gap-2 md:gap-4 text-xs text-zinc-400">
            <button 
              className="md:hidden p-1.5 -ml-1.5 text-zinc-400 hover:text-white rounded-md bg-zinc-800/50"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            {syncStatus && (
              <div 
                className="hidden sm:flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => setActiveTab('sincronizacao')}
                title="Status Global de Sincronização"
              >
                {Object.values(syncStatus).some(s => s === 'Sincronizando') ? (
                  <span className="flex items-center gap-1 font-mono text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-bold">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Sincronizando
                  </span>
                ) : Object.values(syncStatus).some(s => s === 'Erro') ? (
                  <span className="flex items-center gap-1 font-mono text-rose-400 bg-rose-500/10 px-2 py-1 rounded border border-rose-500/20 font-bold">
                    <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse"></span> Falha Sync
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold">
                    <CheckCircle className="w-3 h-3" /> Sincronizado
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Servidor:</span>
              <span className="flex items-center gap-1 font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                Ativo
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
             <span className="text-xs text-zinc-300 font-mono bg-[#1E1E22] px-3 py-1.5 rounded-lg border border-zinc-800 hidden lg:block">
               📆 {new Date().toLocaleDateString('pt-BR')}
             </span>

             <button onClick={() => setShowRenovarModal(true)} className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 border border-emerald-500/20 transition-all duration-200 px-3 py-1.5 rounded-lg cursor-pointer" title="Inserir novo código de licença">
               <KeyRound className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Renovar</span>
             </button>

             <button onClick={reiniciarDemonstracao} className="flex items-center gap-1.5 text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-zinc-950 border border-rose-500/20 transition-all duration-200 px-3 py-1.5 rounded-lg cursor-pointer" title="Reinicia comandas e limpa vendas do dia para teste limpo">
               <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Reset Demo</span>
             </button>

             <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('pdv_auth'); }} className="flex items-center gap-1.5 text-xs font-semibold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 transition-all duration-200 px-3 py-1.5 rounded-lg cursor-pointer" title="Sair do sistema">
               <LogOut className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Sair</span>
             </button>
          </div>
        </header>

        {/* Modal de Renovação Manual */}
        {showRenovarModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-md">
              <button
                onClick={() => setShowRenovarModal(false)}
                className="absolute -top-12 right-0 text-gray-400 hover:text-white"
              >
                <X className="w-8 h-8" />
              </button>
              <AtivacaoLicenca
                validadeAtual={licencaValidade}
                onSuccess={() => {
                  setShowRenovarModal(false);
                  window.location.reload();
                }}
              />
            </div>
          </div>
        )}

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col justify-stretch overflow-y-auto" id="main-content-wrapper">
        
        {isLoading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-20 gap-3" id="loading-spinner-container">
            <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
            <p className="text-sm font-medium text-zinc-400">Buscando informações no servidor...</p>
          </div>
        ) : (
          <>
            {/* 1. ABA DE PDV (FRENTE DE CAIXA) */}
            {activeTab === 'pdv' && (
              !caixaAtivo ? (
                <div className="flex-1 flex flex-col justify-center items-center py-20 gap-4 bg-[#121214] rounded-xl border border-zinc-800 m-4">
                  <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center mb-2">
                    <Lock className="w-10 h-10 text-rose-500" />
                  </div>
                  <h2 className="text-3xl font-bold text-zinc-100">Caixa Fechado</h2>
                  <p className="text-zinc-400 max-w-md text-center text-base">
                    Para iniciar as vendas e utilizar o PDV, é necessário abrir o caixa primeiro. Isso garante a segurança e rastreabilidade das transações.
                  </p>
                  <button
                    onClick={() => setActiveTab('caixa')}
                    className="mt-6 flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer text-lg"
                  >
                    <Unlock className="w-6 h-6" />
                    Ir para Abertura de Caixa
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1" id="pdv-grid">
                
                {/* COLUNA ESQUERDA: CATÁLOGO DE PRODUTOS */}
                <div className="lg:col-span-7 flex flex-col gap-4" id="pdv-catalog-col">
                  {/* Busca e Filtros de Categorias */}
                  <div className="bg-[#121214] p-4 rounded-xl shadow-md border border-zinc-800 flex flex-col gap-3">
                    <div className="relative">
                      <Search className="w-4 h-4 text-amber-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Buscar produto pelo nome..."
                        value={buscaProduto}
                        onChange={(e) => setBuscaProduto(e.target.value)}
                        className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden text-sm rounded-lg pl-9 pr-4 py-2 text-zinc-100 placeholder-zinc-500 font-medium"
                        id="search-input-pdv"
                      />
                    </div>

                    <div className="flex gap-1.5 overflow-x-auto pb-1" id="category-filters-container">
                      {['Todos', 'Bebidas', 'Almoço/Pratos', 'Sobremesas'].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoriaAtiva(cat)}
                          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                            categoriaAtiva === cat
                              ? 'bg-amber-500 text-zinc-950 font-bold'
                              : 'bg-[#1E1E22] text-zinc-400 hover:bg-[#25252A] hover:text-zinc-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Grid de Produtos */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto min-h-[300px] lg:h-[calc(100vh-290px)] pr-1" id="pdv-products-grid">
                    {produtosFiltrados.length === 0 ? (
                      <div className="col-span-full bg-[#121214] border border-zinc-800 rounded-xl p-10 text-center text-zinc-400" id="no-products-found">
                        <Coffee className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
                        <p className="text-sm font-medium">Nenhum produto cadastrado nessa categoria.</p>
                        <button
                          onClick={() => abrirModalProduto()}
                          className="mt-3 inline-flex items-center gap-1 text-xs bg-amber-500 text-zinc-950 px-3 py-1.5 rounded-lg hover:bg-amber-400 font-semibold cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Cadastrar Novo
                        </button>
                      </div>
                    ) : (
                      produtosFiltrados.map((produto) => {
                        const esgotado = produto.controlarEstoque && produto.estoque === 0;
                        const negativo = produto.controlarEstoque && produto.estoque < 0;
                        return (
                          <div
                            key={produto.id}
                            onClick={() => adicionarAoCarrinho(produto)}
                            className={`bg-[#121214] border hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/[0.03] hover:-translate-y-0.5 rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 cursor-pointer text-left relative group ${
                              negativo ? 'border-rose-500/50 bg-rose-500/5' : esgotado ? 'opacity-60 border-rose-950/50 bg-rose-950/5' : 'border-zinc-800'
                            }`}
                            id={`produto-card-${produto.id}`}
                          >
                            <div>
                              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                                {produto.categoria}
                              </span>
                              <h3 className="text-sm font-semibold text-zinc-200 mt-1 leading-snug group-hover:text-amber-400 transition-colors">
                                {produto.nome}
                              </h3>
                            </div>

                            <div className="mt-4 flex justify-between items-end">
                              <div>
                                <p className="text-[10px] text-zinc-400">Preço</p>
                                <p className="text-base font-extrabold text-amber-400 font-mono">
                                  R$ {produto.precoVenda.toFixed(2)}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                {produto.controlarEstoque ? (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    negativo
                                      ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                                      : esgotado
                                      ? 'bg-rose-950/20 text-rose-400 border border-rose-950/30'
                                      : produto.estoque < 15
                                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}>
                                    {negativo ? `Negativo: ${produto.estoque}` : esgotado ? 'Esgotado' : `Estoque: ${produto.estoque}`}
                                  </span>
                                ) : (
                                  <span className="text-[10px] bg-zinc-800 text-zinc-400 font-medium px-1.5 py-0.5 rounded">
                                    Livre ♾️
                                  </span>
                                )}

                                <div className="p-1 bg-amber-500/10 text-amber-400 rounded-lg group-hover:bg-amber-500 group-hover:text-zinc-950 transition-all">
                                  <Plus className="w-3.5 h-3.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* COLUNA DIREITA: OPERADOR DE CAIXA / CARRINHO */}
                <div className="lg:col-span-5 flex flex-col min-h-[450px] lg:min-h-[550px] lg:h-[calc(100vh-220px)]" id="pdv-cart-col">
                  <div className="bg-[#121214] border border-zinc-800 rounded-xl shadow-md flex flex-col flex-1 overflow-hidden">
                    
                    {/* SELETOR DE MODO (BALCÃO VS COMANDA) */}
                    <div className="bg-[#0A0A0B] p-3 flex flex-col gap-2 border-b border-zinc-800">
                      <div className="grid grid-cols-2 gap-1 bg-[#1A1A1D] p-1 rounded-lg">
                        <button
                          onClick={() => setModoVenda('direta')}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            modoVenda === 'direta'
                              ? 'bg-[#121214] text-amber-500 border border-amber-500/15 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E22]/50'
                          }`}
                          id="btn-modo-venda-direta"
                        >
                          Venda Direta (Balcão)
                        </button>
                        <button
                          onClick={() => setModoVenda('comanda')}
                          className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                            modoVenda === 'comanda'
                              ? 'bg-[#121214] text-amber-500 border border-amber-500/15 shadow-sm'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#1E1E22]/50'
                          }`}
                          id="btn-modo-venda-comanda"
                        >
                          Usar Comanda / Mesa
                        </button>
                      </div>

                      {/* Seletor ou Criação de Comanda se modo Comanda ativo */}
                      {modoVenda === 'comanda' && (
                        <div className="flex gap-2 items-center mt-1 animate-fadeIn">
                          {comandas.length === 0 ? (
                            <div className="text-xs text-amber-400 flex-1 py-1">
                              Nenhuma comanda ativa aberta.
                            </div>
                          ) : (
                            <select
                              value={comandaSelecionadaId}
                              onChange={(e) => handleSelecionarComanda(e.target.value)}
                              className="bg-[#1E1E22] text-zinc-100 text-xs border border-zinc-800 rounded-lg px-2 py-1.5 flex-1 focus:outline-hidden focus:border-amber-500/50 font-medium cursor-pointer"
                              id="select-comanda-pdv"
                            >
                              <option value="">-- Selecione uma Comanda --</option>
                              {comandas.map(c => (
                                <option key={c.id} value={c.id}>
                                  {c.identificador} ({c.itens.length} itens)
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() => setShowNovaComandaModal(true)}
                            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shrink-0 cursor-pointer"
                            id="btn-abrir-comanda-pdv"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Abrir Comanda
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LISTAGEM DOS ITENS NO CARRINHO */}
                    <div className="flex-1 p-4 overflow-y-auto min-h-0" id="cart-items-container">
                      <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800 mb-3">
                        <h3 className="font-bold text-zinc-100 text-sm flex items-center gap-1.5">
                          <Receipt className="w-4 h-4 text-amber-500" />
                          Itens do Pedido
                        </h3>
                        <span className="text-xs bg-[#1E1E22] text-amber-400 font-bold px-2 py-0.5 rounded border border-zinc-800">
                          {carrinho.reduce((acc, i) => acc + i.quantidade, 0)} itens
                        </span>
                      </div>

                      {carrinho.length === 0 ? (
                        <div className="flex flex-col justify-center items-center py-10 text-center text-zinc-500" id="cart-empty-state">
                          <Coffee className="w-12 h-12 text-zinc-700 mb-2" />
                          <p className="text-sm font-medium">Carrinho de compras vazio</p>
                          <p className="text-xs mt-1 text-zinc-500 max-w-xs">
                            {modoVenda === 'comanda'
                              ? 'Selecione uma comanda ativa para ver os itens ou adicione novos clicando nos produtos à esquerda.'
                              : 'Clique nos produtos à esquerda para adicioná-los ao caixa.'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5" id="cart-items-list">
                          {carrinho.map((item) => (
                            <div
                              key={item.produtoId}
                              className="flex items-center justify-between p-2.5 bg-[#1E1E22] border border-zinc-800/80 rounded-lg hover:bg-[#25252A] transition-colors"
                              id={`cart-item-${item.produtoId}`}
                            >
                              <div className="flex-1 min-w-0 pr-2">
                                <h4 className="text-xs font-bold text-zinc-100 truncate">
                                  {item.nome}
                                </h4>
                                <span className="text-[10px] font-semibold text-zinc-400 font-mono">
                                  R$ {item.precoVenda.toFixed(2)} x {item.quantidade}
                                </span>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center bg-[#121214] border border-zinc-800 rounded-md">
                                  <button
                                    onClick={() => alterarQuantidade(item.produtoId, -1)}
                                    className="p-1 hover:bg-[#1E1E22] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                    title="Remover 1"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-2 text-xs font-extrabold text-zinc-200 font-mono select-none">
                                    {item.quantidade}
                                  </span>
                                  <button
                                    onClick={() => alterarQuantidade(item.produtoId, 1)}
                                    className="p-1 hover:bg-[#1E1E22] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                    title="Adicionar 1"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="text-right w-16">
                                  <p className="text-xs font-extrabold text-amber-400 font-mono">
                                    R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                                  </p>
                                </div>

                                <button
                                  onClick={() => removerDoCarrinho(item.produtoId)}
                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title="Remover item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SUB-TOTAL & FORMA DE PAGAMENTO */}
                    <div className="bg-[#161618] p-4 border-t border-zinc-800 shrink-0" id="cart-actions-container">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-zinc-400">Total Geral:</span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          R$ {totalCarrinho.toFixed(2)}
                        </span>
                      </div>

                      {/* Método de Pagamento */}
                      <div className="mb-4">
                        <p className="text-xs font-bold text-zinc-400 mb-2">Forma de Pagamento:</p>
                        <div className="grid grid-cols-4 gap-1.5" id="payment-methods-grid">
                          {(['Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'PIX'] as FormaPagamento[]).map((forma) => {
                            const iconMap = {
                              'Dinheiro': <DollarSign className="w-4 h-4 text-emerald-400" />,
                              'Cartão de Crédito': <CreditCard className="w-4 h-4 text-sky-400" />,
                              'Cartão de Débito': <CreditCard className="w-4 h-4 text-blue-400" />,
                              'PIX': <QrCode className="w-4 h-4 text-teal-400" />
                            };
                            return (
                              <button
                                key={forma}
                                type="button"
                                onClick={() => {
                                  setFormaPagamento(forma);
                                  if (forma === 'PIX' && !gerarPixQR && empresa.pixConfig?.chave) {
                                    if (totalCarrinho > 0) {
                                      setShowPixModal(true);
                                    } else {
                                      setPixEmptyCartAlert(true);
                                    }
                                  } else if (forma !== 'PIX') {
                                    setGerarPixQR(false);
                                  }
                                }}
                                className={`p-2 flex flex-col items-center justify-center gap-1.5 border rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                                  formaPagamento === forma
                                    ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-md font-bold'
                                    : 'bg-[#1E1E22] text-zinc-300 border-zinc-800 hover:bg-[#25252A] hover:text-zinc-200'
                                }`}
                              >
                                {iconMap[forma]}
                                <span className="truncate w-full leading-tight">{forma}</span>
                              </button>
                            );
                          })}
                        </div>
                        {formaPagamento === 'Cartão de Crédito' && (
                          <div className="mt-3 bg-[#1A1A1D] p-2 rounded-lg border border-zinc-800">
                            <label className="text-[10px] text-zinc-400 font-bold block mb-2 uppercase tracking-wider text-center">Selecione as Parcelas</label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {[1, 2, 3, 4, 5, 6].map(p => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setParcelasCredito(p)}
                                  className={`py-1.5 px-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                                    parcelasCredito === p
                                      ? 'bg-amber-500 text-zinc-950 border-amber-500'
                                      : 'bg-[#121214] text-amber-400 border-zinc-700 hover:border-amber-500/50'
                                  }`}
                                >
                                  {p}x {p === 1 ? '(À vista)' : ''}
                                </button>
                              ))}
                            </div>
                            {parcelasCredito > 1 && (
                              <p className="text-[10px] text-zinc-400 text-center mt-2 font-mono">
                                {parcelasCredito} parcelas de <strong className="text-amber-400">R$ {(totalCarrinho / parcelasCredito).toFixed(2)}</strong>
                              </p>
                            )}
                          </div>
                        )}
                        {formaPagamento === 'PIX' && (
                          <div className="mt-3 bg-[#1A1A1D] p-3 rounded-lg border border-zinc-800 flex flex-col items-center">
                            {!empresa.pixConfig?.chave ? (
                              <p className="text-[10px] text-amber-500 text-center font-bold">
                                Nenhuma chave PIX foi cadastrada. Cadastre uma chave em Configurações &gt; PIX para gerar o QR Code.
                              </p>
                            ) : (
                              <>
                                {gerarPixQR && totalCarrinho > 0 ? (() => {
                                  // Em um App React real, não importariamos inline, mas o vite/esbuild lida bem se importarmos no topo do arquivo.
                                  // Para evitar erro de referência se a importação não for feita no topo, vou calcular a string aqui via função importada ou chamar o gerador.
                                  // A importação será feita no topo do arquivo.
                                  return (
                                    <div className="w-full flex flex-col items-center gap-2 animate-fadeIn bg-white p-2 rounded-xl">
                                      <img 
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                                          generatePixCopiaECola(
                                            empresa.pixConfig.chave,
                                            empresa.pixConfig.nomeRecebedor,
                                            empresa.pixConfig.cidadeRecebedor,
                                            totalCarrinho
                                          )
                                        )}`}
                                        alt="QR Code PIX"
                                        className="w-32 h-32"
                                      />
                                      <div className="w-full relative group">
                                        <input 
                                          type="text" 
                                          readOnly 
                                          value={generatePixCopiaECola(
                                            empresa.pixConfig.chave,
                                            empresa.pixConfig.nomeRecebedor,
                                            empresa.pixConfig.cidadeRecebedor,
                                            totalCarrinho
                                          )}
                                          className="w-full bg-zinc-100 border border-zinc-300 rounded text-[9px] text-zinc-800 py-1.5 pl-2 pr-8 truncate font-mono focus:outline-none"
                                        />
                                        <button 
                                          onClick={() => navigator.clipboard.writeText(generatePixCopiaECola(
                                            empresa.pixConfig!.chave,
                                            empresa.pixConfig!.nomeRecebedor,
                                            empresa.pixConfig!.cidadeRecebedor,
                                            totalCarrinho
                                          ))}
                                          className="absolute right-1.5 top-1.5 text-zinc-500 hover:text-teal-600 cursor-pointer bg-zinc-200 rounded p-0.5"
                                          title="Copiar PIX Copia e Cola"
                                        >
                                          <Check className="w-3 h-3 hidden group-active:block text-emerald-600" />
                                          <div className="w-3 h-3 block group-active:hidden">📋</div>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })() : (
                                  <div className="flex flex-col items-center text-center">
                                    <QrCode className="w-6 h-6 text-zinc-600 mb-2" />
                                    <p className="text-xs text-zinc-400 font-medium">Pagamento via PIX selecionado.</p>
                                    <button 
                                      onClick={() => {
                                        if (totalCarrinho > 0) {
                                          setShowPixModal(true);
                                        } else {
                                          setPixEmptyCartAlert(true);
                                        }
                                      }}
                                      className="mt-3 px-4 py-1.5 bg-teal-500/10 text-teal-400 rounded hover:bg-teal-500/20 text-[10px] font-bold transition-colors border border-teal-500/20"
                                    >
                                      Gerar QR Code Novamente
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Botões de Ação Final */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                          {modoVenda === 'comanda' && comandaSelecionadaId && (
                            <button
                              type="button"
                              onClick={salvarItensNaComanda}
                              className="flex-1 bg-[#1E1E22] hover:bg-[#25252A] text-zinc-200 border border-zinc-800 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              id="btn-salvar-comanda"
                            >
                              Salvar Parcial
                            </button>
                          )}
                          
                          {(modoVenda === 'comanda' ? ((comandas.find(c => c.id === comandaSelecionadaId)?.itens?.length || 0) + carrinho.length > 0) : carrinho.length > 0) && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedComanda = modoVenda === 'comanda' ? comandas.find(c => c.id === comandaSelecionadaId) : null;
                                const todosItens = modoVenda === 'comanda' ? [...(selectedComanda?.itens || []), ...carrinho] : carrinho;
                                const identificador = modoVenda === 'comanda' ? (selectedComanda?.identificador || 'Comanda') : 'Venda Balcão';
                                handleAbrirSimuladorImpressao(
                                  'conferencia',
                                  identificador,
                                  todosItens,
                                  new Date().toISOString(),
                                  modoVenda === 'comanda' ? comandaSelecionadaId : undefined
                                );
                              }}
                              className={`bg-[#1E1E22] hover:bg-[#25252A] text-zinc-100 border border-zinc-800 px-3 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${modoVenda === 'direta' ? 'flex-1' : ''}`}
                              id="btn-imprimir-conferencia"
                              title="Imprimir Conferência"
                            >
                              <Receipt className="w-4 h-4 text-zinc-300 shrink-0" />
                              <span className="hidden lg:inline">Conferência</span>
                            </button>
                          )}

                          {carrinho.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const selectedComanda = modoVenda === 'comanda' ? comandas.find(c => c.id === comandaSelecionadaId) : null;
                                const identificador = modoVenda === 'comanda' ? (selectedComanda?.identificador || 'Comanda') : 'Venda Balcão';
                                handleAbrirSimuladorImpressao(
                                  'cozinha',
                                  identificador,
                                  carrinho,
                                  new Date().toISOString(),
                                  modoVenda === 'comanda' ? comandaSelecionadaId : undefined
                                );
                              }}
                              className="bg-[#1E1E22] hover:bg-[#25252A] text-zinc-100 border border-zinc-800 px-3 py-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              id="btn-imprimir-carrinho"
                              title="Imprimir comanda atual para a cozinha"
                            >
                              <Printer className="w-4 h-4 text-amber-500 shrink-0" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={finalizarVenda}
                          disabled={carrinho.length === 0}
                          className={`w-full py-3 rounded-lg text-sm font-extrabold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                            carrinho.length === 0
                              ? 'bg-[#1E1E22] text-zinc-600 cursor-not-allowed border border-zinc-800/50'
                              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-md hover:shadow-lg'
                          }`}
                          id="btn-finalizar-pagamento"
                        >
                          <Check className="w-4 h-4" />
                          {modoVenda === 'comanda' ? 'Receber Comanda' : 'Concluir Venda'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
              )
            )}

            {/* 2. TAB DE CONTROLE DE COMANDAS / MESAS */}
            {activeTab === 'comandas' && (
              <div className="flex flex-col gap-4 animate-fadeIn" id="comandas-board">
                <div className="bg-[#121214] p-4 rounded-xl border border-zinc-800 shadow-md flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Quadro de Comandas e Mesas Ativas</h2>
                    <p className="text-xs text-zinc-400">Acompanhe os pedidos de clientes e realize adicionais gradativos</p>
                  </div>
                  <button
                    onClick={() => setShowNovaComandaModal(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer"
                    id="btn-abrir-nova-comanda-aba"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Abrir Comanda / Mesa
                  </button>
                </div>

                {comandas.length === 0 ? (
                  <div className="bg-[#121214] rounded-xl border border-zinc-800 p-16 text-center text-zinc-400" id="comandas-empty-state">
                    <Layers className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                    <p className="text-sm font-semibold text-zinc-200">Sem comandas abertas no momento.</p>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Abra uma comanda para mesa ou balcão para gerenciar consumos cumulativos antes do pagamento.
                    </p>
                    <button
                      onClick={() => setShowNovaComandaModal(true)}
                      className="mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                    >
                      Abrir Primeira Comanda
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="comandas-cards-grid">
                    {comandas.map((comanda) => {
                      const totalC = comanda.itens.reduce((acc, item) => acc + (item.precoVenda * item.quantidade), 0);
                      const totalQtd = comanda.itens.reduce((acc, item) => acc + item.quantidade, 0);

                      return (
                        <div
                          key={comanda.id}
                          className="bg-[#121214] border border-zinc-800 rounded-xl shadow-md overflow-hidden flex flex-col justify-between"
                          id={`comanda-board-card-${comanda.id}`}
                        >
                          {/* Top da comanda */}
                          <div className="p-4 bg-[#1A1A1D] text-white flex justify-between items-start border-b border-zinc-800/60">
                            <div>
                              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                                Mesa / Comanda Ativa
                              </span>
                              <h3 className="text-base font-extrabold text-zinc-100 mt-1.5 flex items-center gap-1.5">
                                <User className="w-4 h-4 text-zinc-500" />
                                {comanda.identificador}
                              </h3>
                            </div>
                            <span className="text-xs font-mono text-zinc-400">
                              🕒 {new Date(comanda.dataAbertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Itens adicionados */}
                          <div className="p-4 flex-1 border-b border-zinc-800/60 overflow-y-auto max-h-[160px]">
                            <p className="text-xs font-bold text-zinc-400 mb-2">Consumindo:</p>
                            {comanda.itens.length === 0 ? (
                              <p className="text-xs italic text-zinc-500 py-2">Sem itens registrados ainda.</p>
                            ) : (
                              <div className="flex flex-col gap-1.5">
                                {comanda.itens.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-300 truncate pr-2">
                                      <strong className="text-amber-400 font-mono">{item.quantidade}x</strong> {item.nome}
                                    </span>
                                    <span className="font-mono text-zinc-400 shrink-0">
                                      R$ {(item.precoVenda * item.quantidade).toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Rodapé do card da comanda */}
                          <div className="p-4 bg-[#161618] flex flex-col gap-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-semibold text-zinc-400">Parcial ({totalQtd} itens):</span>
                              <span className="text-base font-extrabold text-amber-400 font-mono">
                                R$ {totalC.toFixed(2)}
                              </span>
                            </div>

                            {comanda.itens.length > 0 && (
                              <button
                                onClick={() => handleAbrirSimuladorImpressao('cozinha', comanda.identificador, comanda.itens, new Date().toISOString(), comanda.id)}
                                className="w-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                id={`btn-imprimir-comanda-${comanda.id}`}
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                Imprimir p/ Cozinha
                              </button>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                onClick={() => {
                                  setActiveTab('pdv');
                                  setModoVenda('comanda');
                                  setComandaSelecionadaId(comanda.id);
                                }}
                                className="bg-[#1E1E22] hover:bg-[#25252A] text-zinc-100 border border-zinc-800 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                                title="Enviar comanda ao carrinho para adicionar mais itens ou pagar"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Adicionar / Pagar
                              </button>

                              <button
                                onClick={() => deletarComanda(comanda.id)}
                                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Cancelar Comanda
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. TAB DE ESTOQUE E PRODUTOS (CRUD COMPLETO) */}
            {activeTab === 'produtos' && (
              <div className="flex flex-col gap-4 animate-fadeIn" id="produtos-crud-tab">
                <div className="bg-[#121214] p-4 rounded-xl border border-zinc-800 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">Cadastro de Produtos e Estoque</h2>
                    <p className="text-xs text-zinc-400">Gerencie o cardápio e controle quais itens têm baixa inteligente de estoque</p>
                  </div>
                  <button
                    onClick={() => abrirModalProduto()}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 cursor-pointer"
                    id="btn-cadastrar-novo-produto-aba"
                  >
                    <Plus className="w-4 h-4" />
                    Cadastrar Novo Produto
                  </button>
                </div>

                <div className="bg-[#121214] rounded-xl border border-zinc-800 shadow-md overflow-hidden" id="produtos-list-wrapper">
                  <div className="p-4 border-b border-zinc-800 bg-[#1A1A1E]">
                    <label className="flex items-center gap-2 cursor-pointer w-max">
                      <input
                        type="checkbox"
                        checked={filtroEstoqueNegativo}
                        onChange={(e) => setFiltroEstoqueNegativo(e.target.checked)}
                        className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-900"
                      />
                      <span className="text-sm font-bold text-rose-500">Filtrar apenas produtos com Estoque Negativo</span>
                    </label>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse" id="produtos-table">
                      <thead>
                        <tr className="bg-[#0A0A0B] text-zinc-400 text-xs uppercase tracking-wider border-b border-zinc-800">
                          <th className="p-3.5 pl-4">Produto</th>
                          <th className="p-3.5">Categoria</th>
                          <th className="p-3.5 text-right">Preço de Custo</th>
                          <th className="p-3.5 text-right">Preço de Venda</th>
                          <th className="p-3.5 text-center">Lucro Estimado</th>
                          <th className="p-3.5 text-center">Controle Estoque?</th>
                          <th className="p-3.5 text-right">Quantidade</th>
                          <th className="p-3.5 text-center pr-4">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800 text-sm">
                        {produtos.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-zinc-500 bg-[#121214]">
                              Nenhum produto cadastrado. Clique em "Cadastrar Novo Produto" para iniciar.
                            </td>
                          </tr>
                        ) : (
                          produtos
                            .filter((p) => !filtroEstoqueNegativo || (p.controlarEstoque && p.estoque < 0))
                            .map((p) => {
                            const lucro = p.precoVenda - p.precoCusto;
                            const margem = p.precoVenda > 0 ? (lucro / p.precoVenda) * 100 : 0;
                            const isEstoqueNegativo = p.controlarEstoque && p.estoque < 0;
                            
                            return (
                              <React.Fragment key={p.id}>
                              <tr className={`transition-colors ${isEstoqueNegativo ? 'bg-rose-500/10 hover:bg-rose-500/20' : 'hover:bg-[#1E1E22]/50'}`} id={`row-produto-${p.id}`}>
                                <td className="p-3.5 pl-4">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-100 block">{p.nome}</span>
                                    {isEstoqueNegativo ? (
                                      <span className="inline-flex items-center gap-1 bg-rose-500/20 text-rose-500 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold" title="Estoque Negativo!">
                                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                        Estoque Negativo
                                      </span>
                                    ) : p.controlarEstoque && p.estoque <= (p.estoqueMinimo ?? 5) && (
                                      <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded text-[10px] font-bold" title={`Estoque atingiu ou está abaixo do mínimo de ${p.estoqueMinimo ?? 5} un.`}>
                                        <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        Mínimo atingido
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-500">ID: {p.id}</span>
                                </td>
                                <td className="p-3.5 text-zinc-300">
                                  <span className="text-xs bg-[#1E1E22] text-zinc-300 px-2 py-1 rounded-md font-medium border border-zinc-800">
                                    {p.categoria}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right font-mono text-zinc-400">
                                  R$ {p.precoCusto.toFixed(2)}
                                </td>
                                <td className="p-3.5 text-right font-mono font-bold text-amber-400">
                                  R$ {p.precoVenda.toFixed(2)}
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className="text-xs text-emerald-400 font-semibold block">
                                    + R$ {lucro.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    ({margem.toFixed(0)}%)
                                  </span>
                                </td>
                                <td className="p-3.5 text-center">
                                  {p.controlarEstoque ? (
                                    <span className="inline-flex items-center gap-0.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                                      Sim <Check className="w-3 h-3" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-xs text-zinc-500 bg-zinc-800/40 px-2 py-0.5 rounded">
                                      Não
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-right">
                                  {p.controlarEstoque ? (
                                    <div className="flex flex-col items-end">
                                      <span className={`font-mono font-bold text-sm ${p.estoque <= 0 ? 'text-rose-400' : p.estoque <= (p.estoqueMinimo ?? 5) ? 'text-amber-500 font-extrabold' : 'text-zinc-200'}`}>
                                        {p.estoque} un
                                      </span>
                                      <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                                        Mín: {p.estoqueMinimo ?? 5} un
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-500 text-xs italic" title="Estoque ilimitado, pois não controla estoque">
                                      Livre ♾️
                                    </span>
                                  )}
                                </td>
                                <td className="p-3.5 text-center pr-4">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => abrirModalProduto(p)}
                                      className="p-1.5 text-zinc-400 hover:text-zinc-100 bg-[#1E1E22] hover:bg-[#25252A] rounded-lg transition-colors cursor-pointer border border-zinc-800"
                                      title="Editar"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => deletarProduto(p.id)}
                                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer border border-rose-500/10"
                                      title="Excluir"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              {isEstoqueNegativo && (
                                <tr className="bg-rose-500/5">
                                  <td colSpan={8} className="p-3 border-t border-rose-500/10">
                                    <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-bold bg-rose-500/10 py-2 rounded-lg border border-rose-500/20">
                                      <AlertCircle className="w-4 h-4" />
                                      Atenção! O produto está com estoque negativo. Verifique as movimentações ou realize uma reposição.
                                    </div>
                                  </td>
                                </tr>
                              )}
                              </React.Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Caixa de Aviso Informativo do Mecanismo de Baixa */}
                <div className="bg-[#121214] text-zinc-300 p-4 rounded-xl border border-zinc-800 text-xs flex gap-3 items-start" id="stock-info-card">
                  <Package className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-400 mb-1">💡 Como Funciona a Baixa Inteligente?</h4>
                    <p className="leading-relaxed">
                      • Itens como <strong className="text-zinc-100">Bebidas</strong> e <strong className="text-zinc-100">Sobremesas</strong> normalmente possuem a opção "Controlar Estoque?" ativa. O caixa debitará automaticamente o estoque ao finalizar a compra.<br />
                      • Itens como <strong className="text-zinc-100">Almoço/Pratos</strong> preparados na hora não precisam de controle de estoque. O sistema permite realizar a venda sem registrar quantidade limite de estoque físico.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. TAB DE FECHAMENTO & RELATÓRIOS DO CAIXA */}
            {activeTab === 'relatorios' && (
              <div className="flex flex-col gap-5 animate-fadeIn" id="relatorios-tab-container">
                
                {/* Resumo Financeiro Cards */}
                {relatorio && (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4" id="metrics-grid">
                    <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl shadow-md flex items-center justify-between" id="metric-total-vendas">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Faturamento de Hoje</span>
                        <h3 className="text-2xl font-black text-amber-400 font-mono mt-1">
                          R$ {relatorio.totalGeral.toFixed(2)}
                        </h3>
                      </div>
                      <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                        <DollarSign className="w-6 h-6" />
                      </div>
                    </div>

                    {/* Novo Card de Estoque Negativo */}
                    {(() => {
                      const qtdEstoqueNegativo = produtos.filter(p => p.controlarEstoque && p.estoque < 0).length;
                      return (
                        <div 
                          className={`border p-4 rounded-xl shadow-md flex items-center justify-between cursor-pointer transition-colors ${qtdEstoqueNegativo > 0 ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' : 'bg-[#121214] border-zinc-800 hover:bg-[#1A1A1E]'}`} 
                          onClick={() => { setFiltroEstoqueNegativo(true); setActiveTab('produtos'); }}
                          title="Clique para ver os produtos com estoque negativo"
                        >
                          <div>
                            <span className="text-[10px] font-bold text-zinc-400 uppercase leading-tight block">Estoque<br/>Negativo</span>
                            <h3 className={`text-2xl font-black font-mono mt-1 ${qtdEstoqueNegativo > 0 ? 'text-rose-400' : 'text-zinc-100'}`}>
                              {qtdEstoqueNegativo}
                            </h3>
                          </div>
                          <div className={`p-3 rounded-lg ${qtdEstoqueNegativo > 0 ? 'bg-rose-500/20 text-rose-500' : 'bg-zinc-800 text-zinc-400'}`}>
                            <AlertCircle className="w-6 h-6" />
                          </div>
                        </div>
                      );
                    })()}

                    <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl shadow-md flex items-center justify-between" id="metric-qtd-vendas">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Vendas Realizadas</span>
                        <h3 className="text-2xl font-black text-zinc-100 font-mono mt-1">
                          {relatorio.quantidadeVendas}
                        </h3>
                      </div>
                      <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg">
                        <Receipt className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl shadow-md flex items-center justify-between" id="metric-ticket-medio">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Ticket Médio</span>
                        <h3 className="text-2xl font-black text-zinc-100 font-mono mt-1">
                          R$ {relatorio.quantidadeVendas > 0 ? (relatorio.totalGeral / relatorio.quantidadeVendas).toFixed(2) : '0.00'}
                        </h3>
                      </div>
                      <div className="p-3 bg-zinc-800 text-zinc-400 rounded-lg">
                        <FileText className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl shadow-md flex items-center justify-between" id="metric-lucro-bruto">
                      <div>
                        <span className="text-xs font-bold text-zinc-400 uppercase">Status do Caixa</span>
                        <h3 className="text-base font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Caixa Aberto
                        </h3>
                      </div>
                      <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold">
                        100% OK
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="relatorios-details-grid">
                  
                  {/* DETALHAMENTO POR FORMAS DE PAGAMENTO */}
                  <div className="lg:col-span-4 bg-[#121214] border border-zinc-800 rounded-xl p-4 shadow-md flex flex-col justify-between" id="payment-split-box">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm mb-3 border-b border-zinc-800/60 pb-2">
                        Total por Forma de Pagamento
                      </h3>
                      {relatorio && (
                        <div className="flex flex-col gap-3">
                          {[
                            { label: 'Dinheiro', val: relatorio.porForma['Dinheiro'], color: 'bg-emerald-500' },
                            { label: 'Cartão de Crédito', val: relatorio.porForma['Cartão de Crédito'], color: 'bg-sky-500' },
                            { label: 'Cartão de Débito', val: relatorio.porForma['Cartão de Débito'], color: 'bg-blue-500' },
                            { label: 'PIX', val: relatorio.porForma['PIX'], color: 'bg-teal-500' }
                          ].map((forma, idx) => {
                            const percent = relatorio.totalGeral > 0 ? (forma.val / relatorio.totalGeral) * 100 : 0;
                            return (
                              <div key={idx} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${forma.color}`}></span>
                                    {forma.label}
                                  </span>
                                  <span className="font-bold font-mono text-zinc-100">
                                    R$ {forma.val.toFixed(2)} ({percent.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-[#1E1E22] h-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${forma.color}`} style={{ width: `${percent}%` }}></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 p-3 bg-[#1A1A1D] border border-zinc-800/80 rounded-lg text-xs text-zinc-400 text-center">
                      Os relatórios são atualizados em tempo real conforme as comandas são pagas e as vendas diretas registradas.
                    </div>
                  </div>

                  {/* PRODUTOS MAIS VENDIDOS DE HOJE */}
                  <div className="lg:col-span-4 bg-[#121214] border border-zinc-800 rounded-xl p-4 shadow-md" id="most-sold-box">
                    <h3 className="font-bold text-zinc-100 text-sm mb-3 border-b border-zinc-800/60 pb-2">
                      Top 5 Produtos Mais Vendidos Hoje
                    </h3>
                    {relatorio && relatorio.maisVendidos && relatorio.maisVendidos.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 text-xs">
                        Nenhum produto vendido hoje ainda.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {relatorio?.maisVendidos?.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-[#1E1E22] border border-zinc-800 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#121214] text-zinc-400 text-[10px] font-bold flex items-center justify-center border border-zinc-800">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-zinc-200 truncate max-w-[150px]">
                                {item.nome}
                              </span>
                            </div>
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
                              {item.quantidade} vendidos
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* HISTÓRICO DE VENDAS DO CAIXA */}
                  <div className="lg:col-span-4 bg-[#121214] border border-zinc-800 rounded-xl p-4 shadow-md flex flex-col justify-between" id="recent-sales-history">
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm mb-3 border-b border-zinc-800/60 pb-2">
                        Histórico de Cupons de Hoje
                      </h3>
                      {relatorio && relatorio.vendasDetalhadas && relatorio.vendasDetalhadas.length === 0 ? (
                        <div className="text-center py-10 text-zinc-500 text-xs">
                          Nenhum cupom gerado hoje.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px] pr-1">
                          {relatorio?.vendasDetalhadas?.slice().reverse().map((v: Venda) => (
                            <div
                              key={v.id}
                              onClick={() => {
                                  setVendaRecente(v);
                                  setShowCupomModal(true);
                                }}
                              className="p-2.5 bg-[#1E1E22] hover:bg-[#25252A] border border-zinc-800 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
                              title="Clique para ver Detalhes do Cupom"
                            >
                              <div className="min-w-0 flex-1 pr-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-zinc-500">#{v.id}</span>
                                  {v.comandaIdentificador && (
                                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.2 rounded font-bold">
                                      {v.comandaIdentificador}
                                    </span>
                                  )}
                                  {v.nfce_status === 'AUTORIZADO' && (
                                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.2 rounded font-bold" title="NFC-e Autorizada">
                                      NFC-e
                                    </span>
                                  )}
                                  {v.nfce_status === 'REJEITADO' && (
                                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.2 rounded font-bold" title="NFC-e Rejeitada">
                                      NFC-e Erro
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-semibold text-zinc-400 block">
                                  Forma: {v.formaPagamento}
                                </span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <div className="flex items-center gap-2">
                                  {(v.formaPagamento.startsWith('Devolvido') || v.formaPagamento.startsWith('DEVOLVIDO')) ? (
                                    <div className="flex flex-col items-end">
                                      <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                                        DEVOLVIDA
                                      </span>
                                      {v.formaPagamento.startsWith('DEVOLVIDO|') && (
                                        <span className="text-[8px] text-zinc-500 italic truncate max-w-[100px] mt-0.5">
                                          Motivo: {v.formaPagamento.split('|')[1]}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      onClick={(e) => handleDevolverVenda(e, v.id)}
                                      className="text-zinc-500 hover:text-amber-500 hover:bg-amber-500/10 p-1 rounded transition-colors"
                                      title="Devolver Venda e Retornar ao Estoque"
                                    >
                                      <Undo2 className="w-4 h-4" />
                                    </button>
                                  )}
                                  <span className={`text-xs font-bold font-mono ${(v.formaPagamento.startsWith('Devolvido') || v.formaPagamento.startsWith('DEVOLVIDO')) ? 'text-zinc-600 line-through' : 'text-zinc-100'}`}>
                                    R$ {v.total.toFixed(2)}
                                  </span>
                                </div>
                                <span className="text-[9px] text-zinc-500 block font-mono">
                                  {new Date(v.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 5. TAB DE CONFIGURAÇÕES DA EMPRESA */}
            {activeTab === 'empresa' && (
              <div className="flex flex-col lg:flex-row gap-4 animate-fadeIn" id="empresa-tab-container">
                {/* Form de Cadastro */}
                <div className="flex-1 bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm" id="empresa-form-card">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/60 pb-2">
                    <Store className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">Cadastro do Estabelecimento</h3>
                      <p className="text-[11px] text-zinc-400">Configure as informações que serão impressas nos cupons.</p>
                    </div>
                  </div>

                  <form onSubmit={salvarEmpresaForm} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Nome do Estabelecimento *</label>
                        <input
                          type="text"
                          value={empresaFormNome}
                          onChange={(e) => setEmpresaFormNome(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: Pizzaria Bella Italia"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">CNPJ / CPF</label>
                        <input
                          type="text"
                          value={empresaFormCnpj}
                          onChange={(e) => setEmpresaFormCnpj(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: 12.345.678/0001-99"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Endereço Completo</label>
                        <input
                          type="text"
                          value={empresaFormEndereco}
                          onChange={(e) => setEmpresaFormEndereco(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: Rua das Flores, 123 - Centro"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Telefone / WhatsApp</label>
                        <input
                          type="text"
                          value={empresaFormTelefone}
                          onChange={(e) => setEmpresaFormTelefone(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: (11) 98765-4321"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Slogan ou Website (Mensagem de Rodapé)</label>
                      <input
                        type="text"
                        value={empresaFormSlogan}
                        onChange={(e) => setEmpresaFormSlogan(e.target.value)}
                        className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                        placeholder="Ex: O melhor sabor da culinária brasileira"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-[#1A1A1E] border border-zinc-800 rounded-lg p-3">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-100">Permitir Vendas com Estoque Negativo</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Se ativado, as vendas continuarão e o estoque ficará negativo.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={empresaFormPermitirEstoqueNegativo}
                          onChange={(e) => setEmpresaFormPermitirEstoqueNegativo(e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Logo upload block */}
                    <div className="border border-zinc-800 rounded-lg p-3 bg-[#1A1A1E]">
                      <label className="block text-[10px] font-bold text-zinc-300 mb-2 uppercase tracking-wide">Logomarca do Estabelecimento</label>
                      
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="w-20 h-20 bg-[#1E1E22] border border-zinc-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {empresaFormLogo ? (
                            <img
                              src={empresaFormLogo}
                              alt="Logo Preview"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Utensils className="w-8 h-8 text-zinc-600" />
                          )}
                        </div>

                        <div className="flex-1 w-full space-y-2">
                          <div className="flex flex-wrap gap-2">
                            <label className="flex items-center gap-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors px-3 py-2 rounded-lg cursor-pointer border border-zinc-700">
                              <Upload className="w-3.5 h-3.5 text-amber-400" />
                              Carregar Imagem (Max 2MB)
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleLogoUpload}
                              />
                            </label>
                            
                            {empresaFormLogo && (
                              <button
                                type="button"
                                onClick={() => setEmpresaFormLogo('')}
                                className="text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-3 py-2 rounded-lg cursor-pointer border border-rose-500/10 transition-colors"
                              >
                                Remover Logo
                              </button>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-zinc-500 leading-relaxed">
                            Selecione um arquivo PNG ou JPG quadrado de até 2MB. A imagem será convertida para Base64 e salva localmente no banco de dados com segurança.
                          </p>
                        </div>
                      </div>

                      {/* URL Opcional */}
                      <div className="mt-4 border-t border-zinc-800/80 pt-3">
                        <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Ou cole o link direto de uma imagem online:</label>
                        <input
                          type="url"
                          value={empresaFormLogo}
                          onChange={(e) => setEmpresaFormLogo(e.target.value)}
                          className="w-full bg-[#1E1E22] border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 transition-colors"
                          placeholder="Ex: https://meusite.com/images/logo.png"
                        />
                      </div>
                    </div>

                    {/* PIX Configuration Block */}
                    <div className="mt-4 border-t border-zinc-800 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <h4 className="font-bold text-zinc-200 text-sm">Configuração de Pagamento PIX</h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#1A1A1E] p-3 rounded-lg border border-zinc-800/80">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Tipo de Chave PIX</label>
                          <select
                            value={empresaFormPixTipo}
                            onChange={(e) => setEmpresaFormPixTipo(e.target.value as any)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/80 focus:bg-[#1E1E22] transition-colors cursor-pointer"
                          >
                            <option value="CPF">CPF</option>
                            <option value="CNPJ">CNPJ</option>
                            <option value="Email">E-mail</option>
                            <option value="Telefone">Telefone (Celular)</option>
                            <option value="Aleatoria">Chave Aleatória (EVP)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Chave PIX</label>
                          <input
                            type="text"
                            value={empresaFormPixChave}
                            onChange={(e) => setEmpresaFormPixChave(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: 123.456.789-00"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Nome do Recebedor (Titular)</label>
                          <input
                            type="text"
                            value={empresaFormPixNome}
                            onChange={(e) => setEmpresaFormPixNome(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: Joao Silva"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Cidade do Recebedor</label>
                          <input
                            type="text"
                            value={empresaFormPixCidade}
                            onChange={(e) => setEmpresaFormPixCidade(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: Sao Paulo"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2">
                        Deixe a "Chave PIX" em branco para desativar a geração de QR Code no PDV. Ao preencher, os QR Codes gerados enviarão o pagamento diretamente para esta chave, usando o padrão do Banco Central (EMVCo).
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-md font-bold text-xs cursor-pointer shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Alterações
                      </button>
                    </div>
                  </form>
                </div>

                {/* Visualizador de Exemplo de Cupom Fiscal */}
                <div className="w-full lg:w-[350px] bg-[#121214] border border-zinc-800 rounded-xl p-5 flex flex-col" id="preview-cupom-fiscal">
                  <div className="text-xs font-bold text-zinc-400 uppercase mb-4 tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                    <Printer className="w-4 h-4 text-amber-500" />
                    <span>Visualização Impressa</span>
                  </div>

                  <div className="bg-white text-zinc-900 rounded-lg p-5 font-mono text-xs shadow-inner select-none flex-1 flex flex-col justify-between min-h-[380px]" id="paper-preview">
                    <div>
                      {/* Logo header simulation */}
                      <div className="flex flex-col items-center text-center mb-4 border-b border-dashed border-zinc-300 pb-4">
                        {empresaFormLogo ? (
                          <img
                            src={empresaFormLogo}
                            alt="Logo"
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-cover rounded mb-2 border border-zinc-200"
                          />
                        ) : (
                          <div className="w-10 h-10 border border-dashed border-zinc-300 rounded flex items-center justify-center mb-2">
                            <Utensils className="w-5 h-5 text-zinc-400" />
                          </div>
                        )}
                        <h4 className="font-extrabold text-sm uppercase text-zinc-950">{empresaFormNome || 'SUA EMPRESA'}</h4>
                        <p className="text-[10px] text-zinc-600 mt-0.5">CNPJ: {empresaFormCnpj || '00.000.000/0000-00'}</p>
                        <p className="text-[9px] text-zinc-500 leading-normal max-w-[200px] mt-0.5 text-center">
                          {empresaFormEndereco || 'Seu Endereço Completo'}
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">Tel: {empresaFormTelefone || '(00) 00000-0000'}</p>
                      </div>

                      {/* Itens sample */}
                      <div className="space-y-1 mb-4 text-zinc-800">
                        <div className="flex justify-between font-bold text-[10px] text-zinc-500 uppercase border-b border-dashed border-zinc-200 pb-1 mb-1">
                          <span>Item</span>
                          <span>Total</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>1x Chopp Brahma 300ml</span>
                          <span>R$ 9,90</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>1x Prato Feito de Frango</span>
                          <span>R$ 23,90</span>
                        </div>
                      </div>

                      {/* Totais sample */}
                      <div className="border-t border-dashed border-zinc-300 pt-2 space-y-1">
                        <div className="flex justify-between text-xs font-bold text-zinc-950">
                          <span>SUBTOTAL:</span>
                          <span>R$ 33,80</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-zinc-600">
                          <span>FORMA PAGTO:</span>
                          <span>PIX</span>
                        </div>
                      </div>
                    </div>

                    {/* Slogan footer simulation */}
                    <div className="text-center border-t border-dashed border-zinc-300 pt-3 mt-4">
                      <p className="text-[10px] font-bold italic text-zinc-700">
                        "{empresaFormSlogan || 'O melhor sabor da culinária brasileira'}"
                      </p>
                      <p className="text-[8px] text-zinc-400 mt-1 uppercase font-semibold">Obrigado pela preferência!</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. TAB DE CONFIGURAÇÕES DE IMPRESSORAS */}
            {activeTab === 'impressoras' && (
              <div className="flex flex-col lg:flex-row gap-4 animate-fadeIn" id="impressoras-tab-container">
                {/* Form de Cadastro */}
                <div className="flex-1 bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm" id="impressoras-form-card">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/60 pb-2">
                    <Printer className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">Impressoras Térmicas</h3>
                      <p className="text-[11px] text-zinc-400">Configure as impressoras térmicas ESC/POS do estabelecimento para cozinha e caixa.</p>
                    </div>
                  </div>

                  <form onSubmit={salvarPrinterConfigForm} className="space-y-3">
                    
                    {/* Impressora da Cozinha */}
                    <div className="border border-zinc-800/80 rounded-lg p-3 bg-[#1A1A1E] space-y-2">
                      <div className="flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-1.5">
                        <Utensils className="w-3.5 h-3.5 text-amber-500" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wide">Impressora de Preparo (Cozinha)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Endereço IP / Hostname</label>
                          <input
                            type="text"
                            value={printerFormCozinhaIp}
                            onChange={(e) => setPrinterFormCozinhaIp(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: 192.168.1.100"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Porta TCP</label>
                          <input
                            type="number"
                            value={printerFormCozinhaPorta}
                            onChange={(e) => setPrinterFormCozinhaPorta(Number(e.target.value))}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: 9100"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Impressora do Caixa */}
                    <div className="border border-zinc-800/80 rounded-lg p-3 bg-[#1A1A1E] space-y-2">
                      <div className="flex items-center gap-2 text-zinc-200 border-b border-zinc-800 pb-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <h4 className="text-[11px] font-bold uppercase tracking-wide">Impressora do Caixa (Cupons)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Endereço IP / Hostname</label>
                          <input
                            type="text"
                            value={printerFormCaixaIp}
                            onChange={(e) => setPrinterFormCaixaIp(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: 192.168.1.200"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Porta TCP</label>
                          <input
                            type="number"
                            value={printerFormCaixaPorta}
                            onChange={(e) => setPrinterFormCaixaPorta(Number(e.target.value))}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Ex: 9100"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* API de Impressão Remota */}
                    <div className="border border-zinc-800/80 rounded-lg p-3 bg-[#1A1A1E] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4 text-sky-400" />
                          <div>
                            <h4 className="text-[11px] font-bold uppercase tracking-wide text-zinc-200">API de Impressão Remota</h4>
                            <p className="text-[10px] text-zinc-500">Encaminhar payloads de impressão diretamente para um servidor/ponte local.</p>
                          </div>
                        </div>
                        
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={printerFormUsarApiRemota}
                            onChange={(e) => setPrinterFormUsarApiRemota(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-zinc-950"></div>
                        </label>
                      </div>

                      {printerFormUsarApiRemota && (
                        <div className="space-y-3 pt-2 border-t border-zinc-800 animate-slideDown">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">URL do Endereço API Remota</label>
                              <input
                                type="url"
                                value={printerFormApiUrl}
                                onChange={(e) => setPrinterFormApiUrl(e.target.value)}
                                className="w-full bg-[#1E1E22] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-colors"
                                placeholder="Ex: https://meuservidor.com/api/print"
                                required={printerFormUsarApiRemota}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Token / Chave de API (Opcional)</label>
                              <input
                                type="password"
                                value={printerFormApiToken}
                                onChange={(e) => setPrinterFormApiToken(e.target.value)}
                                className="w-full bg-[#1E1E22] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-colors"
                                placeholder="Ex: Bearer Token de Acesso"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Formato do Payload / Protocolo</label>
                            <select
                              value={printerFormTipoImpressora}
                              onChange={(e) => setPrinterFormTipoImpressora(e.target.value as any)}
                              className="w-full bg-[#1E1E22] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 transition-colors cursor-pointer"
                            >
                              <option value="escpos">ESC/POS (Instruções binárias completas para térmicas)</option>
                              <option value="raw">Raw Plain Text (Texto corrido com separadores)</option>
                              <option value="json">JSON Estruturado (Metadados completos)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-md font-bold text-xs cursor-pointer shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Configurações
                      </button>
                    </div>
                  </form>
                </div>

                {/* Painel de Explicações Técnicas */}
                <div className="w-full lg:w-[320px] bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm" id="impressoras-info-panel">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Como funciona a Impressão?</span>
                  </div>

                  <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
                    <p>
                      Como este PDV está rodando em um servidor de nuvem seguro (Cloud Run), ele não consegue acessar diretamente os IPs locais privados (ex: <code className="font-mono bg-zinc-800 px-1 text-amber-400 rounded">192.168.x.x</code>) instalados na sua rede local interna.
                    </p>

                    <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        Opção 1: Ponte API Remota
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Ative a <strong>API de Impressão Remota</strong> para redirecionar os comandos para um servidor público ou bridge local (como PrintNode ou um pequeno script Python rodando no seu estabelecimento) que retransmite o cupom via HTTP para as impressoras locais.
                      </p>
                    </div>

                    <div className="p-3.5 bg-zinc-950 rounded-lg border border-zinc-800 space-y-2">
                      <h4 className="font-bold text-zinc-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                        Opção 2: Conexão Direta Simulada
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        Se a API estiver desativada, o backend disparará simulações de pacotes de dados TCP para os IPs de rede privada cadastrados e disponibilizará o download do cupom formatado para testes de integração local.
                      </p>
                    </div>

                    {/* Botão de Teste Rápido */}
                    <div className="border-t border-zinc-800/80 pt-4 mt-2">
                      <h4 className="font-bold text-zinc-200 mb-2.5">Auto-Teste de Conectividade</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleAbrirSimuladorImpressao(
                            'cozinha',
                            'Mesa Teste #1',
                            [
                              { nome: 'Prato Feito de Frango', quantidade: 1 },
                              { nome: 'Coca-Cola Lata', quantidade: 2 }
                            ],
                            new Date().toISOString()
                          )}
                          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
                        >
                          <Utensils className="w-3.5 h-3.5 text-amber-500" />
                          Testar Cozinha
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAbrirSimuladorImpressao(
                            'cupom',
                            'Caixa Teste #1',
                            [
                              { nome: 'Feijoada Individual', quantidade: 1, precoVenda: 35.90 },
                              { nome: 'Chopp Brahma 300ml', quantidade: 1, precoVenda: 9.90 }
                            ],
                            new Date().toISOString()
                          )}
                          className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 px-3 rounded-lg text-xs font-semibold cursor-pointer border border-zinc-700 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-400" />
                          Testar Caixa
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            )}

            {/* 7. TAB DE CONFIGURAÇÕES FISCAIS (NFC-e) */}
            {activeTab === 'nfce' && (
              <div className="flex flex-col lg:flex-row gap-4 animate-fadeIn" id="nfce-tab-container">
                <div className="flex-1 bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm" id="nfce-form-card">
                  <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/60 pb-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm">Integração Fiscal NFC-e (ACBr)</h3>
                      <p className="text-[11px] text-zinc-400">Configure as credenciais e o certificado para emissão do Cupom Fiscal Eletrônico.</p>
                    </div>
                  </div>

                  <form onSubmit={salvarEmpresaForm} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Ambiente Sefaz</label>
                        <select
                          value={empresaFormNfceAmbiente}
                          onChange={(e) => setEmpresaFormNfceAmbiente(e.target.value as any)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors cursor-pointer"
                        >
                          <option value="homologacao">Homologação (Testes)</option>
                          <option value="producao">Produção (Validade Jurídica)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Estado (UF)</label>
                        <input
                          type="text"
                          maxLength={2}
                          value={empresaFormNfceUf}
                          onChange={(e) => setEmpresaFormNfceUf(e.target.value.toUpperCase())}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors uppercase"
                          placeholder="Ex: SP"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">CNPJ Emissor</label>
                        <input
                          type="text"
                          value={empresaFormNfceCnpj}
                          onChange={(e) => setEmpresaFormNfceCnpj(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="00.000.000/0001-00"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Inscrição Estadual</label>
                        <input
                          type="text"
                          value={empresaFormNfceIe}
                          onChange={(e) => setEmpresaFormNfceIe(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Número IE"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Código de Segurança (CSC)</label>
                        <input
                          type="text"
                          value={empresaFormNfceCsc}
                          onChange={(e) => setEmpresaFormNfceCsc(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Código Alfanumérico"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">ID do CSC</label>
                        <input
                          type="text"
                          value={empresaFormNfceIdCsc}
                          onChange={(e) => setEmpresaFormNfceIdCsc(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: 000001"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">URL Servidor ACBr (REST)</label>
                        <input
                          type="url"
                          value={empresaFormNfceApiUrl}
                          onChange={(e) => setEmpresaFormNfceApiUrl(e.target.value)}
                          className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                          placeholder="Ex: http://localhost:8080"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">Endereço onde o ACBrMonitorPLUS ou API ACBr está escutando.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Certificado A1 (.pfx / .p12)</label>
                          <label className="flex items-center justify-center gap-2 w-full bg-[#1A1A1E] border border-dashed border-zinc-700/80 hover:border-amber-500/80 rounded-md px-3 py-1.5 text-xs text-zinc-400 cursor-pointer transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            {empresaFormNfceCertificadoBase64 ? 'Certificado Carregado' : 'Procurar Certificado'}
                            <input
                              type="file"
                              accept=".pfx,.p12"
                              onChange={handleCertificadoUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-wide">Senha do Certificado</label>
                          <input
                            type="password"
                            value={empresaFormNfceCertificadoSenha}
                            onChange={(e) => setEmpresaFormNfceCertificadoSenha(e.target.value)}
                            className="w-full bg-[#1A1A1E] border border-zinc-700/50 rounded-md px-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500/80 focus:bg-[#1E1E22] transition-colors"
                            placeholder="Senha do PFX"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 mt-3 border-t border-zinc-800/80">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 px-4 py-2 rounded-md font-bold text-xs cursor-pointer shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Salvar Configurações Fiscais
                      </button>
                    </div>
                  </form>
                </div>

                <div className="w-full lg:w-[320px] bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/60 pb-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>Emissão de NFC-e</span>
                  </div>

                  <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
                    <p>
                      Para que a emissão da nota fiscal funcione, é necessário um servidor rodando a <strong>API do ACBr</strong> acessível por esta aplicação.
                    </p>
                    <p>
                      O certificado será carregado e armazenado de forma segura na nuvem, sendo enviado no payload (Base64) durante o comando de emissão ao ACBr.
                    </p>
                    <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg">
                      <strong className="block mb-1">Atenção ao CSC:</strong>
                      Para emissão em ambiente de produção (notas reais), é imprescindível que o Código de Segurança do Contribuinte (CSC) e seu ID estejam corretos, caso contrário as notas serão rejeitadas.
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'sincronizacao' && (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-[#121214] p-4 rounded-lg border border-zinc-800 shadow-sm">
                  <div>
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-amber-500" />
                      Sincronização Global
                    </h2>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Monitore e force a sincronização da infraestrutura em tempo real.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleVerLogs}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1E] hover:bg-zinc-800 border border-zinc-700/50 text-zinc-300 rounded-md font-medium text-xs transition-colors cursor-pointer"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      Ver Logs
                    </button>
                    <button
                      onClick={handleForceSync}
                      disabled={isSyncing}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-md font-bold text-xs shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      Forçar Sincronização
                    </button>
                  </div>
                </div>

                {isSyncing && (
                  <div className="bg-[#121214] border border-amber-500/30 p-4 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <div className="flex justify-between text-xs text-amber-500 font-bold mb-2 uppercase tracking-wide">
                      <span>Sincronizando serviços...</span>
                      <span className="animate-pulse">Processando</span>
                    </div>
                    <div className="w-full bg-zinc-900 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-amber-500 h-2.5 rounded-full relative w-full overflow-hidden transition-all duration-500">
                        <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_1.5s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Supabase Card */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-emerald-500/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-zinc-100 text-[13px]">Banco de Dados (Supabase)</span>
                      </div>
                      {syncStatus?.supabase === 'Sincronizado' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : syncStatus?.supabase === 'Sincronizando' ? (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Sincronização de vendas, produtos, usuários e políticas de segurança RLS.</p>
                    <div className="mt-auto pt-3 border-t border-zinc-800/60">
                      <span className={`text-[10px] font-bold uppercase ${
                        syncStatus?.supabase === 'Sincronizado' ? 'text-emerald-400' : 
                        syncStatus?.supabase === 'Sincronizando' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {syncStatus?.supabase || 'Aguardando'}
                      </span>
                    </div>
                  </div>
                  
                  {/* GitHub Card */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-zinc-500/50 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Github className="w-4 h-4 text-zinc-100 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-zinc-100 text-[13px]">GitHub (Código-Fonte)</span>
                      </div>
                      {syncStatus?.github === 'Sincronizado' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : syncStatus?.github === 'Sincronizando' ? (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Versionamento da branch principal e garantia de ausência de conflitos de merge.</p>
                    <div className="mt-auto pt-3 border-t border-zinc-800/60">
                      <span className={`text-[10px] font-bold uppercase ${
                        syncStatus?.github === 'Sincronizado' ? 'text-emerald-400' : 
                        syncStatus?.github === 'Sincronizando' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {syncStatus?.github || 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* Vercel Card */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-zinc-300/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-zinc-100 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-zinc-100 text-[13px]">Hospedagem (Vercel)</span>
                      </div>
                      {syncStatus?.vercel === 'Sincronizado' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : syncStatus?.vercel === 'Sincronizando' ? (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Servidores edge, funções serverless (APIs) e invalidação de cache global (CDN).</p>
                    <div className="mt-auto pt-3 border-t border-zinc-800/60">
                      <span className={`text-[10px] font-bold uppercase ${
                        syncStatus?.vercel === 'Sincronizado' ? 'text-emerald-400' : 
                        syncStatus?.vercel === 'Sincronizando' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {syncStatus?.vercel || 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* APIs Card */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-blue-500/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-zinc-100 text-[13px]">APIs Integradas</span>
                      </div>
                      {syncStatus?.apis === 'Sincronizado' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : syncStatus?.apis === 'Sincronizando' ? (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Testes de comunicação (ping) entre o Frontend (React), Backend (Express) e serviços externos.</p>
                    <div className="mt-auto pt-3 border-t border-zinc-800/60">
                      <span className={`text-[10px] font-bold uppercase ${
                        syncStatus?.apis === 'Sincronizado' ? 'text-emerald-400' : 
                        syncStatus?.apis === 'Sincronizando' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {syncStatus?.apis || 'Aguardando'}
                      </span>
                    </div>
                  </div>

                  {/* Storage Card */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 flex flex-col gap-2 relative overflow-hidden group hover:border-indigo-500/30 transition-colors shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-bold text-zinc-100 text-[13px]">Armazenamento</span>
                      </div>
                      {syncStatus?.storage === 'Sincronizado' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : syncStatus?.storage === 'Sincronizando' ? (
                        <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">Sincronização de mídias, logotipos, comprovantes em PDF e certificados digitais armazenados.</p>
                    <div className="mt-auto pt-3 border-t border-zinc-800/60">
                      <span className={`text-[10px] font-bold uppercase ${
                        syncStatus?.storage === 'Sincronizado' ? 'text-emerald-400' : 
                        syncStatus?.storage === 'Sincronizando' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {syncStatus?.storage || 'Aguardando'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-6">
                  <p className="text-xs font-mono text-zinc-500">
                    Última verificação de estabilidade: {syncStatus?.ultimaSincronizacao ? new Date(syncStatus.ultimaSincronizacao).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
            )}
            
            {activeTab === 'info' && (
              <div className="max-w-5xl mx-auto space-y-4">
                <div className="bg-[#121214] p-4 rounded-lg border border-zinc-800 shadow-sm">
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2 mb-1">
                    <Info className="w-5 h-5 text-amber-500" />
                    Informações do Sistema
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Visão geral corporativa, infraestrutura, autoria e estatísticas em tempo real.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Card 1: Informações do Sistema */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 border-b border-zinc-800/60 pb-2">
                      <Server className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-zinc-100 text-sm">Sobre o Sistema</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">Nome:</span> <span className="font-medium text-zinc-200">ERP Bar e Restaurante</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Versão Atual:</span> <span className="font-mono text-emerald-400">{systemInfo?.versao || 'Carregando...'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Build:</span> <span className="font-mono text-zinc-300">{systemInfo?.build || '---'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Ambiente:</span> <span className="font-medium text-amber-500">{systemInfo?.ambiente || '---'}</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Status:</span> <span className="flex items-center gap-1 font-bold text-emerald-500"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Online</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Última Atualização:</span> <span className="text-zinc-300 text-xs">{systemInfo?.ultimaAtualizacao ? new Date(systemInfo.ultimaAtualizacao).toLocaleString() : '---'}</span></div>
                    </div>
                  </div>

                  {/* Card 2: Infraestrutura */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 border-b border-zinc-800/60 pb-2">
                      <Database className="w-4 h-4 text-emerald-400" />
                      <h3 className="font-bold text-zinc-100 text-sm">Infraestrutura</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">Banco de Dados:</span> <span className="font-medium text-zinc-200">Supabase (PostgreSQL)</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Frontend:</span> <span className="font-medium text-zinc-200">React + TypeScript</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Backend:</span> <span className="font-medium text-zinc-200">Supabase + Edge Functions</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Hospedagem:</span> <span className="font-medium text-zinc-200">Vercel</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Sincronização:</span> <span className="text-emerald-400 font-bold">{syncStatus?.supabase === 'Sincronizado' ? 'Estável' : 'Pendente'}</span></div>
                    </div>
                  </div>

                  {/* Card 3: Desenvolvedor */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-3 border-b border-zinc-800/60 pb-2">
                      <User className="w-4 h-4 text-indigo-400" />
                      <h3 className="font-bold text-zinc-100 text-sm">Desenvolvedor</h3>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-zinc-500">Nome:</span> <span className="font-medium text-zinc-200">Levi</span></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Contato:</span> <a href="mailto:contato@seuemail.com" className="text-indigo-400 hover:underline">contato@seuemail.com</a></div>
                      <div className="flex justify-between"><span className="text-zinc-500">Website:</span> <a href="#" className="text-indigo-400 hover:underline">www.seusite.com.br</a></div>
                      <div className="flex justify-between"><span className="text-zinc-500">GitHub:</span> <a href="#" className="text-indigo-400 hover:underline">github.com/levi</a></div>
                    </div>
                  </div>

                  {/* Card 4: Estatísticas */}
                  <div className="bg-[#121214] border border-zinc-800 rounded-xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 border-b border-zinc-800/60 pb-3">
                      <Activity className="w-5 h-5 text-rose-400" />
                      <h3 className="font-bold text-zinc-100">Estatísticas</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800/50">
                        <span className="block text-xs text-zinc-500 mb-1">Usuários</span>
                        <span className="text-xl font-bold text-zinc-100">{systemInfo?.usuarios || 0}</span>
                      </div>
                      <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800/50">
                        <span className="block text-xs text-zinc-500 mb-1">Clientes</span>
                        <span className="text-xl font-bold text-zinc-100">{systemInfo?.clientes || 0}</span>
                      </div>
                      <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800/50">
                        <span className="block text-xs text-zinc-500 mb-1">Produtos</span>
                        <span className="text-xl font-bold text-emerald-400">{systemInfo?.produtos || 0}</span>
                      </div>
                      <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800/50">
                        <span className="block text-xs text-zinc-500 mb-1">Vendas</span>
                        <span className="text-xl font-bold text-amber-500">{systemInfo?.vendas || 0}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center text-xs text-zinc-400 border-t border-zinc-800/50 pt-3">
                       <span><strong>Uptime:</strong> {systemInfo?.uptime ? Math.floor(systemInfo.uptime / 3600) + 'h ' + Math.floor((systemInfo.uptime % 3600)/60) + 'm' : '---'}</span>
                       <span><strong>Uso DB:</strong> ~{(systemInfo?.produtos || 0) * 2 + (systemInfo?.vendas || 0) * 5} KB</span>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* 10. ABA DE CAIXA */}
            {activeTab === 'caixa' && (
              <div className="flex-1 flex flex-col gap-5 animate-fadeIn" id="caixa-container">
                {!caixaAtivo ? (
                  <div className="bg-[#121214] border border-zinc-800 rounded-xl p-8 shadow-2xl max-w-2xl mx-auto w-full mt-10">
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-10 h-10 text-amber-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-100">Abertura de Caixa</h2>
                      <p className="text-zinc-400 mt-2">Preencha os dados abaixo para iniciar o expediente</p>
                    </div>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Operador *</label>
                        <input type="text" value={caixaOperadorForm} onChange={e => setCaixaOperadorForm(e.target.value)} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none" placeholder="Nome do operador" />
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Terminal</label>
                          <input type="text" value={caixaTerminalForm} onChange={e => setCaixaTerminalForm(e.target.value)} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Turno</label>
                          <select value={caixaTurnoForm} onChange={e => setCaixaTurnoForm(e.target.value)} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none">
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1">Fundo Inicial (Troco) - R$ *</label>
                        <input type="number" step="0.01" value={caixaFundoForm} onChange={e => setCaixaFundoForm(Number(e.target.value))} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none font-mono text-lg" placeholder="0.00" />
                      </div>
                      
                      <button onClick={abrirCaixa} className="w-full mt-4 py-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg transition-colors text-lg shadow-lg cursor-pointer">
                        Confirmar Abertura
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center bg-[#121214] p-5 rounded-xl border border-zinc-800 shadow-md">
                      <div>
                        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                          <Wallet className="text-amber-500" /> Caixa Aberto
                        </h2>
                        <p className="text-zinc-400 text-sm mt-1">
                          Operador: <span className="text-zinc-200 font-medium">{caixaAtivo.operador}</span> | Terminal: {caixaAtivo.terminal} | Aberto em: {new Date(caixaAtivo.data_abertura).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button onClick={() => setShowSuprimentoModal(true)} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg font-medium border border-emerald-500/30 transition-colors cursor-pointer">
                          + Suprimento
                        </button>
                        <button onClick={() => setShowSangriaModal(true)} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg font-medium border border-rose-500/30 transition-colors cursor-pointer">
                          - Sangria
                        </button>
                        <button onClick={() => setShowFecharCaixaModal(true)} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-bold shadow-lg transition-colors cursor-pointer">
                          Fechar Caixa
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 shadow-md">
                        <span className="text-zinc-400 text-sm block mb-1">Fundo Inicial</span>
                        <span className="text-2xl font-bold text-zinc-100 font-mono">R$ {Number(caixaAtivo.fundo_inicial).toFixed(2)}</span>
                      </div>
                      <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 shadow-md">
                        <span className="text-zinc-400 text-sm block mb-1">Entradas (Suprimentos)</span>
                        <span className="text-2xl font-bold text-emerald-400 font-mono">R$ {caixaMovimentacoes.filter(m=>m.tipo==='Suprimento').reduce((a,b)=>a+Number(b.valor),0).toFixed(2)}</span>
                      </div>
                      <div className="bg-[#121214] p-5 rounded-xl border border-zinc-800 shadow-md">
                        <span className="text-zinc-400 text-sm block mb-1">Saídas (Sangrias)</span>
                        <span className="text-2xl font-bold text-rose-400 font-mono">R$ {caixaMovimentacoes.filter(m=>m.tipo==='Sangria').reduce((a,b)=>a+Number(b.valor),0).toFixed(2)}</span>
                      </div>
                      <div className="bg-[#121214] p-5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        <span className="text-emerald-400 text-sm block mb-1 font-medium">Saldo Atual de Gaveta (Esperado)</span>
                        <span className="text-3xl font-bold text-zinc-100 font-mono">
                          R$ {(
                            Number(caixaAtivo.fundo_inicial) + 
                            caixaMovimentacoes.filter(m=>m.tipo==='Suprimento').reduce((a,b)=>a+Number(b.valor),0) -
                            caixaMovimentacoes.filter(m=>m.tipo==='Sangria').reduce((a,b)=>a+Number(b.valor),0)
                          ).toFixed(2)}
                          <span className="text-xs text-zinc-500 block font-sans mt-1 font-normal">+ Vendas em Dinheiro</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="bg-[#121214] rounded-xl border border-zinc-800 flex-1 flex flex-col overflow-hidden">
                      <div className="p-4 border-b border-zinc-800 bg-[#1A1A1E]">
                        <h3 className="font-bold text-zinc-100">Histórico de Movimentações</h3>
                      </div>
                      <div className="p-0 overflow-y-auto flex-1">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-[#0A0A0B] text-zinc-400 sticky top-0">
                            <tr>
                              <th className="p-3 font-medium">Data/Hora</th>
                              <th className="p-3 font-medium">Tipo</th>
                              <th className="p-3 font-medium">Motivo</th>
                              <th className="p-3 font-medium">Operador</th>
                              <th className="p-3 font-medium text-right">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/50">
                            {caixaMovimentacoes.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-zinc-500">Nenhuma movimentação registrada neste caixa.</td>
                              </tr>
                            ) : (
                              caixaMovimentacoes.map(m => (
                                <tr key={m.id} className="hover:bg-[#1A1A1E] transition-colors">
                                  <td className="p-3 text-zinc-300">{new Date(m.data_hora).toLocaleString()}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${m.tipo === 'Sangria' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                      {m.tipo}
                                    </span>
                                  </td>
                                  <td className="p-3 text-zinc-300">{m.motivo}</td>
                                  <td className="p-3 text-zinc-400">{m.operador}</td>
                                  <td className={`p-3 text-right font-mono font-medium ${m.tipo === 'Sangria' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {m.tipo === 'Sangria' ? '-' : '+'} R$ {Number(m.valor).toFixed(2)}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </main>

      </div>
      {/* MODAL SANGRIA / SUPRIMENTO */}
      {(showSangriaModal || showSuprimentoModal) && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md p-6">
            <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${showSangriaModal ? 'text-rose-400' : 'text-emerald-400'}`}>
              {showSangriaModal ? 'Realizar Sangria' : 'Realizar Suprimento'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Valor (R$)</label>
                <input type="number" step="0.01" value={caixaMovValorForm} onChange={e => setCaixaMovValorForm(Number(e.target.value))} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none font-mono" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Motivo</label>
                <input type="text" value={caixaMovMotivoForm} onChange={e => setCaixaMovMotivoForm(e.target.value)} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none" placeholder="Ex: Pagamento fornecedor, Troco..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowSangriaModal(false); setShowSuprimentoModal(false); }} className="flex-1 px-4 py-3 bg-[#1E1E22] hover:bg-zinc-800 text-zinc-300 rounded-lg font-medium transition-colors cursor-pointer">Cancelar</button>
              <button onClick={() => registrarMovimentacao(showSangriaModal ? 'Sangria' : 'Suprimento')} className={`flex-1 px-4 py-3 text-zinc-950 rounded-lg font-bold transition-colors cursor-pointer ${showSangriaModal ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FECHAR CAIXA */}
      {showFecharCaixaModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-amber-500 mb-4">Fechamento de Caixa</h3>
            <p className="text-zinc-400 text-sm mb-6">Por favor, conte o dinheiro físico da gaveta e insira o valor exato abaixo. O sistema fará a consolidação.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Valor Contado em Gaveta (R$)</label>
                <input type="number" step="0.01" value={caixaValorContadoForm} onChange={e => setCaixaValorContadoForm(Number(e.target.value))} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-4 text-amber-500 text-xl font-bold font-mono focus:border-amber-500 outline-none text-center" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Justificativa (Opcional ou para divergências)</label>
                <textarea value={caixaJustificativaForm} onChange={e => setCaixaJustificativaForm(e.target.value)} className="w-full bg-[#0A0A0B] border border-zinc-800 rounded-lg p-3 text-zinc-100 focus:border-amber-500 outline-none h-20 resize-none" placeholder="Motivo de sobras ou faltas..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowFecharCaixaModal(false)} className="flex-1 px-4 py-3 bg-[#1E1E22] hover:bg-zinc-800 text-zinc-300 rounded-lg font-medium transition-colors cursor-pointer">Cancelar</button>
              <button onClick={fecharCaixa} className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg font-bold transition-colors cursor-pointer">Finalizar Turno</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE LOGS DE SINCRONIZAÇÃO */}
      {showSyncLogsModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-[#0A0A0B] p-5 flex justify-between items-center border-b border-zinc-800">
              <h3 className="font-bold text-lg text-zinc-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                Histórico de Sincronização
              </h3>
              <button onClick={() => setShowSyncLogsModal(false)} className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 bg-[#0A0A0B]">
              {syncLogs.length === 0 ? (
                <div className="text-center text-zinc-500 py-10">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>Nenhum log de sincronização encontrado.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {syncLogs.map((log, index) => (
                    <div key={index} className="bg-[#121214] border border-zinc-800/80 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-zinc-700 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 flex-shrink-0 ${log.resultado === 'Sucesso' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {log.resultado === 'Sucesso' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-zinc-200">{log.resultado}</span>
                            <span className="text-xs text-zinc-500">•</span>
                            <span className="text-xs text-zinc-400">{new Date(log.dataHora).toLocaleString()}</span>
                          </div>
                          <p className="text-xs text-zinc-400 mb-2">{log.detalhes || 'Sem detalhes.'}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {log.servicos?.map((s: string) => (
                              <span key={s} className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-2 border-t border-zinc-800/50 md:border-0 pt-3 md:pt-0 mt-2 md:mt-0">
                        <div className="text-xs text-zinc-500 font-medium">
                          <User className="w-3 h-3 inline mr-1 mb-0.5" />
                          {log.usuario}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                          {log.tempoExecucaoMs}ms
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ABRIR NOVA COMANDA */}
      {showNovaComandaModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="nova-comanda-modal">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-md overflow-hidden">
            <div className="bg-[#0A0A0B] p-4 text-zinc-100 flex justify-between items-center border-b border-zinc-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-500" />
                Abrir Nova Comanda / Mesa
              </h3>
              <button
                onClick={() => setShowNovaComandaModal(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={criarNovaComanda} className="p-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1.5">
                  Número da Mesa ou Nome do Cliente:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mesa 12 ou 'Carlos Balcão'"
                  value={novaComandaIdentificador}
                  onChange={(e) => setNovaComandaIdentificador(e.target.value)}
                  className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100 font-medium"
                  id="comanda-identificador-input"
                  autoFocus
                />
              </div>

              <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
                Ao criar uma comanda, você poderá incluir produtos gradativamente a ela, salvando-os no servidor, para apenas fechá-la e cobrar quando o cliente desejar ir embora.
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowNovaComandaModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CADASTRAR OU EDITAR PRODUTO */}
      {showProdutoModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="cadastro-produto-modal">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-lg overflow-hidden">
            <div className="bg-[#0A0A0B] p-4 text-zinc-100 flex justify-between items-center border-b border-zinc-800">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" />
                {produtoEmEdicao ? 'Editar Produto' : 'Cadastrar Novo Produto'}
              </h3>
              <button
                onClick={() => setShowProdutoModal(false)}
                className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarProdutoForm} className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Nome do Produto:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Coca-Cola Lata 350ml ou Parmegiana de Carne"
                    value={prodFormNome}
                    onChange={(e) => setProdFormNome(e.target.value)}
                    className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100 font-medium"
                    id="form-prod-nome"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Categoria:</label>
                  <select
                    value={prodFormCategoria}
                    onChange={(e) => setProdFormCategoria(e.target.value)}
                    className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100"
                    id="form-prod-categoria"
                  >
                    <option value="Bebidas">Bebidas</option>
                    <option value="Almoço/Pratos">Almoço/Pratos</option>
                    <option value="Sobremesas">Sobremesas</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Controlar Estoque?</label>
                  <div className="flex gap-4 py-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="controlarEstoque"
                        checked={prodFormControlarEstoque}
                        onChange={() => setProdFormControlarEstoque(true)}
                        className="accent-amber-500"
                      />
                      Sim (ex: Bebida)
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 cursor-pointer">
                      <input
                        type="radio"
                        name="controlarEstoque"
                        checked={!prodFormControlarEstoque}
                        onChange={() => setProdFormControlarEstoque(false)}
                        className="accent-amber-500"
                      />
                      Não (ex: Almoço)
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Preço de Custo (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={prodFormPrecoCusto}
                    onChange={(e) => setProdFormPrecoCusto(Number(e.target.value))}
                    className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono"
                    id="form-prod-custo"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1">Preço de Venda (R$):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={prodFormPrecoVenda}
                    onChange={(e) => setProdFormPrecoVenda(Number(e.target.value))}
                    className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-amber-400 font-mono font-bold"
                    id="form-prod-venda"
                  />
                </div>

                 {prodFormControlarEstoque && (
                  <div className="col-span-2 animate-fadeIn bg-amber-500/5 p-3 rounded-lg border border-amber-500/10">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Quantidade em Estoque:</label>
                        <input
                          type="number"
                          min="0"
                          required={prodFormControlarEstoque}
                          value={prodFormEstoque}
                          onChange={(e) => setProdFormEstoque(Number(e.target.value))}
                          className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono"
                          id="form-prod-estoque"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-zinc-400 block mb-1">Estoque Mínimo de Alerta:</label>
                        <input
                          type="number"
                          min="0"
                          required={prodFormControlarEstoque}
                          value={prodFormEstoqueMinimo}
                          onChange={(e) => setProdFormEstoqueMinimo(Number(e.target.value))}
                          className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-sm text-zinc-100 font-mono"
                          id="form-prod-estoque-minimo"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">Este estoque diminuirá a cada venda concluída. Um ícone de alerta aparecerá se o estoque atingir ou for menor que o limite mínimo.</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowProdutoModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-lg cursor-pointer"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: CUPOM FISCAL DE VENDA BEM-SUCEDIDA */}
      {showCupomModal && vendaRecente && (
        <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="cupom-fiscal-modal">
          <div className="bg-[#121214] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-zinc-800 flex flex-col">
            
            {/* Header Cupom */}
            <div className="bg-[#0A0A0B] border-b border-zinc-800 p-4 text-center">
              <CheckCircle className="w-10 h-10 mx-auto text-amber-500 mb-1" />
              <h3 className="font-extrabold text-base text-zinc-100">Venda Concluída!</h3>
              <p className="text-xs text-zinc-400">Cupom Fiscal de Venda Nº {vendaRecente.id}</p>
            </div>

            {/* Corpo do Cupom (Efeito de Papel Impresso) */}
            <div className="p-5 font-mono text-xs text-zinc-300 bg-[#1A1A1D] border-x border-b border-zinc-850 flex-1 flex flex-col gap-3 leading-snug">
              <div className="text-center border-b border-dashed border-zinc-800 pb-2">
                {empresa.logo && (
                  <img
                    src={empresa.logo}
                    alt="Logo"
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 mx-auto object-cover rounded mb-1.5"
                  />
                )}
                <p className="font-bold text-zinc-100 text-sm uppercase">{empresa.nome || 'SABOR GOURMET'}</p>
                {empresa.cnpj && <p className="text-[10px] text-zinc-400">CNPJ: {empresa.cnpj}</p>}
                {empresa.endereco && <p className="text-[10px] text-zinc-400">{empresa.endereco}</p>}
                {empresa.telefone && <p className="text-[10px] text-zinc-400">Tel: {empresa.telefone}</p>}
                <p className="text-zinc-400 mt-1">Data: {new Date(vendaRecente.data).toLocaleString('pt-BR')}</p>
                {vendaRecente.comandaIdentificador && (
                  <p className="font-bold text-amber-400 mt-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 inline-block rounded">
                    Fechamento de: {vendaRecente.comandaIdentificador}
                  </p>
                )}
              </div>

              {/* Itens do Cupom */}
              <div className="border-b border-dashed border-zinc-800 pb-2 flex flex-col gap-1.5">
                <div className="flex justify-between font-bold text-zinc-400 mb-1 text-[10px]">
                  <span>DESCRIÇÃO DOS ITENS</span>
                  <span>TOTAL (R$)</span>
                </div>
                {vendaRecente.itens.map((item, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <span className="pr-2 truncate max-w-[180px] text-zinc-300">
                      {item.quantidade}x {item.nome}
                    </span>
                    <span className="text-zinc-100">{(item.precoVenda * item.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totais do Cupom */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between font-extrabold text-amber-400 text-sm">
                  <span>TOTAL RECOLHIDO:</span>
                  <span>R$ {vendaRecente.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px] mt-1">
                  <span>Forma de Pagamento:</span>
                  <span className="font-bold text-zinc-200">{vendaRecente.formaPagamento}</span>
                </div>
                <div className="flex justify-between text-zinc-400 text-[11px]">
                  <span>Operação:</span>
                  <span className="text-zinc-200">Caixa Principal</span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-zinc-800 pt-3 mt-2">
                {empresa.slogan && (
                  <p className="text-[10px] font-bold italic text-zinc-400 mb-1">"{empresa.slogan}"</p>
                )}
                <p className="font-bold text-zinc-500 uppercase tracking-widest text-[9px]">Obrigado pela preferência!</p>
              </div>
            </div>

            {/* Rodapé Cupom */}
            <div className="p-3 bg-[#0A0A0B] border-t border-zinc-800 flex justify-end gap-2">
              <div className="flex gap-2 w-full flex-wrap justify-end">
                {empresa.nfceConfig?.apiUrl && (
                  <button
                    type="button"
                    onClick={() => handleEmitirNfce(vendaRecente.id)}
                    disabled={vendaRecente.nfce_status === 'AUTORIZADO'}
                    className={`text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors ${
                      vendaRecente.nfce_status === 'AUTORIZADO'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {vendaRecente.nfce_status === 'AUTORIZADO' ? 'NFC-e Emitida' : 'Emitir NFC-e'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAbrirSimuladorImpressao('cupom', vendaRecente.comandaIdentificador || `Venda Direta Nº ${vendaRecente.id}`, vendaRecente.itens, vendaRecente.data, vendaRecente.id)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                  id="btn-imprimir-cupom"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-500" />
                  Imprimir Pedido
                </button>
              </div>
              <button
                onClick={() => setShowCupomModal(false)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
                id="btn-fechar-cupom"
              >
                Concluir & Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: SIMULADOR DE IMPRESSÃO DE PEDIDO */}
      {showImpressaoModal && dadosImpressao && (
        <div className="fixed inset-0 z-50 bg-zinc-950/85 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="simulador-impressao-modal">
          <div className="bg-[#121214] rounded-xl shadow-2xl border border-zinc-800 w-full max-w-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* LADO ESQUERDO: CONFIGURAÇÕES E OPÇÕES DE IMPRESSÃO */}
            <div className="p-5 md:w-1/2 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-zinc-800">
              <div className="flex items-center gap-2 text-zinc-100">
                <Printer className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="font-bold text-sm">Opções de Impressão</h3>
                  <p className="text-[10px] text-zinc-500 font-medium">Configure antes de enviar ao preparo</p>
                </div>
              </div>

              {/* Roteamento de Impressão */}
              {dadosImpressao.tipo === 'cozinha' && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">Enviar preparo para:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['cozinha', 'copa', 'ambas'] as const).map((dest) => (
                      <button
                        key={dest}
                        type="button"
                        onClick={() => setDestinoImpressao(dest)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                          destinoImpressao === dest
                            ? 'bg-amber-500 text-zinc-950 border-amber-500'
                            : 'bg-[#1E1E22] text-zinc-300 border-zinc-800 hover:bg-[#25252A]'
                        }`}
                      >
                        {dest === 'cozinha' ? 'Cozinha 🍳' : dest === 'copa' ? 'Copa/Bar 🍹' : 'Ambos 🍕'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Observação extra para a cozinha */}
              {dadosImpressao.tipo === 'cozinha' && (
                <div className="flex flex-col gap-1.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirObservacao}
                      onChange={(e) => setIncluirObservacao(e.target.checked)}
                      className="accent-amber-500 rounded border-zinc-700"
                    />
                    <span>Incluir observação/aviso urgente?</span>
                  </label>
                  {incluirObservacao && (
                    <textarea
                      placeholder="Ex: Sem cebola, caprichar no molho..."
                      value={observacaoTexto}
                      onChange={(e) => setObservacaoTexto(e.target.value)}
                      maxLength={120}
                      className="w-full bg-[#1E1E22] border border-zinc-800 focus:border-amber-500/50 focus:outline-hidden rounded-lg px-3 py-2 text-xs text-zinc-100 h-20 resize-none font-medium"
                    />
                  )}
                </div>
              )}

              {/* Opcional: Baixar arquivo TXT simulando spooler físico */}
              <div className="bg-[#1E1E22] p-3 rounded-lg border border-zinc-800/80 flex flex-col gap-2">
                <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gerarArquivoTxt}
                    onChange={(e) => setGerarArquivoTxt(e.target.checked)}
                    className="accent-amber-500 mt-0.5 rounded border-zinc-700 shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold">Gerar arquivo físico (.txt)</span>
                    <span className="text-[10px] text-zinc-500 leading-normal">Simula o spooler de impressão de arquivos físicos de balcão e cozinha para integradores.</span>
                  </div>
                </label>
              </div>

              <div className="mt-auto pt-4 border-t border-zinc-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImpressaoModal(false)}
                  disabled={isSimulandoImpressao}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold py-2.5 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                >
                  Não Imprimir / Sair
                </button>
                <button
                  type="button"
                  onClick={executarImpressaoSimulada}
                  disabled={isSimulandoImpressao}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 disabled:text-zinc-950/50 text-zinc-950 text-xs font-extrabold py-2.5 rounded-lg cursor-pointer transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                >
                  {isSimulandoImpressao ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Imprimindo...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirmar Impressão
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* LADO DIREITO: PREVISÃO INTERATIVA DO BILHETE (TERMO-COPIA) */}
            <div className="p-5 md:w-1/2 bg-[#0A0A0B] flex flex-col items-center justify-center min-h-[350px]">
              <span className="text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-widest">Previsão do Bilhete Térmico</span>
              
              {/* Bilhete térmico físico simulado */}
              <div className="w-full max-w-[280px] bg-white text-zinc-900 p-5 font-mono text-[11px] shadow-2xl relative border-t-4 border-dashed border-zinc-400 rounded-b-md select-none">
                
                {/* Efeito de rasgo de papel superior */}
                <div className="absolute top-0 left-0 right-0 h-1 flex justify-between overflow-hidden -mt-1.5">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="w-3 h-3 bg-[#0A0A0B] rotate-45 transform origin-top-left shrink-0"></div>
                  ))}
                </div>

                <div className="text-center border-b border-dashed border-zinc-400 pb-2 mb-2 leading-tight">
                  {empresa.logo && (
                    <img
                      src={empresa.logo}
                      alt="Logo"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 mx-auto object-cover rounded mb-1 border border-zinc-200"
                    />
                  )}
                  <p className="font-extrabold text-xs uppercase">{empresa.nome || 'SABOR GOURMET'}</p>
                  <p className="text-[10px] text-zinc-600">** PREPARO DE PRODUTO **</p>
                  <p className="text-[10px] mt-1 text-zinc-500">Impressora: {destinoImpressao.toUpperCase()}</p>
                </div>

                <div className="flex flex-col gap-1.5 leading-snug">
                  <div className="flex justify-between font-bold border-b border-dashed border-zinc-300 pb-1 mb-1 text-[10px]">
                    <span>DESCRIÇÃO</span>
                    <span>QTD</span>
                  </div>
                  {dadosImpressao.itens.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="pr-1 font-bold text-left break-all">{item.nome}</span>
                      <span className="font-bold shrink-0">{item.quantidade}x</span>
                    </div>
                  ))}
                </div>

                {incluirObservacao && observacaoTexto.trim() && (
                  <div className="mt-3 pt-2 border-t-2 border-dashed border-rose-400 text-rose-700 bg-rose-50 p-1.5 rounded text-[10px] leading-relaxed">
                    <span className="font-bold block">⚠️ OBSERVAÇÃO DE PREPARO:</span>
                    {observacaoTexto.trim()}
                  </div>
                )}

                <div className="mt-4 pt-2 border-t border-dashed border-zinc-400 text-center text-[9px] text-zinc-500 leading-tight">
                  <p className="font-bold">Identificador: {dadosImpressao.identificador}</p>
                  <p className="mt-0.5">Ref: {dadosImpressao.idReferencia ? `#${dadosImpressao.idReferencia}` : 'Sem ID'}</p>
                  <p className="text-[8px] mt-1">{new Date(dadosImpressao.data).toLocaleString('pt-BR')}</p>
                </div>

                {/* Efeito de rasgo de papel inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-1 flex justify-between overflow-hidden mt-1 mb-[-4px]">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="w-3.5 h-3.5 bg-[#0A0A0B] rotate-45 transform origin-bottom-left shrink-0"></div>
                  ))}
                </div>

              </div>
              
              <p className="text-[10px] text-zinc-500 mt-3 text-center max-w-xs leading-relaxed">
                Você pode simular e gerar o arquivo de texto opcionalmente clicando em <strong>Confirmar Impressão</strong>.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PIX */}
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-zinc-800 rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2 text-center">Confirmação de Geração do QR Code PIX</h3>
            <p className="text-sm text-zinc-400 mb-6 text-center">Deseja gerar o QR Code PIX para este pagamento?</p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setGerarPixQR(false);
                  setShowPixModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Não
              </button>
              <button
                onClick={() => {
                  setGerarPixQR(true);
                  setShowPixModal(false);
                }}
                className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-teal-500 text-zinc-950 hover:bg-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-colors cursor-pointer"
              >
                Sim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA: CARRINHO VAZIO PIX */}
      {pixEmptyCartAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#18181B] border border-amber-500/50 rounded-xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <QrCode className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-zinc-100 mb-2 text-center">Atenção</h3>
            <p className="text-sm text-zinc-400 mb-6 text-center">Adicione itens ao carrinho ou informe um valor maior que zero para gerar o QR Code PIX.</p>
            
            <button
              onClick={() => setPixEmptyCartAlert(false)}
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-colors cursor-pointer"
            >
              Entendi
            </button>
          </div>
        </div>
      )}

      {/* Modal de Devolução */}
      {showDevolucaoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col items-center animate-slideUp">
            <div className="w-12 h-12 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 border border-rose-500/20">
              <Undo2 className="w-6 h-6 text-rose-500" />
            </div>
            
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Devolver Venda</h3>
            <p className="text-sm text-zinc-400 text-center mb-6">
              O valor será estornado do caixa de hoje e o estoque dos produtos será restaurado.
            </p>

            <div className="w-full space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  Motivo da Devolução *
                </label>
                <textarea
                  value={motivoDevolucao}
                  onChange={(e) => setMotivoDevolucao(e.target.value)}
                  placeholder="Ex: Cliente desistiu, produto com defeito..."
                  className="w-full bg-[#1A1A1E] border border-zinc-800 rounded-lg p-3 text-zinc-200 text-sm focus:outline-none focus:border-amber-500/50 resize-none h-24"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDevolucaoModal(false)}
                  className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-lg transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarDevolucao}
                  disabled={!motivoDevolucao.trim()}
                  className="flex-1 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-sm"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
