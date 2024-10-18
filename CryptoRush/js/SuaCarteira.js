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

            // Preenche a tabela com as novas informações
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
        } catch (error) {
            console.error('Erro ao buscar rendimentos:', error);
        }
    }

    // Chama as funções ao carregar a página
    getSaldo();
    getRendimentos();
});
