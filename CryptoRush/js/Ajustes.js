// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem('usuarioLogado');

// Se o usuário não estiver logado, redireciona para a página de login
if (!usuarioLogado) {
    window.location.href = 'loginCadastro.html'; // Página de login
}

function ajustarValores() {
    const dificuldade = document.getElementById('dificuldade').value;
    const caixaInicial = document.getElementById('caixa_inicial');
    const assertividadeBot = document.getElementById('assertividade_bot');
            
    if (dificuldade === 'facil') {
        caixaInicial.value = '100.000,00';
        assertividadeBot.value = '20%';
    } else if (dificuldade === 'normal') {
        caixaInicial.value = '50.000,00';
        assertividadeBot.value = '50%';
    } else if (dificuldade === 'dificil') {
        caixaInicial.value = '3.000,00';
        assertividadeBot.value = '80%';
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const sairBtn = document.querySelector(".sair");
        
    sairBtn.addEventListener("click", function() {

        Swal.fire({
            title: 'Tem certeza que deseja sair?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'LoginCadastro.html';
            }
        });
    });
});
        