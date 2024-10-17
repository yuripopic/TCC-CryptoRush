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

    // Função para atualizar a quantidade ao preencher o valor aplicado
    async function atualizarQuantidade() {
        const valorAplicado = parseFloat(document.getElementById('valor').value);
        const moedaSelecionada = document.getElementById('moeda').value;

        if (!isNaN(valorAplicado) && valorAplicado > 0) {
            const cotacao = await getCotacao(moedaSelecionada); // Supondo que esta função obtenha a cotação da moeda selecionada

            if (cotacao) {
                const quantidade = calcularQuantidade(valorAplicado, cotacao);
                document.getElementById('quantidade').value = quantidade.toFixed(8); // Atualiza o campo de quantidade
            }
        } else {
            document.getElementById('quantidade').value = ''; // Limpa o campo se o valor aplicado for inválido
        }
    }

    // Adiciona o evento input ao campo de valor aplicado
    document.getElementById('valor').addEventListener('input', atualizarQuantidade);
    document.getElementById('moeda').addEventListener('change', atualizarQuantidade); // Atualiza a quantidade ao selecionar uma moeda

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
        
        // Adiciona a transação ao histórico após a compra
        addTransaction('Compra', valorAplicado, quantidade, moedaSelecionada);
        
        // // Atualiza o saldo
        // const novoSaldo = saldo - valorAplicado;
        // await atualizarSaldo(novoSaldo); // Subtrai o valor aplicado e atualiza o saldo

        // Atualiza o campo "Caixa atual" com o novo saldo
        const caixaAtualSpan = document.querySelector('.status span:first-child');
        caixaAtualSpan.textContent = `Caixa atual: R$ ${novoSaldo.toFixed(2)}`;
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
