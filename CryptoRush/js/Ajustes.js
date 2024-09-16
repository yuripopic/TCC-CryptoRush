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

function validarCampos() {
    const dificuldade = document.getElementById('dificuldade').value;
    const anoInicio = document.getElementById('ano_inicio').value;
    const caixaInicial = parseFloat(document.getElementById('caixa_inicial').value.replace(/[^\d,-]/g, '').replace(',', '.'));

    if (dificuldade === "" || anoInicio === "" || isNaN(caixaInicial)) {
        Swal.fire({
            title: 'Atenção',
            text: 'Por favor, selecione a Dificuldade, Ano de Início e verifique o Caixa Inicial.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    } else {
        // Enviar o valor do caixa inicial para o backend
        fetch('http://127.0.0.1:5000/salvar-saldo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ saldo: caixaInicial })
        })
        .then(response => {
            // Verificar se a requisição foi bem-sucedida
            if (!response.ok) {
                throw new Error('Erro na requisição ao salvar saldo');
            }
            return response.json();
        })
        .then(data => {
            // Se o saldo foi salvo corretamente, redirecionar para Dashboard.html
            if (data.error) {
                Swal.fire({
                    title: 'Erro',
                    text: 'Erro ao salvar o saldo: ' + data.error,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } else {
                then(() => {
                    // Redirecionar para o Dashboard
                    window.location.href = 'Dashboard.html';
                });
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao salvar o saldo: ' + error,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
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
        