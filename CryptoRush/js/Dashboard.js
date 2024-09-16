// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem('usuarioLogado');

// Se o usuário não estiver logado, redireciona para a página de login
if (!usuarioLogado) {
    window.location.href = 'loginCadastro.html'; // Página de login
}

function validarAplicacao() {
    const valorAplicado = parseFloat(document.getElementById('valor_aplicado').value);

    // Requisição para pegar o saldo atual
    fetch('/get-saldo')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                Swal.fire({
                    title: 'Erro',
                    text: 'Erro ao buscar saldo: ' + data.error,
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            } else {
                const saldo = data.saldo;

                if (isNaN(valorAplicado) || valorAplicado <= 0) {
                    Swal.fire({
                        title: 'Atenção',
                        text: 'Por favor, insira um valor de aplicação válido.',
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else if (valorAplicado > saldo) {
                    Swal.fire({
                        title: 'Saldo insuficiente',
                        text: 'O valor aplicado excede o saldo disponível de R$' + saldo.toFixed(2),
                        icon: 'warning',
                        confirmButtonText: 'OK'
                    });
                } else {
                    Swal.fire({
                        title: 'Sucesso',
                        text: 'Aplicação realizada com sucesso!',
                        icon: 'success',
                        confirmButtonText: 'OK'
                    });
                    // Aqui você pode continuar com a aplicação ou redirecionamento
                }
            }
        })
        .catch(error => {
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao buscar saldo: ' + error,
                icon: 'error',
                confirmButtonText: 'OK'
            });
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const comprarButton = document.querySelector('.verde');
    const venderButton = document.querySelector('.vermelho');
    const historyDiv = document.getElementById('history');

    // Função para adicionar uma transação ao histórico
    function addTransaction(type) {
        const valor = document.getElementById('valor').value;
        const quantidade = document.getElementById('quantidade').value;
        const moeda = document.getElementById('moeda').value;

        // Verifica se todos os campos estão preenchidos
        if (valor === "" || quantidade === "" || moeda === "") {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        // Cria um novo elemento de parágrafo para a transação
        const transaction = document.createElement('p');
        transaction.textContent = `${type}: ${quantidade} de ${moeda} por R$ ${valor}`;

        // Adiciona a transação ao histórico
        historyDiv.appendChild(transaction);
    }

    // Adiciona eventos de clique para os botões de "Comprar" e "Vender"
    comprarButton.addEventListener('click', function () {
        addTransaction("Compra");
    });

    venderButton.addEventListener('click', function () {
        addTransaction("Venda");
    });
});
