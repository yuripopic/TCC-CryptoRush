function ajustarValores() {
    const dificuldade = document.getElementById('dificuldade').value;
    const caixaInicial = document.getElementById('caixa_inicial');
    const assertividadeBot = document.getElementById('assertividade_bot');
            
    if (dificuldade === 'facil') {
        caixaInicial.value = '100.000,00';
        assertividadeBot.value = '30%';
    } else if (dificuldade === 'normal') {
        caixaInicial.value = '50.000,00';
        assertividadeBot.value = '50%';
    } else if (dificuldade === 'dificil') {
        caixaInicial.value = '10.000,00';
        assertividadeBot.value = '90%';
    }
}

function validarCampos() {
    const dificuldade = document.getElementById('dificuldade').value;
    const anoInicio = document.getElementById('ano_inicio').value;
    const caixaInicial = parseFloat(document.getElementById('caixa_inicial').value.replace(/[^\d,-]/g, '').replace(',', '.'));

    // Verifica se todos os campos necessários estão preenchidos corretamente
    if (dificuldade === "" || anoInicio === "" || isNaN(caixaInicial)) {
        Swal.fire({
            title: 'Atenção',
            text: 'Por favor, selecione a Dificuldade, Ano de Início e verifique o Caixa Inicial.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    } else {
        // Salvar o ano selecionado no backend
        fetch('http://127.0.0.1:5000/salvar-ano', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ano: anoInicio })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao salvar o ano:', data.error);
            } else {
                console.log('Ano salvo com sucesso:', data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao salvar o ano:', error);
        });

        // Salvar o dificuldade selecionada no backend
        fetch('http://127.0.0.1:5000/salvar-dificuldade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dificuldade: dificuldade })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Erro ao salvar a dificuldade:', data.error);
            } else {
                console.log('Dificuldade salva com sucesso:', data.message);
            }
        })
        .catch(error => {
            console.error('Erro ao salvar a dificuldade:', error);
        });

        // Salvar o valor do caixa inicial no backend
        fetch('http://127.0.0.1:5000/salvar-saldo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ saldo: caixaInicial })
        })
        .then(() => {
            // Deletar os dados de quantidade.txt e transacoes.csv
            fetch('http://127.0.0.1:5000/limpar-arquivos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Erro ao limpar arquivos:', data.error);
                } else {
                    console.log('Arquivos limpos com sucesso:', data.message);
                }
                // Redireciona para o Dashboard após salvar e limpar arquivos
                //rodarScript();
                window.location.href = 'Dashboard.html';
            })
            .catch(error => {
                console.error('Erro ao limpar arquivos:', error);
            });

            // Salvar o valor 1 no arquivo semana.txt
            fetch('http://127.0.0.1:5000/salvar-semana', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ semana: 1 })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error('Erro ao salvar semana:', data.error);
                } else {
                    console.log('Semana salva com sucesso:', data.message);
                }
            })
            .catch(error => {
                console.error('Erro ao salvar semana:', error);
            });
        });
    }
}

async function rodarScript() {
    // Adiciona a tela de carregamento
    const carregamentoDiv = document.createElement('div');
    carregamentoDiv.id = 'carregamento';
    carregamentoDiv.style.position = 'fixed';
    carregamentoDiv.style.top = '0';
    carregamentoDiv.style.left = '0';
    carregamentoDiv.style.width = '100%';
    carregamentoDiv.style.height = '100%';
    carregamentoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    carregamentoDiv.style.color = 'white';
    carregamentoDiv.style.display = 'flex';
    carregamentoDiv.style.justifyContent = 'center';
    carregamentoDiv.style.alignItems = 'center';
    carregamentoDiv.innerHTML = '<h1>Carregando, por favor aguarde...</h1>';
    document.body.appendChild(carregamentoDiv);

    try {
        // Faz a chamada para o script Python
        const response = await fetch('http://127.0.0.1:5000/executar-previsao', { method: 'POST' });
        const result = await response.json();

        if (result.success) {
            console.log('Script executado com sucesso. Redirecionando...');
            setTimeout(() => {
                //window.location.href = 'Dashboard.html';
            }, 1000); // Pequeno delay para o redirecionamento parecer mais natural
        } else {
            throw new Error(result.message || 'Erro ao executar o script.');
        }
    } catch (error) {
        console.error('Erro:', error);
        Swal.fire('Ocorreu um erro ao iniciar o jogo. Tente novamente.');
    } finally {
        // Remove a tela de carregamento
        document.body.removeChild(carregamentoDiv);
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
        