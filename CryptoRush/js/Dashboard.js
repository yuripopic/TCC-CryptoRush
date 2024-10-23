document.addEventListener('DOMContentLoaded', async function () {
    const comprarButton = document.querySelector('.verde');
    const venderButton = document.querySelector('.vermelho');
    const historyDiv = document.getElementById('history');
    const advanceDateButton = document.querySelector('.advance-date');

    let currentWeek = 0;
    const totalWeeks = 10;

    // Dados de exemplo para os investimentos do usuário e do bot
    const userInvestments = [100, 120, 150, 180, 160, 190, 200, 220, 240, 260];
    const botInvestments = [110, 130, 160, 170, 180, 200, 210, 230, 250, 270];

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

    // Função para consultar a semana atual
    async function getSemana() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-semana', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao buscar a semana:', data.error);
            } else {
                console.log('Semana atual:', data.semana);
                const dataSpan = document.querySelector('.status span:nth-child(2)');
                dataSpan.textContent = `Data: ${data.semana} semana`;
            }
        } catch (error) {
            console.error('Erro ao buscar a semana:', error);
        }
    }
    
    // Função para avançar a data
    async function avancarData() {
        try {
            const response = await fetch('http://127.0.0.1:5000/avancar-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao avançar a data:', data.error);
            } else {
                console.log('Data avançada com sucesso:', data.message);
                const dataSpan = document.querySelector('.status span:nth-child(2)');
                dataSpan.textContent = `Data: ${data.semana} semana`;
                updateChart(data.semana);
            }
        } catch (error) {
            console.error('Erro ao avançar a data:', error);
        }
    }

    // Adiciona evento de clique ao botão "Avançar a data"
    advanceDateButton.addEventListener('click', avancarData);

    // Chama a função para carregar a semana quando a página for carregada
    await getSemana();

    // Função para atualizar o saldo no backend
    async function atualizarSaldo(novoSaldo) {
        return fetch('http://127.0.0.1:5000/atualizar-saldo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ novo_saldo: novoSaldo })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao atualizar saldo:', data.error);
            } else {
                console.log('Saldo atualizado com sucesso');
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar saldo:', error);
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
        return fetch('http://127.0.0.1:5000/get-cotacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ moeda: moeda })  // Envia a moeda selecionada
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao buscar cotação:', data.error);
                return null;
            } else {
                return data.cotacao;  // Retorna a cotação
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
        }).then(async (result) => {
            if (result.isConfirmed) { // Verifica se o botão "OK" foi pressionado
                // Adiciona a transação ao histórico após a compra
                addTransaction('Compra', valorAplicado, quantidade, moedaSelecionada);

                // Atualiza o saldo
                const novoSaldo = saldo - valorAplicado;
                await atualizarSaldo(novoSaldo); // Subtrai o valor aplicado e atualiza o saldo

                // Atualiza o campo "Caixa atual" com o novo saldo
                const caixaAtualSpan = document.querySelector('.status span:first-child');
                caixaAtualSpan.textContent = `Caixa atual: R$ ${novoSaldo.toFixed(2)}`;
            }
        });
    }


    // Função para validar a venda de criptomoeda
async function validarVenda() {
    const valorVendido = parseFloat(document.getElementById('valor').value);
    const moedaSelecionada = document.getElementById('moeda').value;

    if (isNaN(valorVendido) || valorVendido <= 0) {
        Swal.fire({
            title: 'Atenção',
            text: 'Por favor, insira um valor válido para vender.',
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

    // Calcula a quantidade que será vendida
    const quantidadeVendida = valorVendido / cotacao;

    // Valida se o usuário possui a quantidade suficiente para a venda
    const quantidadeSuficiente = await validarQuantidade('Venda', quantidadeVendida, moedaSelecionada);
    if (!quantidadeSuficiente) {
        Swal.fire({
            title: 'Quantidade insuficiente',
            text: `Você não possui criptomoedas suficientes para vender ${quantidadeVendida.toFixed(8)} de ${moedaSelecionada}`,
            icon: 'warning',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Atualiza o saldo após a venda
    const novoSaldo = saldo + valorVendido;
    await atualizarSaldo(novoSaldo);

    Swal.fire({
        title: 'Sucesso',
        text: `Venda realizada! Você vendeu ${quantidadeVendida.toFixed(8)} de ${moedaSelecionada} por R$ ${valorVendido.toFixed(2)}`,
        icon: 'success',
        confirmButtonText: 'OK'
    });

    // Atualiza a quantidade de criptomoeda no backend após a venda
    //atualizarQuantidade('Venda', quantidadeVendida, moedaSelecionada);

    // Atualiza o histórico
    addTransaction('Venda', valorVendido, quantidadeVendida, moedaSelecionada);

    // Atualiza o campo "Caixa atual" com o novo saldo
    const caixaAtualSpan = document.querySelector('.status span:first-child');
    caixaAtualSpan.textContent = `Caixa atual: R$ ${novoSaldo.toFixed(2)}`;
}


// Função para validar a quantidade de criptomoeda disponível no backend
async function validarQuantidade(tipo, quantidade, moeda) {
    return fetch('http://127.0.0.1:5000/validar-quantidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo, quantidade: quantidade, moeda: moeda })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Erro ao validar quantidade:', data.error);
            return false;
        } else {
            return true;
        }
    })
    .catch(error => {
        console.error('Erro ao validar quantidade:', error);
        return false;
    });
}


// Função para atualizar a quantidade de criptomoedas no backend
async function atualizarQuantidade(tipo, quantidade, moeda) {
    return fetch('http://127.0.0.1:5000/atualizar-quantidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipo, quantidade: quantidade, moeda: moeda })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            console.error('Erro ao atualizar quantidade:', data.error);
        } else {
            console.log('Quantidade atualizada com sucesso');
        }
    })
    .catch(error => {
        console.error('Erro ao atualizar quantidade:', error);
    });
}

// Adiciona evento de clique para o botão "Vender"
venderButton.addEventListener('click', validarVenda);

    // Função para registrar a transação no backend (CSV)
    async function saveTransaction(type, valor, quantidade, moeda) {
        return fetch('http://127.0.0.1:5000/registrar-transacao', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo: type, valor: valor, quantidade: quantidade, moeda: moeda })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao salvar transação:', data.error);
            } else {
                console.log('Transação registrada com sucesso');
            }
        })
        .catch(error => {
            console.error('Erro ao salvar transação:', error);
        });
    }    

    // Função para carregar as transações do backend (CSV)
    async function loadTransactions() {
        await fetch('http://127.0.0.1:5000/carregar-transacoes')
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Erro ao carregar transações:', data.error);
                } else {
                    // Adiciona as transações ao histórico
                    data.forEach(trans => {
                        const transaction = document.createElement('p');
                        transaction.textContent = `${trans.tipo}: ${trans.quantidade.toFixed(8)} de ${trans.moeda} por R$ ${trans.valor.toFixed(2)}`;
                        historyDiv.appendChild(transaction);
                    });
                }
            })
            .catch(error => {
                console.error('Erro ao carregar transações:', error);
            });
    }    

// Função para registrar a transação no backend e atualizar a quantidade
function addTransaction(type, valor, quantidade, moeda) {
    const transaction = document.createElement('p');
    transaction.textContent = `${type}: ${quantidade.toFixed(8)} de ${moeda} por R$ ${valor.toFixed(2)}`;
    historyDiv.appendChild(transaction);

    // Salva a transação no CSV via backend
    saveTransaction(type, valor, quantidade, moeda);

    // Atualiza a quantidade de criptomoeda no backend
    atualizarQuantidade(type, quantidade, moeda);
}

    
    // Adiciona evento de clique para o botão "Comprar"
    comprarButton.addEventListener('click', validarCompra);

    // Gráfico Chart.js
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'User Performance',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false
            }, {
                label: 'Bot Performance',
                data: [],
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Função para atualizar o gráfico
    async function updateChart() {
        try{
            performanceChart.data.labels.push(`Week ${week + 1}`);
            performanceChart.data.datasets[0].data.push(userInvestments[week]);
            performanceChart.data.datasets[1].data.push(botInvestments[week]);
            performanceChart.update();
        } catch(error){
            console.error("Erro na atualização da semana")
        }
    }

});
