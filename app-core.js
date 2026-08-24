const BRL = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

  const materiais = [
    { id: 'madeira', nome: 'Madeira', unidade: 'm / peça' },
    { id: 'parafuso', nome: 'Parafuso', unidade: 'unidade' },
    { id: 'verniz', nome: 'Verniz', unidade: 'ml / litro' },
    { id: 'lixa', nome: 'Lixa', unidade: 'folha / unidade' },
    { id: 'cachepo', nome: 'Cachepô', unidade: 'unidade' },
    { id: 'arame', nome: 'Arame', unidade: 'm / rolo' },
    { id: 'rodSilicone', nome: 'Rodinha de silicone ou cristal', unidade: 'unidade' },
    { id: 'rodPlastico', nome: 'Rodinha de plástico', unidade: 'unidade' }
  ];

  const equipamentos = [
    { id: 'serra', nome: 'Serra elétrica' },
    { id: 'furadeira', nome: 'Furadeira' },
    { id: 'lixadeira', nome: 'Lixadeira' },
    { id: 'outroEq', nome: 'Outro equipamento' }
  ];

  function moeda(v) {
    return BRL.format(Number.isFinite(v) ? v : 0);
  }

  function numero(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const v = parseFloat(el.value);
    return Number.isFinite(v) ? v : 0;
  }

  function texto(id, fallback = 'Não informado') {
    const el = document.getElementById(id);
    const v = el ? el.value.trim() : '';
    return v || fallback;
  }

  function formatarData(data) {
    if (!data) return 'Não informada';
    const d = new Date(data + 'T12:00:00');
    return d.toLocaleDateString('pt-BR');
  }

  function arredondarPreco(valor, tipo) {
    if (!Number.isFinite(valor) || valor <= 0) return 0;
    if (tipo === 'none') return valor;

    if (tipo === '9.90') {
      const base = Math.floor(valor / 10) * 10 + 9.90;
      return base >= valor ? base : base + 10;
    }

    const passo = parseFloat(tipo);
    if (!Number.isFinite(passo) || passo <= 0) return valor;
    return Math.ceil(valor / passo) * passo;
  }

  function montarTabelas() {
    const mb = document.getElementById('materiaisBody');

    mb.innerHTML = materiais.map(m => `
      <tr>
        <td><strong>${m.nome}</strong></td>
        <td>${m.unidade}</td>
        <td><input id="${m.id}Qtd" type="number" min="0" step="0.01" value="0" /></td>
        <td><input id="${m.id}Valor" type="number" min="0" step="0.01" value="0" /></td>
        <td class="money" id="${m.id}Total">R$ 0,00</td>
      </tr>
    `).join('');

    const eb = document.getElementById('energiaBody');

    eb.innerHTML = equipamentos.map(e => `
      <tr>
        <td><strong>${e.nome}</strong></td>
        <td><input id="${e.id}W" type="number" min="0" step="1" value="0" /></td>
        <td><input id="${e.id}H" type="number" min="0" step="0.1" value="0" /></td>
        <td><input id="${e.id}M" type="number" min="0" max="59" step="1" value="0" /></td>
        <td class="money" id="${e.id}Custo">R$ 0,00</td>
      </tr>
    `).join('');

    document.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => {
        calcular(false);
        atualizarDocumento(false);
      });

      el.addEventListener('change', () => {
        calcular(false);
        atualizarDocumento(false);
      });
    });
  }

  function calcular(rolar = false) {
    const qtdPecas = Math.max(1, Math.floor(numero('quantidade') || 1));
    const perda = Math.max(0, numero('desperdicio')) / 100;

    let materiaisBase = 0;

    materiais.forEach(m => {
      const total = numero(m.id + 'Qtd') * numero(m.id + 'Valor');
      materiaisBase += total;
      document.getElementById(m.id + 'Total').textContent = moeda(total);
    });

    const materialExtra = numero('extraQtd') * numero('extraValor');
    materiaisBase += materialExtra;

    const materiaisComPerda = materiaisBase * (1 + perda);

    const tarifa = numero('tarifaKwh');
    let energia = 0;

    equipamentos.forEach(e => {
      const watts = numero(e.id + 'W');
      const horas = numero(e.id + 'H') + (numero(e.id + 'M') / 60);
      const custo = (watts / 1000) * horas * tarifa;
      energia += custo;
      document.getElementById(e.id + 'Custo').textContent = moeda(custo);
    });

    energia += numero('energiaExtra');

    const tempoMaoObra = numero('horas') + (numero('minutos') / 60);
    const maoObra = numero('valorHora') * tempoMaoObra;
    const outros = numero('outrosCustos');

    const custoTotalPedido = materiaisComPerda + energia + maoObra + outros;
    const custoUnitario = custoTotalPedido / qtdPecas;

    const percentualFormacao = Math.max(0, numero('lucroPct')) / 100;
    const taxas = Math.max(0, numero('taxasPct')) / 100;

    let erro = '';
    let precoUnitario = 0;

    if (custoTotalPedido <= 0) {
      erro = 'Informe pelo menos um custo para calcular o preço.';
    } else if (taxas >= 1) {
      erro = 'A soma das taxas deve ser menor que 100%.';
    } else {
      const base = custoUnitario * (1 + percentualFormacao);
      precoUnitario = base / (1 - taxas);
      precoUnitario = arredondarPreco(precoUnitario, document.getElementById('arredondar').value);
    }

    const totalPedido = precoUnitario * qtdPecas;

    document.getElementById('erroCalculo').style.display = erro ? 'block' : 'none';
    document.getElementById('erroCalculo').textContent = erro;

    document.getElementById('rMateriais').textContent = moeda(materiaisComPerda / qtdPecas);
    document.getElementById('rEnergia').textContent = moeda(energia / qtdPecas);
    document.getElementById('rMaoObra').textContent = moeda(maoObra / qtdPecas);
    document.getElementById('rOutros').textContent = moeda(outros / qtdPecas);
    document.getElementById('rCusto').textContent = moeda(custoUnitario);
    document.getElementById('rPreco').textContent = moeda(precoUnitario);
    document.getElementById('rPedido').textContent = moeda(totalPedido);

    window.calculoAtual = {
      qtdPecas,
      custoUnitario,
      precoUnitario,
      totalPedido
    };

    atualizarDocumento(false);

    if (rolar && !erro) {
      document.getElementById('resultado').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    return !erro;
  }

  function atualizarDocumento(rolar = false) {
    const c = window.calculoAtual || {
      qtdPecas: 1,
      precoUnitario: 0,
      totalPedido: 0
    };

    const produto = texto('produto', 'Serviço');
    const descricaoFiscal = texto('descricaoFiscal', texto('descricaoInterna', 'Não informada'));

    document.getElementById('dNfseNumero').textContent = texto('nfseNumero');
    document.getElementById('dCompetencia').textContent = formatarData(document.getElementById('competencia').value);

    document.getElementById('dPrestadorNome').textContent = texto('prestadorNome');
    document.getElementById('dPrestadorDoc').textContent = texto('prestadorDoc');
    document.getElementById('dPrestadorIM').textContent = texto('prestadorIM', 'Não informada');
    document.getElementById('dPrestadorRegime').textContent = texto('prestadorRegime');

    const prestCidade = [texto('prestadorMunicipio', ''), texto('prestadorUF', '')].filter(Boolean).join(' / ');
    document.getElementById('dPrestadorCidade').textContent = prestCidade || 'Não informado';
    document.getElementById('dPrestadorEndereco').textContent = texto('prestadorEndereco');

    document.getElementById('dClienteNome').textContent = texto('clienteNome');
    document.getElementById('dClienteDoc').textContent = texto('clienteDoc');

    const cliCidade = [texto('clienteMunicipio', ''), texto('clienteUF', '')].filter(Boolean).join(' / ');
    document.getElementById('dClienteCidade').textContent = cliCidade || 'Não informado';
    document.getElementById('dClienteEndereco').textContent = texto('clienteEndereco');

    const localPrestacao = [texto('municipioPrestacao', ''), texto('ufPrestacao', '')].filter(Boolean).join(' / ');
    document.getElementById('dMunicipioPrestacao').textContent = localPrestacao || 'Não informado';

    document.getElementById('dCodigoTributacao').textContent = texto('codigoTributacao');
    document.getElementById('dNbs').textContent = texto('nbs');
    document.getElementById('dDescricaoFiscal').textContent = descricaoFiscal;

    document.getElementById('dProduto').textContent = produto;
    document.getElementById('dQuantidade').textContent = c.qtdPecas || 1;
    document.getElementById('dValorUnitario').textContent = moeda(c.precoUnitario || 0);
    document.getElementById('dValorTotal').textContent = moeda(c.totalPedido || 0);

    document.getElementById('dIss').textContent = moeda(numero('issValor'));
    document.getElementById('dIbs').textContent = moeda(numero('ibsValor'));
    document.getElementById('dCbs').textContent = moeda(numero('cbsValor'));
    document.getElementById('dPis').textContent = moeda(numero('pisValor'));
    document.getElementById('dCofins').textContent = moeda(numero('cofinsValor'));
    document.getElementById('dInss').textContent = moeda(numero('inssValor'));

    document.getElementById('dNumeroControle').textContent = texto('numeroControle');
    document.getElementById('dCodigoVerificacao').textContent = texto('codigoVerificacao');
    document.getElementById('dChaveAcesso').textContent = texto('chaveAcesso');
    document.getElementById('dTotalFinal').textContent = moeda(c.totalPedido || 0);

    if (rolar) {
      document.getElementById('nfseDocument').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function validarPDF() {
    const faltantes = [];

    if (!document.getElementById('prestadorNome').value.trim()) faltantes.push('Nome do prestador');
    if (!document.getElementById('prestadorDoc').value.trim()) faltantes.push('CPF/CNPJ do prestador');
    if (!document.getElementById('clienteNome').value.trim()) faltantes.push('Nome do cliente');
    if (!document.getElementById('descricaoFiscal').value.trim() && !document.getElementById('descricaoInterna').value.trim()) {
      faltantes.push('Descrição do serviço');
    }
    if (!document.getElementById('competencia').value) faltantes.push('Data de competência');

    const c = window.calculoAtual || {};
    if (!c.totalPedido || c.totalPedido <= 0) faltantes.push('Valor do serviço');

    const box = document.getElementById('erroPDF');

    if (faltantes.length) {
      box.style.display = 'block';
      box.textContent = 'Preencha antes de gerar o PDF: ' + faltantes.join(', ') + '.';
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    box.style.display = 'none';
    box.textContent = '';
    return true;
  }

  function pdfEscape(texto) {
    return String(texto ?? '')
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[\r\n]+/g, ' ');
  }

  function encodeWinAnsi(texto) {
    const mapa = {
      '€': 128, '‚': 130, 'ƒ': 131, '„': 132, '…': 133, '†': 134, '‡': 135,
      'ˆ': 136, '‰': 137, 'Š': 138, '‹': 139, 'Œ': 140, 'Ž': 142,
      '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151,
      '˜': 152, '™': 153, 'š': 154, '›': 155, 'œ': 156, 'ž': 158, 'Ÿ': 159
    };

    const bytes = [];
    for (const ch of texto) {
      const code = ch.charCodeAt(0);
      if (code <= 255) bytes.push(code);
      else if (Object.prototype.hasOwnProperty.call(mapa, ch)) bytes.push(mapa[ch]);
      else bytes.push(63);
    }
    return new Uint8Array(bytes);
  }

  function concatBytes(partes) {
    const total = partes.reduce((s, p) => s + p.length, 0);
    const out = new Uint8Array(total);
    let offset = 0;
    partes.forEach(p => {
      out.set(p, offset);
      offset += p.length;
    });
    return out;
  }

  function quebrarTexto(texto, maxChars = 86) {
    const limpo = String(texto || '').replace(/\s+/g, ' ').trim();
    if (!limpo) return [''];

    const palavras = limpo.split(' ');
    const linhas = [];
    let atual = '';

    palavras.forEach(palavra => {
      const teste = atual ? atual + ' ' + palavra : palavra;
      if (teste.length <= maxChars) {
        atual = teste;
      } else {
        if (atual) linhas.push(atual);
        if (palavra.length <= maxChars) {
          atual = palavra;
        } else {
          let restante = palavra;
          while (restante.length > maxChars) {
            linhas.push(restante.slice(0, maxChars));
            restante = restante.slice(maxChars);
          }
          atual = restante;
        }
      }
    });

    if (atual) linhas.push(atual);
    return linhas.length ? linhas : [''];
  }
