document.addEventListener("DOMContentLoaded", function() {

    // Função para buscar o saldo do backend
    async function getSaldo() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-saldo');
            const data = await response.json();
            if (data.error) {
                console.error('Erro ao buscar saldo:', data.error);
            } else {
                const caixaAtualSpan = document.querySelector('.left span');
                caixaAtualSpan.textContent = `Caixa atual: R$ ${parseFloat(data.saldo).toFixed(2)}`;
            }
        } catch (error) {
            console.error('Erro ao buscar saldo:', error);
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

    // Função para buscar os rendimentos do backend e preencher a tabela
    async function getRendimentos() {
        try {
            // Obtém a semana atual do backend
            const semanaResponse = await fetch('http://127.0.0.1:5000/get-semana');
            const semanaData = await semanaResponse.json();
            const semana = semanaData.semana;

            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos');
            const rendimentos = await rendimentosResponse.json();
        
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
                    // Faz a requisição ao backend para obter a variação semanal e a nova cotação da moeda
                    const cotacaoResponse = await fetch('http://127.0.0.1:5000/get-cotacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });

                    const cotacaoData = await cotacaoResponse.json();
                    const cotacaoAtual = cotacaoData.cotacao;  // Nova cotação da criptomoeda

                    // Recalcula o valor aplicado com base na nova cotação
                    const valorAplicadoAtualizado = cotacaoAtual * rendimento.quantidade;

                    // Faz a requisição ao backend para obter a variação semanal da moeda
                    const variacaoResponse = await fetch('http://127.0.0.1:5000/get-variacao', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda, semana: semana })
                    });

                    const variacaoData = await variacaoResponse.json();
                    let variacaoSemanal = variacaoData.variacao_real || "0.00%";

                    // Formatar o valor percentual com 2 casas decimais
                    variacaoSemanal = parseFloat(variacaoSemanal).toFixed(2) + "%";

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${rendimento.moeda}</td>
                        <td>R$ ${valorAplicadoAtualizado.toFixed(2)}</td>
                        <td>${rendimento.quantidade.toFixed(8)}</td>
                        <td>${variacaoSemanal}</td>
                    `;
                    tabelaRendimentos.appendChild(row);
                }
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
            }
        } catch (error) {
            console.error('Erro ao buscar rendimentos:', error);
        }
    }

    // Função para buscar o patrimônio do backend e preencher a tabela
    async function getPatrimonio() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-patrimonio');
            const data = await response.json();

            const tabelaPatrimonio = document.querySelector('.patrimonio table');

            // Limpa as linhas antigas, exceto o cabeçalho
            tabelaPatrimonio.innerHTML = `
                <tr>
                    <th>Moeda</th>
                    <th>Percentual sobre o patrimônio inicial</th>
                </tr>
            `;

            data.patrimonio.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.moeda}</td>
                    <td>${item.percentual.toFixed(2)}%</td>
                `;
                tabelaPatrimonio.appendChild(row);
            });

        } catch (error) {
            console.error('Erro ao buscar patrimônio:', error);
        }
    }

    async function calcularLucro() {
        try {
            const rendimentosResponse = await fetch('http://127.0.0.1:5000/get-rendimentos');
            const rendimentos = await rendimentosResponse.json();
    
            let lucroTotal = 0;  // Variável para armazenar o lucro total
    
            if (Array.isArray(rendimentos)) {
                for (const rendimento of rendimentos) {
                    // Requisição para calcular o lucro da criptomoeda
                    const lucroResponse = await fetch('http://127.0.0.1:5000/get-lucro', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ moeda: rendimento.moeda })
                    });
    
                    const lucroData = await lucroResponse.json();
                    const lucro = lucroData.lucro;
    
                    // Somar o lucro da criptomoeda ao lucro total
                    lucroTotal += lucro;
                }
    
                // Atualizar o valor do lucro total na interface
                const lucroSpan = document.querySelector('.center span');
                lucroSpan.textContent = `Lucro: R$ ${lucroTotal.toFixed(2)}`;
            } else {
                console.error('Dados inesperados recebidos (não é uma array):', rendimentos);
            }
        } catch (error) {
            console.error('Erro ao calcular o lucro:', error);
        }
    }

    // Chama as funções ao carregar a página
    getSaldo();
    getSemana();  // Busca e atualiza a semana
    getPatrimonio();
    getRendimentos();
    calcularLucro();
});