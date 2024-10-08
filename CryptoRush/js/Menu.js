
function fazerLogout() {
    Swal.fire({
        title: 'Você tem certeza que deseja sair?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Se o usuário confirmar, remove o indicador de sessão ativa
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioEmail');

            // Redireciona para a página de login
            window.location.href = 'loginCadastro.html';
        } 
    });
}
