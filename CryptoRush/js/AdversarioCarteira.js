// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem('usuarioLogado');

// Se o usuário não estiver logado, redireciona para a página de login
if (!usuarioLogado) {
    window.location.href = 'loginCadastro.html'; // Página de login
}