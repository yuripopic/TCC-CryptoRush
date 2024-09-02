// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem('usuarioLogado');

// Se o usuário não estiver logado, redireciona para a página de login
if (!usuarioLogado) {
    window.location.href = 'loginCadastro.html'; // Página de login
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