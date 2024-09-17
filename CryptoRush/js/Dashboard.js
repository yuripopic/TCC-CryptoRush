
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

document.addEventListener('DOMContentLoaded', async function () {
    const comprarButton = document.querySelector('.verde');
    const venderButton = document.querySelector('.vermelho');
    const historyDiv = document.getElementById('history');

    // Verifica se o usuário está logado ao carregar a página
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    console.log('Valor de usuarioLogado:', usuarioLogado); // Para depuração

    if (usuarioLogado !== 'true') {
        console.log('Usuário não está logado, redirecionando para a página de login...');
        window.location.href = 'LoginCadastro.html'; // Página de login
    }

    // Função para consultar o saldo
    async function getSaldo() {
        return fetch('http://127.0.0.1:5000/get-saldo')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Erro ao buscar saldo:', data.error);
                    return null;
                } else {
                    return data.saldo;
                }
            })
            .catch(error => {
                console.error('Erro ao buscar saldo:', error);
                return null;
            });
    }    

    // Atualizar o campo "Caixa atual" com o saldo
    const saldo = await getSaldo();
    if (saldo !== null) {
        const caixaAtualSpan = document.querySelector('.status span:first-child');
        caixaAtualSpan.textContent = `Caixa atual: R$ ${saldo.toFixed(2)}`;
    }

    // Função para consultar a cotação da criptomoeda
    function getCotacao(moeda) {
        return fetch('/get-cotacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moeda: moeda })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao buscar cotação:', data.error);
                return null;
            } else {
                return data.cotacao;
            }
        })
        .catch(error => {
            console.error('Erro ao buscar cotação:', error);
            return null;
        });
    }

    // Função para calcular a quantidade de criptomoeda que pode ser comprada
    function calcularQuantidade(valorAplicado, cotacao) {
        return valorAplicado / cotacao;
    }

    // Função para validar a compra
    async function validarCompra() {
        const valorAplicado = parseFloat(document.getElementById('valor').value);
        const moedaSelecionada = document.getElementById('moeda').value;

        if (isNaN(valorAplicado) || valorAplicado <= 0) {
            Swal.fire({
                title: 'Atenção',
                text: 'Por favor, insira um valor de aplicação válido.',
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const saldo = await getSaldo();
        const cotacao = await getCotacao(moedaSelecionada);

        if (saldo === null || cotacao === null) {
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao buscar saldo ou cotação.',
                icon: 'error',
                confirmButtonText: 'OK'
            });
            return;
        }

        if (valorAplicado > saldo) {
            Swal.fire({
                title: 'Saldo insuficiente',
                text: `O valor aplicado excede o saldo disponível de R$ ${saldo.toFixed(2)}`,
                icon: 'warning',
                confirmButtonText: 'OK'
            });
            return;
        }

        const quantidade = calcularQuantidade(valorAplicado, cotacao);
        document.getElementById('quantidade').value = quantidade.toFixed(8); // Exibe a quantidade calculada

        Swal.fire({
            title: 'Sucesso',
            text: `Compra realizada! Você comprou ${quantidade.toFixed(8)} de ${moedaSelecionada} por R$ ${valorAplicado.toFixed(2)}`,
            icon: 'success',
            confirmButtonText: 'OK'
        });

        // Atualiza o histórico da transação
        addTransaction('Compra', valorAplicado, quantidade, moedaSelecionada);
    }

    // Função para adicionar uma transação ao histórico
    function addTransaction(type, valor, quantidade, moeda) {
        const transaction = document.createElement('p');
        transaction.textContent = `${type}: ${quantidade.toFixed(8)} de ${moeda} por R$ ${valor.toFixed(2)}`;
        historyDiv.appendChild(transaction);
    }

    // Adiciona evento de clique para o botão "Comprar"
    comprarButton.addEventListener('click', validarCompra);
});


