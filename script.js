const SUPABASE_URL = "https://zykdgyvsoimhoxwewtef.supabase.co/";
const SUPABASE_KEY = "sb_publishable_jdtXWf9056kvrKaN7Il0BQ_Acx6QOz-";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const $ = (id) => document.getElementById(id);

// Conteúdos temporários, salvos neste navegador.
const dados = {
  fotos: [],
  eventos: [],
  promocoes: [],
  avisos: []
};

let proximoId = 1;

// Mensagens dos formulários
function mensagem(id, texto, erro = false) {
  const elemento = $(id);
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = erro ? "#b8324b" : "#237650";
}

// Evita inserir texto digitado diretamente como HTML.
function escapar(texto = "") {
  return String(texto).replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

// Salvar e carregar no navegador
function salvarDados() {
  try {
    const copia = {
      ...dados,
      fotos: dados.fotos.map(({ arquivo, ...foto }) => foto)
    };

    localStorage.setItem("estacaoAlegriaADM", JSON.stringify(copia));
  } catch (erro) {
    console.error("Não foi possível salvar os dados:", erro);
  }
}

function carregarDados() {
  try {
    const salvos = localStorage.getItem("estacaoAlegriaADM");
    if (!salvos) return;

    const conteudo = JSON.parse(salvos);

    for (const tipo of Object.keys(dados)) {
      if (Array.isArray(conteudo[tipo])) {
        dados[tipo] = conteudo[tipo];
      }
    }

    proximoId = Math.max(
      1,
      ...Object.values(dados).flat().map(item => Number(item.id) + 1 || 1)
    );
  } catch (erro) {
    console.error("Não foi possível recuperar os dados:", erro);
  }
}

// Formatação de data
function formatarData(data) {
  if (!data) return "";

  const valor = new Date(`${data}T12:00:00`);

  return Number.isNaN(valor.getTime())
    ? data
    : valor.toLocaleDateString("pt-BR");
}

// Atualizar os números do painel
function atualizarContadores() {
  $("total-fotos").textContent = dados.fotos.length;
  $("total-eventos").textContent = dados.eventos.length;
  $("total-promocoes").textContent = dados.promocoes.length;
  $("total-avisos").textContent = dados.avisos.length;
}

// Exibir conteúdo cadastrado
function renderizarLista(tipo, elementoId) {
  const elemento = $(elementoId);
  const itens = dados[tipo];

  if (!itens.length) {
    elemento.innerHTML =
      '<div class="vazio">Nada cadastrado por enquanto.</div>';
    return;
  }

  elemento.innerHTML = itens.map(item => {
    let detalhe = item.descricao || "Cadastrado";

    if (item.data) detalhe = formatarData(item.data);
    if (item.validade) detalhe = `Válida até ${formatarData(item.validade)}`;
    if (item.hora) detalhe += ` • ${escapar(item.hora)}`;

    return `
      <div class="item">
        <div class="item-info">
          <strong>${escapar(item.titulo || "Sem título")}</strong>
          <small>${escapar(detalhe)}</small>
        </div>
        <button
          class="excluir"
          type="button"
          data-tipo="${tipo}"
          data-id="${item.id}">
          Excluir
        </button>
      </div>
    `;
  }).join("");
}

function renderizarTudo() {
  atualizarContadores();

  renderizarLista("fotos", "lista-fotos");
  renderizarLista("eventos", "lista-eventos");
  renderizarLista("promocoes", "lista-promocoes");
  renderizarLista("avisos", "lista-avisos");
}

// Login apenas demonstrativo nesta versão.
// Não protege o painel: ainda não existe autenticação real.
$("form-login").addEventListener("submit", evento => {
  evento.preventDefault();

  const email = $("email").value.trim();
  const senha = $("senha").value;

  if (!email || !senha) {
    mensagem("mensagem-login", "Preencha o e-mail e a senha.", true);
    return;
  }

  $("tela-login").hidden = true;
  $("painel").hidden = false;
  $("btn-sair").hidden = false;

  mensagem("mensagem-login", "");
  renderizarTudo();
});

$("btn-sair").addEventListener("click", () => {
  $("painel").hidden = true;
  $("tela-login").hidden = false;
  $("btn-sair").hidden = true;

  $("senha").value = "";
});

// Prévia da foto selecionada
$("foto-arquivo").addEventListener("change", evento => {
  const arquivo = evento.target.files[0];

  if (!arquivo) return;

  if (!arquivo.type.startsWith("image/")) {
    mensagem("mensagem-foto", "Escolha um arquivo de imagem.", true);
    evento.target.value = "";
    return;
  }

  const imagem = document.createElement("img");
  imagem.alt = "Prévia da foto selecionada";
  imagem.src = URL.createObjectURL(arquivo);

  $("previa-foto").replaceChildren(imagem);
  mensagem("mensagem-foto", "");
});

// Cadastrar foto
$("form-foto").addEventListener("submit", evento => {
  evento.preventDefault();

  const arquivo = $("foto-arquivo").files[0];
  const titulo = $("foto-titulo").value.trim();

  if (!arquivo || !titulo) {
    mensagem("mensagem-foto", "Informe o título e selecione uma foto.", true);
    return;
  }

  // A imagem fica guardada como prévia nesta sessão.
  const url = URL.createObjectURL(arquivo);

  dados.fotos.unshift({
    id: proximoId++,
    titulo,
    url,
    nomeArquivo: arquivo.name,
    arquivo
  });

  salvarDados();
  renderizarTudo();

  evento.currentTarget.reset();
  $("previa-foto").innerHTML =
    "<span>🖼️</span><small>A prévia aparecerá aqui</small>";

  mensagem("mensagem-foto", "Foto adicionada para teste!");
});

// Formulário genérico para eventos, promoções e avisos
function configurarFormulario(formId, tipo, mensagemId, campos) {
  $(formId).addEventListener("submit", evento => {
    evento.preventDefault();

    const registro = {
      id: proximoId++,
      criadoEm: new Date().toISOString()
    };

    for (const [campo, elementoId] of Object.entries(campos)) {
      registro[campo] = $(elementoId).value.trim();
    }

    if (!registro.titulo) {
      mensagem(mensagemId, "Informe um título.", true);
      return;
    }

    dados[tipo].unshift(registro);

    salvarDados();
    renderizarTudo();

    evento.currentTarget.reset();
    mensagem(mensagemId, "Conteúdo adicionado com sucesso!");
  });
}

// Eventos
configurarFormulario(
  "form-evento",
  "eventos",
  "mensagem-evento",
  {
    titulo: "evento-titulo",
    data: "evento-data",
    hora: "evento-hora",
    descricao: "evento-descricao"
  }
);

// Promoções
configurarFormulario(
  "form-promocao",
  "promocoes",
  "mensagem-promocao",
  {
    titulo: "promocao-titulo",
    descricao: "promocao-descricao",
    validade: "promocao-validade"
  }
);

// Avisos
configurarFormulario(
  "form-aviso",
  "avisos",
  "mensagem-aviso",
  {
    titulo: "aviso-titulo",
    descricao: "aviso-descricao"
  }
);

// Excluir conteúdo
document.addEventListener("click", evento => {
  const botao = evento.target.closest("[data-tipo]");
  if (!botao) return;

  const tipo = botao.dataset.tipo;
  const id = Number(botao.dataset.id);

  if (!confirm("Deseja realmente excluir este conteúdo?")) return;

  dados[tipo] = dados[tipo].filter(item => item.id !== id);

  salvarDados();
  renderizarTudo();
});

// Inicialização
carregarDados();
renderizarTudo();
    

