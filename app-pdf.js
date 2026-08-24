function criarPdfNfse(dados) {
  const W = 595.28;
  const H = 841.89;
  const margem = 42;
  const paginas = [];
  let comandos = [];
  let y = H - 42;

  const cmd = s => comandos.push(s);

  function texto(x, yy, tamanho, conteudo, bold = false) {
    cmd(`BT /${bold ? 'F2' : 'F1'} ${tamanho} Tf 1 0 0 1 ${x.toFixed(2)} ${yy.toFixed(2)} Tm (${pdfEscape(conteudo)}) Tj ET`);
  }

  function linha(x1, y1, x2, y2, largura = 0.7) {
    cmd(`${largura} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S`);
  }

  function retangulo(x, yy, w, h, largura = 0.7) {
    cmd(`${largura} w ${x.toFixed(2)} ${yy.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);
  }

  function tituloPagina() {
    texto(margem, H - 38, 10, 'ESPELHO DE CONFERÊNCIA - SEM VALIDADE FISCAL', true);
    linha(margem, H - 45, W - margem, H - 45, 1);
    texto(margem, H - 67, 16, 'NFS-e - Nota Fiscal de Serviço Eletrônica', true);
    texto(margem, H - 84, 9, 'Documento local de conferência. A validade fiscal depende de autorização no ambiente fiscal competente.');
    y = H - 105;
  }

  function novaPagina() {
    if (comandos.length) paginas.push(comandos.join('\n'));
    comandos = [];
    tituloPagina();
  }

  function garantirEspaco(altura) {
    if (y - altura < 48) novaPagina();
  }

  function secao(titulo, linhasConteudo) {
    const linhasTratadas = [];
    linhasConteudo.forEach(item => {
      const prefixo = item.rotulo ? `${item.rotulo}: ` : '';
      const max = item.maxChars || 80;
      quebrarTexto(prefixo + (item.valor || 'Não informado'), max).forEach(l => linhasTratadas.push(l));
    });

    const altura = 23 + linhasTratadas.length * 12 + 7;
    garantirEspaco(altura);

    retangulo(margem, y - altura, W - margem * 2, altura);
    texto(margem + 8, y - 17, 10, titulo.toUpperCase(), true);
    linha(margem, y - 23, W - margem, y - 23, 0.5);

    let yy = y - 35;
    linhasTratadas.forEach(l => {
      texto(margem + 8, yy, 9, l);
      yy -= 12;
    });
    y -= altura + 7;
  }

  function tabelaValores() {
    garantirEspaco(82);
    const x = margem;
    const largura = W - margem * 2;
    const h = 68;
    retangulo(x, y - h, largura, h);
    texto(x + 8, y - 16, 10, 'VALORES DO SERVIÇO', true);
    linha(x, y - 23, x + largura, y - 23, 0.5);

    const col1 = x + 8;
    const col2 = x + 280;
    const col3 = x + 350;
    const col4 = x + 430;

    texto(col1, y - 38, 8, 'Descrição', true);
    texto(col2, y - 38, 8, 'Qtd.', true);
    texto(col3, y - 38, 8, 'Unitário', true);
    texto(col4, y - 38, 8, 'Total', true);

    linha(x + 6, y - 44, x + largura - 6, y - 44, 0.4);

    const desc = quebrarTexto(dados.produto || 'Serviço', 42)[0];
    texto(col1, y - 56, 9, desc);
    texto(col2, y - 56, 9, String(dados.quantidade || 1));
    texto(col3, y - 56, 9, moeda(dados.valorUnitario || 0));
    texto(col4, y - 56, 9, moeda(dados.valorTotal || 0), true);

    y -= h + 7;
  }

  function tributos() {
    garantirEspaco(78);
    const x = margem;
    const largura = W - margem * 2;
    const h = 64;
    retangulo(x, y - h, largura, h);
    texto(x + 8, y - 16, 10, 'TRIBUTOS INFORMADOS', true);
    linha(x, y - 23, x + largura, y - 23, 0.5);

    const itens = [
      ['ISSQN', dados.iss], ['IBS', dados.ibs], ['CBS', dados.cbs],
      ['PIS', dados.pis], ['COFINS', dados.cofins], ['INSS', dados.inss]
    ];

    const larguraCol = largura / 6;
    itens.forEach((item, i) => {
      const xx = x + i * larguraCol;
      if (i > 0) linha(xx, y - 23, xx, y - h, 0.35);
      texto(xx + 5, y - 39, 8, item[0], true);
      texto(xx + 5, y - 53, 8, moeda(item[1] || 0));
    });

    y -= h + 7;
  }

  function totalFinal() {
    garantirEspaco(48);
    const h = 38;
    retangulo(margem, y - h, W - margem * 2, h, 1);
    texto(margem + 10, y - 24, 12, 'VALOR TOTAL DO SERVIÇO', true);
    texto(W - margem - 130, y - 24, 14, moeda(dados.valorTotal || 0), true);
    y -= h + 7;
  }

  tituloPagina();

  secao('Identificação', [
    { rotulo: 'Número da NFS-e', valor: dados.nfseNumero || 'Não informado' },
    { rotulo: 'Competência', valor: dados.competencia || 'Não informada' },
    { rotulo: 'Número de controle', valor: dados.numeroControle || 'Não informado' }
  ]);

  secao('Prestador do serviço', [
    { rotulo: 'Nome / Razão Social', valor: dados.prestadorNome },
    { rotulo: 'CPF / CNPJ', valor: dados.prestadorDoc },
    { rotulo: 'Inscrição Municipal', valor: dados.prestadorIM || 'Não informada' },
    { rotulo: 'Regime tributário', valor: dados.prestadorRegime || 'Não informado' },
    { rotulo: 'Município / UF', valor: dados.prestadorCidade || 'Não informado' },
    { rotulo: 'Endereço', valor: dados.prestadorEndereco || 'Não informado' }
  ]);

  secao('Tomador do serviço', [
    { rotulo: 'Nome / Razão Social', valor: dados.clienteNome },
    { rotulo: 'CPF / CNPJ', valor: dados.clienteDoc },
    { rotulo: 'Município / UF', valor: dados.clienteCidade || 'Não informado' },
    { rotulo: 'Endereço', valor: dados.clienteEndereco || 'Não informado' }
  ]);

  secao('Serviço prestado', [
    { rotulo: 'Município da prestação', valor: dados.localPrestacao || 'Não informado' },
    { rotulo: 'Código de Tributação Nacional', valor: dados.codigoTributacao || 'Não informado' },
    { rotulo: 'NBS', valor: dados.nbs || 'Não informado' },
    { rotulo: 'Descrição', valor: dados.descricaoFiscal || 'Não informada', maxChars: 82 }
  ]);

  tabelaValores();
  tributos();

  secao('Autenticação e conferência', [
    { rotulo: 'Código de verificação', valor: dados.codigoVerificacao || 'Não informado' },
    { rotulo: 'Chave de acesso', valor: dados.chaveAcesso || 'Não informada', maxChars: 76 }
  ]);

  totalFinal();

  garantirEspaco(28);
  texto(margem, y - 12, 8, 'Este arquivo é um espelho local de conferência e não substitui a NFS-e oficialmente autorizada.');

  paginas.push(comandos.join('\n'));

  const objetos = [];
  const fontNormalObj = 3;
  const fontBoldObj = 4;
  let proxObj = 5;
  const pageRefs = [];

  paginas.forEach(stream => {
    const pageObj = proxObj++;
    const contentObj = proxObj++;
    pageRefs.push({ pageObj, contentObj, stream });
  });

  objetos[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objetos[2] = `<< /Type /Pages /Kids [${pageRefs.map(p => `${p.pageObj} 0 R`).join(' ')}] /Count ${pageRefs.length} >>`;
  objetos[fontNormalObj] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objetos[fontBoldObj] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  pageRefs.forEach(p => {
    objetos[p.pageObj] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(2)} ${H.toFixed(2)}] /Resources << /Font << /F1 ${fontNormalObj} 0 R /F2 ${fontBoldObj} 0 R >> >> /Contents ${p.contentObj} 0 R >>`;
    const streamBytes = encodeWinAnsi(p.stream);
    objetos[p.contentObj] = { streamBytes };
  });

  const partes = [];
  partes.push(encodeWinAnsi('%PDF-1.4\n%âãÏÓ\n'));
  const offsets = [0];
  let pos = partes[0].length;

  for (let i = 1; i < objetos.length; i++) {
    offsets[i] = pos;
    let bytesObj;

    if (objetos[i] && objetos[i].streamBytes) {
      const sb = objetos[i].streamBytes;
      const cab = encodeWinAnsi(`${i} 0 obj\n<< /Length ${sb.length} >>\nstream\n`);
      const fim = encodeWinAnsi(`\nendstream\nendobj\n`);
      bytesObj = concatBytes([cab, sb, fim]);
    } else {
      bytesObj = encodeWinAnsi(`${i} 0 obj\n${objetos[i]}\nendobj\n`);
    }

    partes.push(bytesObj);
    pos += bytesObj.length;
  }

  const xrefOffset = pos;
  let xref = `xref\n0 ${objetos.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objetos.length; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  xref += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  partes.push(encodeWinAnsi(xref));

  return concatBytes(partes);
}
