// Verifica se o usuário está logado
const usuarioLogado = localStorage.getItem('usuarioLogado');

// Se o usuário não estiver logado, redireciona para a página de login
if (!usuarioLogado) {
    window.location.href = 'loginCadastro.html'; // Página de login
}

document.addEventListener("DOMContentLoaded", function () {
    const comprarButton = document.querySelector('.verde');
    const venderButton = document.querySelector('.vermelho');
    const historyDiv = document.getElementById('history');

    // Função para adicionar uma transação ao histórico
    function addTransaction(type) {
        const valor = document.getElementById('valor').value;
        const quantidade = document.getElementById('quantidade').value;
        const moeda = document.getElementById('moeda').value;

        // Verifica se todos os campos estão preenchidos
        if (valor === "" || quantidade === "" || moeda === "") {
            alert("Por favor, preencha todos os campos.");
            return;
        }

        // Cria um novo elemento de parágrafo para a transação
        const transaction = document.createElement('p');
        transaction.textContent = `${type}: ${quantidade} de ${moeda} por R$ ${valor}`;

        // Adiciona a transação ao histórico
        historyDiv.appendChild(transaction);
    }

    // Adiciona eventos de clique para os botões de "Comprar" e "Vender"
    comprarButton.addEventListener('click', function () {
        addTransaction("Compra");
    });

    venderButton.addEventListener('click', function () {
        addTransaction("Venda");
    });
});
