(async () => {
  const arquivos = ['app-core.js', 'app-pdf.js', 'app-main.js'];

  for (const src of arquivos) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
      document.body.appendChild(script);
    });
  }
})().catch(erro => {
  console.error(erro);
  const box = document.getElementById('erroCalculo');
  if (box) {
    box.style.display = 'block';
    box.textContent = 'Não foi possível carregar a calculadora. Atualize a página e tente novamente.';
  }
});
