(() => {
  const resultado = document.getElementById('resultado');
  const linhaPedido = document.getElementById('rPedido')?.closest('.result-row');

  if (!resultado || !linhaPedido) return;

  const estilo = document.createElement('style');
  estilo.textContent = `
    .gain-panel {
      margin-top: 18px;
      padding: 18px;
      border: 2px solid #9fc8ae;
      border-radius: 16px;
      background: #ffffff;
    }

    .gain-panel h3 {
      margin: 0 0 10px;
      font-size: 22px;
      color: #245b3d;
    }

    .gain-panel .gain-explanation {
      margin: 0 0 12px;
      color: #667085;
      font-size: 15px;
    }

    .gain-panel .gain-highlight {
      margin-top: 14px;
      padding: 18px;
      border-radius: 14px;
      background: #245b3d;
      color: #ffffff;
      text-align: center;
    }

    .gain-panel .gain-highlight span {
      display: block;
      font-size: 16px;
      font-weight: 800;
    }

    .gain-panel .gain-highlight strong {
      display: block;
      margin-top: 4px;
      font-size: clamp(34px, 7vw, 48px);
      line-height: 1.1;
    }

    .gain-panel .gain-positive { color: #166534; }
    .gain-panel .gain-negative { color: #b42318; }

    @media (max-width: 760px) {
      .gain-panel { padding: 15px; }
      .gain-panel h3 { font-size: 20px; }
    }
  `;
  document.head.appendChild(estilo);

  const painel = document.createElement('div');
  painel.className = 'gain-panel';
  painel.innerHTML = `
    <h3>Quanto realmente sobra para você</h3>
    <p class="gain-explanation">
      Este quadro é interno. Ele desconta o custo do produto, da produção e as taxas da venda para mostrar quanto sobra do pedido.
    </p>

    <div class="result-row">
      <span>Custo total do pedido</span>
      <strong id="rCustoPedido">R$ 0,00</strong>
    </div>

    <div class="result-row">
      <span>Ganho após custos de produção</span>
      <strong id="rGanhoBruto">R$ 0,00</strong>
    </div>

    <div class="result-row">
      <span>Taxas estimadas da venda</span>
      <strong id="rTaxasVenda">R$ 0,00</strong>
    </div>

    <div class="result-row">
      <span>Ganho líquido por peça</span>
      <strong id="rGanhoPeca">R$ 0,00</strong>
    </div>

    <div class="result-row">
      <span>Percentual líquido sobre a venda</span>
      <strong id="rMargemLiquida">0%</strong>
    </div>

    <div class="gain-highlight">
      <span>GANHO LÍQUIDO ESTIMADO DO PEDIDO</span>
      <strong id="rGanhoLiquido">R$ 0,00</strong>
    </div>
  `;

  linhaPedido.insertAdjacentElement('afterend', painel);

  function atualizarGanho() {
    const calculo = window.calculoAtual || {};
    const quantidade = Math.max(1, Number(calculo.qtdPecas) || 1);
    const custoUnitario = Number(calculo.custoUnitario) || 0;
    const totalVenda = Number(calculo.totalPedido) || 0;
    const custoTotalPedido = custoUnitario * quantidade;
    const percentualTaxas = Math.max(0, numero('taxasPct')) / 100;
    const taxasVenda = totalVenda * percentualTaxas;
    const ganhoBruto = totalVenda - custoTotalPedido;
    const ganhoLiquido = ganhoBruto - taxasVenda;
    const ganhoPorPeca = ganhoLiquido / quantidade;
    const margemLiquida = totalVenda > 0 ? (ganhoLiquido / totalVenda) * 100 : 0;

    document.getElementById('rCustoPedido').textContent = moeda(custoTotalPedido);
    document.getElementById('rGanhoBruto').textContent = moeda(ganhoBruto);
    document.getElementById('rTaxasVenda').textContent = moeda(taxasVenda);
    document.getElementById('rGanhoPeca').textContent = moeda(ganhoPorPeca);
    document.getElementById('rMargemLiquida').textContent = `${margemLiquida.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

    const ganhoEl = document.getElementById('rGanhoLiquido');
    ganhoEl.textContent = moeda(ganhoLiquido);

    const classe = ganhoLiquido < 0 ? 'gain-negative' : 'gain-positive';
    ['rGanhoBruto', 'rGanhoPeca', 'rMargemLiquida'].forEach(id => {
      const el = document.getElementById(id);
      el.classList.remove('gain-positive', 'gain-negative');
      el.classList.add(classe);
    });
  }

  const calcularOriginal = window.calcular;

  if (typeof calcularOriginal === 'function') {
    window.calcular = function (...args) {
      const retorno = calcularOriginal.apply(this, args);
      atualizarGanho();
      return retorno;
    };
  }

  atualizarGanho();
})();
