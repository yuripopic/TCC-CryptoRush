document.addEventListener('DOMContentLoaded', async function () {
    const comprarButton = document.querySelector('.verde');
    const venderButton = document.querySelector('.vermelho');
    const historyDiv = document.getElementById('history');

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
                dataSpan.textContent = `Data: Semana ${data.semana}`;
            }
        } catch (error) {
            console.error('Erro ao buscar a semana:', error);
        }
    }    
    
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
            body: JSON.stringify({ moeda: moeda })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao buscar cotação:', data.error);
                return null;
            } else {
                console.log("TESTE COTAÇÃO " + data.cotacao);
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

    Swal.fire({
        title: 'Sucesso',
        text: `Venda realizada! Você vendeu ${quantidadeVendida.toFixed(8)} de ${moedaSelecionada} por R$ ${valorVendido.toFixed(2)}`,
        icon: 'success',
        confirmButtonText: 'OK'
    }).then(async (result) => {
        // Atualiza o saldo após a venda
        const novoSaldo = saldo + valorVendido;
        await atualizarSaldo(novoSaldo);
        if (result.isConfirmed) { // Verifica se o botão "OK" foi pressionado
            // Atualiza a quantidade de criptomoeda no backend após a venda
            //atualizarQuantidade('Venda', quantidadeVendida, moedaSelecionada);

            // Atualiza o histórico
            addTransaction('Venda', valorVendido, quantidadeVendida, moedaSelecionada);

            // Atualiza o campo "Caixa atual" com o novo saldo
            const caixaAtualSpan = document.querySelector('.status span:first-child');
            caixaAtualSpan.textContent = `Caixa atual: R$ ${novoSaldo.toFixed(2)}`;
        }
    });
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

    const performanceChartCtx = document.getElementById('performanceChart').getContext('2d');
    let performanceChart;
    let maxDate; // Data que limita o grafico
    const LIMIT_DATE = new Date(2024, 7, 31); // 31 de agosto de 2024 (data final)
    let currentCrypto = localStorage.getItem('currentCrypto') || 'Bitcoin'; // Armazena a criptomoeda atual selecionada
    let currentChart = localStorage.getItem('currentChart') || 'crypto'; // Define o gráfico atual (crypto ou profit)
    let playerBalances = [];
    let botBalances = [];

    // Função para carregar os saldos iniciais
    async function loadInitialBalances() {
        try {
            // Faz a requisição para obter os lucros acumulados do backend
            const response = await fetch('http://127.0.0.1:5000/get-lucros');
            const data = await response.json();
    
            if (Array.isArray(data)) {
                // Atualiza os arrays com os lucros do jogador e do bot
                playerBalances = data.map(entry => parseFloat(entry['Lucro Jogador']));
                botBalances = data.map(entry => parseFloat(entry['Lucro Bot']));
                weeks = data.map(entry => `Semana ${entry['Semana']}`);
                console.log('Dados de lucros carregados:', data);
    
                // Atualiza o gráfico com os lucros acumulados
                updateProfitChart();
            } else {
                console.error('Dados inesperados recebidos ao carregar lucros:', data);
            }
        } catch (error) {
            console.error('Erro ao carregar os lucros acumulados:', error);
        }
    }                 

    //Carrega a data do arquivo data/ano.txt
    //Função para carregar e definir a data máxima
    // Função para carregar e definir a data máxima
    async function loadMaxDate() {
        try {
            const responseAno = await fetch('data/ano.txt');
            if (!responseAno.ok) {
                throw new Error(`Erro ao carregar o arquivo: ${responseAno.statusText}`);
            }

            const data = await responseAno.text();
            const maxDatePath = 'data/maxDate.txt';

            const responseMaxDate = await fetch(maxDatePath);
            let fileC = null;
            
            if (responseMaxDate.ok) {
                fileC = await responseMaxDate.text();
            }

            if (fileC) {
                maxDate = new Date(fileC.trim()); // Certifique-se de que `fileC` está sendo tratado como uma data
                console.log('Arquivo já possui data:', maxDate);
            } else {
                const year = parseInt(data.trim());
                maxDate = new Date(year - 1, 11, 31); // 31 de dezembro do ano anterior
                console.log('Data máxima carregada:', maxDate);
            }            

            await loadInitialBalances(); // Carrega o saldo inicial do jogador e do bot
            await loadCSV(currentCrypto); // Carrega os dados da criptomoeda atual

        } catch (error) {
            console.error("Erro ao carregar o arquivo:", error);
        }
    }

    // Carrega os dados CSV e filtra com base na data
    function loadCSV(cryptoName) {
        if (!maxDate || isNaN(maxDate.getTime())) {
            console.error("maxDate não está definido ou não é uma data válida.");
            return;
        }
    
        const filePath = `Bases/${cryptoName} Historical Data.csv`;
        console.log('Carregando:', filePath);
    
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                Papa.parse(data, {
                    header: true,
                    complete: function(results) {
                        const filteredData = results.data.filter(row => {
                            const rowDate = new Date(row.Date);
                            return rowDate <= maxDate; // Filtra pela data máxima
                        });
                        const labels = filteredData.map(row => row.Date);
                        const prices = filteredData.map(row => parseFloat(row.Price));
                        createChart(labels, prices, cryptoName);
                    },
                    error: function(error) {
                        console.error("Erro ao fazer parsing do CSV:", error);
                    }
                });
            })
            .catch(error => {
                console.error("Erro ao carregar o arquivo:", error);
            });
    }    

    function createChart(labels, data, cryptoName) {
        try {
            // Destrói o gráfico existente, se houver
            if (performanceChart) {
                performanceChart.destroy();
                performanceChart = null; // Garante que a variável seja redefinida
                console.log('Gráfico anterior destruído.');
            }
    
            performanceChart = new Chart(performanceChartCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `${cryptoName}`,
                        data: data,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false,
                        pointRadius: 0
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Preço (USD)' }
                        },
                        x: {
                            title: { display: true, text: 'Data' }
                        }
                    }
                }
            });
    
            console.log(`Gráfico para ${cryptoName} criado com sucesso.`);
        } catch (error) {
            console.error('Erro ao criar gráfico:', error);
        }
    }        

    // Cria ou atualiza o gráfico de rendimento
    async function updateProfitChart() {
        try {
            // Destrói o gráfico existente, se houver
            if (performanceChart) {
                performanceChart.destroy();
                performanceChart = null;
                console.log('Gráfico anterior destruído.');
            }
    
            // Cria um novo gráfico com os dados acumulados
            performanceChart = new Chart(performanceChartCtx, {
                type: 'line',
                data: {
                    labels: weeks.map(week => `${week}`), // Rótulos das semanas
                    datasets: [
                        {
                            label: 'Rendimento do Jogador',
                            data: playerBalances,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 2,
                            fill: false,
                            pointRadius: 1,
                        },
                        {
                            label: 'Rendimento do Bot',
                            data: botBalances,
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 2,
                            fill: false,
                            pointRadius: 1,
                        }
                    ]
                },
                options: {
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Lucro (USD)' }
                        },
                        x: {
                            title: { display: true, text: 'Semanas' }
                        }
                    }
                }
            });
    
            console.log('Gráfico de rendimento atualizado com sucesso.');
    
        } catch (error) {
            console.error('Erro ao atualizar o gráfico de rendimento:', error);
        }
    }    

    // Função para avançar a data e atualizar o gráfico atual
    async function advanceDate() {
        const newMaxDate = new Date(maxDate);
        newMaxDate.setDate(newMaxDate.getDate() + 7);
    
        // Verifica o limite de data
        if (newMaxDate > LIMIT_DATE) {
            alert("Você chegou ao fim dos dados disponíveis.");
        } else {
            maxDate = newMaxDate;
            console.log('Nova data máxima:', maxDate);
        }
        // Salva a nova data no arquivo `maxDate.txt`
        maxDate = newMaxDate;
        const dataString = new Date(maxDate).toString();
        await fetch('http://127.0.0.1:5000/atualizar-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newMaxDate: dataString})
        });
    
        console.log('Salvando Data:', maxDate);
    
        // Atualiza o gráfico com base na nova data
        if (currentChart === 'crypto') {
            loadCSV(currentCrypto);
        } else {
            updateProfitChart();
        }
        try {
            const response = await fetch('http://127.0.0.1:5000/avancar-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao avançar a data:', data.error);
            } else {
                console.log('Decisão do adversário e avanço de semana:', data.message);
                console.log('Investimentos do adversário:', data.investimentos);
                console.log('Vendas do adversário', data.venda)
                console.log('Nova semana:', data.nova_semana);
            }
            const lucroJogador = await calcularLucro();
            const lucroBot = await calcularLucroBot();
            salvarLucroCSV(data.nova_semana, lucroJogador, lucroBot);
        } catch (error) {
            console.error('Erro ao avançar a data:', error);
        }
    }    

    // Adiciona os eventos de clique aos botões de criptomoeda / rendimento
    // ========================= {BOTÃO BITCOIN} =========================
    document.querySelector('.bitcoin-btn').addEventListener('click', () => {
        currentCrypto = 'Bitcoin';
        localStorage.setItem('currentCrypto', currentCrypto); // Salva no localStorage
        currentChart = 'crypto';
        localStorage.setItem('currentChart', currentChart);  // Salva no localStorage
        loadCSV(currentCrypto);
    });
    // ========================= {BOTÃO ETHEREUM} =========================
    document.querySelector('.ethereum-btn').addEventListener('click', () => {
        currentCrypto = 'Ethereum';
        localStorage.setItem('currentCrypto', currentCrypto); // Salva no localStorage
        currentChart = 'crypto';
        localStorage.setItem('currentChart', currentChart);  // Salva no localStorage
        loadCSV(currentCrypto);
    });
    // =========================== {BOTÃO BNB} ===========================
    document.querySelector('.bnb-btn').addEventListener('click', () => {
        currentCrypto = 'BNB';
        localStorage.setItem('currentCrypto', currentCrypto); // Salva no localStorage
        currentChart = 'crypto';
        localStorage.setItem('currentChart', currentChart);  // Salva no localStorage
        loadCSV(currentCrypto);
    });
    // ========================== {BOTÃO SOLANA} ==========================
    document.querySelector('.solana-btn').addEventListener('click', () => {
        currentCrypto = 'Solana';
        localStorage.setItem('currentCrypto', currentCrypto); // Salva no localStorage
        currentChart = 'crypto';
        localStorage.setItem('currentChart', currentChart);  // Salva no localStorage
        loadCSV(currentCrypto);
    });
    // ======================== {BOTÃO RENDIMENTO} ========================
    document.querySelector('.rendimento').addEventListener('click', () => {
        currentCrypto = null;
        localStorage.setItem('currentCrypto', currentCrypto); // Salva no localStorage
        currentChart = 'profit';
        localStorage.setItem('currentChart', currentChart);  // Salva no localStorage
        updateProfitChart();
    });
    document.querySelector('.advance-date').addEventListener('click', () =>{
        advanceDate();
    });

    // Inicia carregando os dados da data máxima
    loadMaxDate();

    async function calcularLucro() {
        try {
            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos');
            const rendimentos = await rendimentosResponse.json();
    
            let lucroTotal = 0; // Variável para armazenar o lucro total
    
            if (Array.isArray(rendimentos)) {
                for (const rendimento of rendimentos) {
                    const lucroResponse = await fetch('http://127.0.0.1:5000/get-lucro', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });
    
                    const lucroData = await lucroResponse.json();
                    const lucro = lucroData.lucro;
    
                    lucroTotal += lucro; // Soma o lucro da criptomoeda ao total
                }

                // Adiciona o lucro total ao array de rendimentos
                playerBalances.push(lucroTotal);
    
                // Atualizar o valor do lucro total na interface
                const lucroSpan = document.querySelector('#lucro');
                lucroSpan.textContent = `Lucro: R$ ${lucroTotal.toFixed(2)}`;
                
                // Opcional: Retorna o lucro para ser usado em outra função
                return lucroTotal;
    
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
                return 0;
            }
        } catch (error) {
            console.error('Erro ao calcular o lucro:', error);
            return 0;
        }
    }
    
    async function calcularLucroBot() {
        try {
            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos-bot');
            const rendimentos = await rendimentosResponse.json();
    
            let lucroTotalBot = 0;
    
            if (Array.isArray(rendimentos)) {
                for (const rendimento of rendimentos) {
                    const lucroResponse = await fetch('http://127.0.0.1:5000/get-lucro-bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });
    
                    const lucroData = await lucroResponse.json();
                    const lucro = lucroData.lucro;
    
                    lucroTotalBot += lucro;
                }

                // Adiciona o lucro total ao array de rendimentos do bot
                botBalances.push(lucroTotalBot);

                return lucroTotalBot;
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
                return 0;
            }
        } catch (error) {
            console.error('Erro ao calcular o lucro do adversário:', error);
            return 0;
        }
    }

    async function salvarLucroCSV(semana, lucroJogador, lucroBot) {
        try {
            await fetch('http://127.0.0.1:5000/salvar-lucro-csv', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ semana, lucroJogador, lucroBot }),
            });
            console.log("Lucros salvos no CSV com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar os lucros no CSV:", error);
        }
    }

    async function carregarTransacoes() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-transacoes');
            const transacoes = await response.json();
    
            if (Array.isArray(transacoes)) {
                const historyDiv = document.getElementById('history');
                historyDiv.innerHTML = ''; // Limpa o histórico anterior
    
                transacoes.forEach(transacao => {
                    const { tipo, valor, quantidade, moeda } = transacao;
                    const transacaoElement = document.createElement('p');
                    transacaoElement.textContent = `${tipo}: ${quantidade} ${moeda} por R$ ${valor}`;
                    historyDiv.appendChild(transacaoElement);
                });
    
                console.log('Transações carregadas com sucesso.');
            } else {
                console.error('Erro ao carregar transações:', transacoes.error || 'Dados inválidos');
            }
        } catch (error) {
            console.error('Erro ao buscar as transações:', error);
        }
    }
    
    async function verificarAnoEAtualizarSelect() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-ano');
            if (!response.ok) {
                throw new Error("Erro ao carregar o ano.");
            }
            const data = await response.json();
            const ano = data.ano;
    
            if (ano === 2020 || ano === 2021) {
                const solanaOption = document.querySelector('select#moeda option[value="Solana"]');
                if (solanaOption) {
                    solanaOption.style.display = 'none'; // Ocultar a opção
                }
                const solanaButton = document.querySelector('button.solana-btn');
                if (solanaButton) {
                    solanaButton.style.display = 'none'; // Ocultar o botão
                }
            }
        } catch (error) {
            console.error("Erro ao verificar o ano:", error);
        }
    }

    calcularLucro();
    calcularLucroBot();
    carregarTransacoes();
    verificarAnoEAtualizarSelect();

});
