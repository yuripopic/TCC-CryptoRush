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

    // Função para buscar os rendimentos do backend e preencher a tabela
    async function getRendimentos() {
        try {
            const response = await fetch('http://127.0.0.1:5000/get-rendimentos');
            const rendimentos = await response.json();
    
            // Adicionar log para verificar os dados retornados
            console.log('Dados de rendimentos recebidos:', rendimentos);
    
            const tabelaRendimentos = document.querySelector('.rendimentos table');
    
            // Limpa as linhas antigas, exceto o cabeçalho
            tabelaRendimentos.innerHTML = `
                <tr>
                    <th>Moeda</th>
                    <th>Valor aplicado</th>
                    <th>Quantidade</th>
                    <th>Var. Mensal%</th>
                </tr>
            `;
    
            // Garante que rendimentos seja uma array antes de usar forEach
            if (Array.isArray(rendimentos)) {
                rendimentos.forEach(rendimento => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${rendimento.moeda}</td>
                        <td>R$ ${rendimento.valor_aplicado.toFixed(2)}</td>
                        <td>${rendimento.quantidade.toFixed(8)}</td>
                        <td>0.00%</td>
                    `;
                    tabelaRendimentos.appendChild(row);
                });
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

            console.log('Dados de patrimônio recebidos:', data);

            const tabelaPatrimonio = document.querySelector('.patrimonio table');

            // Limpa as linhas antigas, exceto o cabeçalho
            tabelaPatrimonio.innerHTML = `
                <tr>
                    <th>Moeda</th>
                    <th>Percentual sobre o patrimônio total</th>
                </tr>
            `;

            // Adiciona os dados de cada moeda (apenas percentual agora)
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

    // Chama a função ao carregar a página
    getSaldo();
    getPatrimonio()
    getRendimentos();
});
