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

async function validarCampos() {
    const dificuldade = document.getElementById('dificuldade').value;
    const anoInicio = document.getElementById('ano_inicio').value;
    const caixaInicial = parseFloat(document.getElementById('caixa_inicial').value.replace(/[^\d,-]/g, '').replace(',', '.'));

    if (dificuldade === "" || anoInicio === "" || isNaN(caixaInicial)) {
        Swal.fire({
            title: 'Atenção',
            text: 'Por favor, selecione a Dificuldade, Ano de Início e verifique o Caixa Inicial.',
            icon: 'warning',
            confirmButtonText: 'OK'
        });
    } else {
        try {
            // Salvar as configurações no backend
            await salvarAno(anoInicio);
            await salvarDificuldade(dificuldade);
            await salvarSaldo(caixaInicial);

            // Limpar arquivos antigos e salvar semana inicial
            await limparArquivos();
            await salvarSemana(1);
            window.location.href = 'Dashboard.html';
            // Executar script Python com carregamento
            //await rodarScript();
        } catch (error) {
            console.error('Erro ao validar campos:', error);
        }
    }
}

// async function rodarScript() {
//     const carregamentoDiv = document.createElement('div');
//     carregamentoDiv.id = 'carregamento';
//     carregamentoDiv.style.position = 'fixed';
//     carregamentoDiv.style.top = 0;
//     carregamentoDiv.style.left = 0;
//     carregamentoDiv.style.width = '100%';
//     carregamentoDiv.style.height = '100%';
//     carregamentoDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
//     carregamentoDiv.style.zIndex = '9999';
//     carregamentoDiv.style.display = 'flex';
//     carregamentoDiv.style.justifyContent = 'center';
//     carregamentoDiv.style.alignItems = 'center';
//     carregamentoDiv.style.flexDirection = 'column';
//     carregamentoDiv.style.color = '#fff';
//     carregamentoDiv.innerHTML = `
//         <h1>Executando previsão...</h1>
//         <p id="contador">Redirecionando em 90 segundos</p>
//     `;
//     document.body.appendChild(carregamentoDiv);

//     // Inicializa o contador regressivo
//     let segundosRestantes = 90;
//     const contadorElement = document.getElementById('contador');
//     const interval = setInterval(() => {
//         segundosRestantes -= 1;
//         contadorElement.textContent = `Redirecionando em ${segundosRestantes} segundos`;
//         if (segundosRestantes <= 0) {
//             clearInterval(interval);
//         }
//     }, 1000);

//     // Faz a chamada para executar o script Python
//     fetch('http://127.0.0.1:5000/executar-previsao', { method: 'POST' })
//         .then(() => {
//             console.log('Script executado com sucesso');
//         })
//         .catch((error) => {
//             console.error('Erro ao executar o script:', error);
//         })
//         .finally(() => {
//             // Aguarda 90 segundos antes de redirecionar
//             setTimeout(() => {
//                 clearInterval(interval); // Para o contador
//                 document.body.removeChild(carregamentoDiv); // Remove a tela de carregamento
//                 window.location.href = 'Dashboard.html'; // Redireciona
//             }, 90000); // 90 segundos de atraso
//         });
// }

async function salvarAno(ano) {
    const response = await fetch('http://127.0.0.1:5000/salvar-ano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ano })
    });
    return response.json();
}

async function salvarDificuldade(dificuldade) {
    const response = await fetch('http://127.0.0.1:5000/salvar-dificuldade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dificuldade })
    });
    return response.json();
}

async function salvarSaldo(saldo) {
    const response = await fetch('http://127.0.0.1:5000/salvar-saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saldo })
    });
    return response.json();
}

async function limparArquivos() {
    const response = await fetch('http://127.0.0.1:5000/limpar-arquivos', { method: 'POST' });
    return response.json();
}

async function salvarSemana(semana) {
    const response = await fetch('http://127.0.0.1:5000/salvar-semana', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semana })
    });
    return response.json();
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
