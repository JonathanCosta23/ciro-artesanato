function coletarDadosPdf() {
  const c = window.calculoAtual || {};
  const prestadorCidade = [texto('prestadorMunicipio', ''), texto('prestadorUF', '')].filter(Boolean).join(' / ');
  const clienteCidade = [texto('clienteMunicipio', ''), texto('clienteUF', '')].filter(Boolean).join(' / ');
  const localPrestacao = [texto('municipioPrestacao', ''), texto('ufPrestacao', '')].filter(Boolean).join(' / ');

  return {
    nfseNumero: texto('nfseNumero', ''),
    competencia: formatarData(document.getElementById('competencia').value),
    numeroControle: texto('numeroControle', ''),
    prestadorNome: texto('prestadorNome', ''),
    prestadorDoc: texto('prestadorDoc', ''),
    prestadorIM: texto('prestadorIM', ''),
    prestadorRegime: texto('prestadorRegime', ''),
    prestadorCidade,
    prestadorEndereco: texto('prestadorEndereco', ''),
    clienteNome: texto('clienteNome', ''),
    clienteDoc: texto('clienteDoc', ''),
    clienteCidade,
    clienteEndereco: texto('clienteEndereco', ''),
    localPrestacao,
    codigoTributacao: texto('codigoTributacao', ''),
    nbs: texto('nbs', ''),
    descricaoFiscal: texto('descricaoFiscal', texto('descricaoInterna', '')),
    produto: texto('produto', 'Serviço'),
    quantidade: c.qtdPecas || 1,
    valorUnitario: c.precoUnitario || 0,
    valorTotal: c.totalPedido || 0,
    iss: numero('issValor'),
    ibs: numero('ibsValor'),
    cbs: numero('cbsValor'),
    pis: numero('pisValor'),
    cofins: numero('cofinsValor'),
    inss: numero('inssValor'),
    codigoVerificacao: texto('codigoVerificacao', ''),
    chaveAcesso: texto('chaveAcesso', '')
  };
}

function gerarPDF() {
  calcular(false);
  atualizarDocumento(false);

  if (!validarPDF()) return;

  try {
    const dados = coletarDadosPdf();
    const pdfBytes = criarPdfNfse(dados);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const numero = document.getElementById('numeroControle').value.trim() || 'documento';

    link.href = url;
    link.download = `NFS-e_conferencia_${numero}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const box = document.getElementById('erroPDF');
    box.style.display = 'block';
    box.style.background = '#eef7f1';
    box.style.borderColor = '#9fc8ae';
    box.style.color = '#245b3d';
    box.textContent = 'PDF gerado com sucesso. O arquivo foi baixado no seu dispositivo.';
  } catch (erro) {
    console.error(erro);
    const box = document.getElementById('erroPDF');
    box.style.display = 'block';
    box.style.background = '#fff1f0';
    box.style.borderColor = '#f2b8b5';
    box.style.color = '#b42318';
    box.textContent = 'Não foi possível gerar o PDF. Use o botão de prévia e tente novamente.';
  }
}

function limparCalculo() {
  document.querySelectorAll('input[type="number"]').forEach(el => {
    if (['quantidade', 'lucroPct'].includes(el.id)) return;
    el.value = '0';
  });

  document.getElementById('quantidade').value = '1';
  document.getElementById('lucroPct').value = '50';
  document.getElementById('arredondar').value = 'none';

  materiais.forEach(m => {
    document.getElementById(m.id + 'Qtd').value = '0';
    document.getElementById(m.id + 'Valor').value = '0';
  });

  equipamentos.forEach(e => {
    document.getElementById(e.id + 'W').value = '0';
    document.getElementById(e.id + 'H').value = '0';
    document.getElementById(e.id + 'M').value = '0';
  });

  calcular(false);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

montarTabelas();

const hoje = new Date().toISOString().slice(0,10);
document.getElementById('competencia').value = hoje;

calcular(false);
atualizarDocumento(false);
