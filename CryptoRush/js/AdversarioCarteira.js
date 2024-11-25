document.addEventListener("DOMContentLoaded", function() {

    // Função para buscar o saldo do adversário
    async function getSaldoBot() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-saldo-bot');
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao buscar saldo do adversário:', data.error);
            } else {
                const caixaAtualSpan = document.querySelector('.left span');
                caixaAtualSpan.textContent = `Caixa atual: US$ ${parseFloat(data.saldo).toFixed(2)}`;
            }
        } catch (error) {
            console.error('Erro ao buscar saldo do adversário:', error);
        }
    }

    // Função para buscar a semana atual e atualizar o campo de data
    async function getSemana() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-semana');
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao buscar a semana:', data.error);
            } else {
                const dataSpan = document.querySelector('.right span');
                dataSpan.textContent = `Data: Semana ${data.semana}`;
            }
        } catch (error) {
            console.error('Erro ao buscar a semana:', error);
        }
    }

    async function getRendimentosBot() {
        try {
            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos-bot');
            const rendimentos = await rendimentosResponse.json();
            
            const semanaResponse = await fetch('http://127.0.0.1:5000/get-semana');
            const data = await semanaResponse.json();  // Aqui definimos a variável data
    
            const tabelaRendimentos = document.querySelector('.rendimentos table');
    
            // Limpa as linhas antigas, exceto o cabeçalho
            tabelaRendimentos.innerHTML = `
                <tr>
                    <th>Moeda</th>
                    <th>Valor aplicado</th>
                    <th>Quantidade</th>
                    <th>Var. Semanal%</th>
                </tr>
            `;
    
            if (Array.isArray(rendimentos)) {
                for (const rendimento of rendimentos) {
                    const cotacaoResponse = await fetch('http://127.0.0.1:5000/get-cotacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });
    
                    const cotacaoData = await cotacaoResponse.json();
                    const cotacaoAtual = cotacaoData.cotacao;
    
                    const valorAplicadoAtualizado = cotacaoAtual * rendimento.quantidade;
    
                    const variacaoResponse = await fetch('http://127.0.0.1:5000/get-variacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda, semana: data.semana })
                    });
    
                    const variacaoData = await variacaoResponse.json();
                    let variacaoSemanal = variacaoData.variacao_real || "0.00%";
    
                    variacaoSemanal = parseFloat(variacaoSemanal).toFixed(2) + "%";
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${rendimento.moeda}</td>
                        <td>US$ ${valorAplicadoAtualizado.toFixed(2)}</td>
                        <td>${rendimento.quantidade.toFixed(8)}</td>
                        <td>${variacaoSemanal}</td>
                    `;
                    tabelaRendimentos.appendChild(row);
                }
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
            }
        } catch (error) {
            console.error('Erro ao buscar rendimentos do adversário:', error);
        }
    }
    
    async function getPatrimonioBot() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-patrimonio-bot');
            const data = await response.json();
    
            // Verifique se data é um array antes de usar forEach
            if (Array.isArray(data)) {
                const tabelaPatrimonio = document.querySelector('.patrimonio table');
    
                tabelaPatrimonio.innerHTML = `
                    <tr>
                        <th>Moeda</th>
                        <th>Percentual sobre o patrimônio inicial</th>
                    </tr>
                `;
    
                // Calcula o patrimônio total para cálculo de percentuais
                let patrimonioTotal = 0;
                data.forEach(item => {
                    patrimonioTotal += item.valor_investido;
                });
    
                // Preenche a tabela com os dados agrupados por moeda
                data.forEach(item => {
                    const percentual = (item.valor_investido / patrimonioTotal) * 100;
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.moeda}</td>
                        <td>${percentual.toFixed(2)}%</td>
                    `;
                    tabelaPatrimonio.appendChild(row);
                });
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', data);
            }
    
        } catch (error) {
            console.error('Erro ao buscar patrimônio do adversário:', error);
        }
    }   

    async function calcularLucroBot() {
        try {
            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos-bot');
            const rendimentos = await rendimentosResponse.json();
    
            let lucroTotal = 0;
    
            if (Array.isArray(rendimentos)) {
                for (const rendimento of rendimentos) {
                    const lucroResponse = await fetch('http://127.0.0.1:5000/get-lucro-bot', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });
    
                    const lucroData = await lucroResponse.json();
                    const lucro = lucroData.lucro;
    
                    lucroTotal += lucro;
                }
    
                const lucroSpan = document.querySelector('.center span');
                lucroSpan.textContent = `Lucro: US$ ${lucroTotal.toFixed(2)}`;
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
            }
        } catch (error) {
            console.error('Erro ao calcular o lucro do adversário:', error);
        }
    }

    // Chama as funções ao carregar a página
    getSaldoBot();
    getSemana();
    getPatrimonioBot();
    getRendimentosBot();
    calcularLucroBot();
});
