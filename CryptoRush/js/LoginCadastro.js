// Função para carregar as contas do localStorage
function carregarContas() {
    const contasSalvas = localStorage.getItem('contas');
    return contasSalvas ? JSON.parse(contasSalvas) : [];
}

// Função para salvar as contas no localStorage
function salvarContas(contas) {
    localStorage.setItem('contas', JSON.stringify(contas));
}

// Carrega as contas ao iniciar a aplicação
let contas = carregarContas();

// Função para exibir notificação de sucesso ou erros
function exibirNotificacao() {
    const nome = document.getElementById('cadastro-nome').value.trim();
    const email = document.getElementById('cadastro-email').value.trim();
    const senha = document.getElementById('cadastro-senha').value.trim();
    const confirmarSenha = document.getElementById('cadastro-confirmar-senha').value.trim();
    const telefone = document.getElementById('cadastro-telefone').value.trim();
    const dataNascimento = document.getElementById('cadastro-data-nascimento').value.trim();

    // Verifica se todos os campos foram preenchidos
    if (!nome || !email || !senha || !confirmarSenha || !telefone || !dataNascimento) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Todos os campos são obrigatórios.',
        });
        return;
    }

    // Verifica se o e-mail tem um formato válido
    if (!validarEmail(email)) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor, insira um e-mail válido (gmail, hotmail, yahoo ou outlook).',
        });
        return;
    }

    // Verifica se o telefone tem um formato válido
    if (!validarTelefone(telefone)) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor, insira um número de telefone válido.',
        });
        return;
    }

    // Verifica se as senhas são iguais
    if (senha !== confirmarSenha) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'As senhas não coincidem.',
        });
        return;
    }

    // Verifica se a data de nascimento é válida
    if (!validarData(dataNascimento)) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Por favor, insira uma data de nascimento válida.',
        });
        return;
    }

    // Verifica se o email ou telefone já estão em uso
    const emailExistente = contas.find(conta => conta.email === email);
    const telefoneExistente = contas.find(conta => conta.telefone === telefone);

    if (emailExistente) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Este e-mail já está em uso.',
        });
        return;
    }

    if (telefoneExistente) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Este telefone já está em uso.',
        });
        return;
    }

    // Adiciona a nova conta ao array de contas e salva no localStorage
    contas.push({
        nome,
        email,
        senha,
        telefone,
        dataNascimento
    });
    salvarContas(contas);

    // Exibe a notificação de sucesso
    Swal.fire({
        position: "center",
        icon: "success",
        title: "Cadastro realizado com sucesso!",
        showConfirmButton: false,
        timer: 1500
    });

    // Limpa os campos de entrada após o cadastro
    document.getElementById('cadastro-nome').value = '';
    document.getElementById('cadastro-email').value = '';
    document.getElementById('cadastro-senha').value = '';
    document.getElementById('cadastro-confirmar-senha').value = '';
    document.getElementById('cadastro-telefone').value = '';
    document.getElementById('cadastro-data-nascimento').value = '';
}

// Função para validar o formato do e-mail
function validarEmail(email) {
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(gmail|hotmail|yahoo|outlook)\.(com)$/;
    return re.test(email);
}

// Função para validar o formato do telefone
function validarTelefone(telefone) {
    const re = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    return re.test(telefone);
}

// Função para validar se uma data é válida
function validarData(data) {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(data)) {
        return false; // Formato inválido
    }

    const partes = data.split('/');
    const dia = parseInt(partes[0], 10);
    const mes = parseInt(partes[1], 10) - 1; 
    const ano = parseInt(partes[2], 10);

    const dataObj = new Date(ano, mes, dia);
    return (
        dataObj.getFullYear() === ano &&
        dataObj.getMonth() === mes &&
        dataObj.getDate() === dia
    );
}

// Evento para formatar o telefone enquanto o usuário digita
document.getElementById('cadastro-telefone').addEventListener('input', function(e) {
    let telefone = e.target.value;

    // Remove todos os caracteres não numéricos
    telefone = telefone.replace(/\D/g, '');

    // Adiciona o parênteses ao código de área
    telefone = telefone.replace(/^(\d{2})(\d)/g, '($1) $2');

    // Adiciona o hífen no meio do número
    telefone = telefone.replace(/(\d{5})(\d)/, '$1-$2');

    // Atualiza o valor do campo com o formato desejado
    e.target.value = telefone;
});

// Evento para formatar a data enquanto o usuário digita
document.getElementById('cadastro-data-nascimento').addEventListener('input', function(e) {
    let data = e.target.value;

    // Remove todos os caracteres não numéricos
    data = data.replace(/\D/g, '');

    // Adiciona a barra após o dia e o mês
    data = data.replace(/(\d{2})(\d)/, '$1/$2');
    data = data.replace(/(\d{2})(\d)/, '$1/$2');

    // Limita a data a 10 caracteres (dd/MM/yyyy)
    if (data.length > 10) {
        data = data.substring(0, 10);
    }

    // Atualiza o valor do campo com o formato desejado
    e.target.value = data;
});

// Função para fazer login
function fazerLogin() {
    const email = document.getElementById('login-email').value.trim();
    const senha = document.getElementById('login-senha').value.trim();

    // Verifica se o e-mail e a senha estão corretos
    const conta = contas.find(conta => conta.email === email && conta.senha === senha);

    if (conta) {
        // Salva um indicador de sessão ativa no localStorage
        localStorage.setItem('usuarioLogado', 'true');
        localStorage.setItem('usuarioEmail', email);

        // Redireciona para a página de menu se o login for bem-sucedido
        window.location.href = 'Menu.html';
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'E-mail ou senha incorretos.',
        });
    }
}

// Função para fazer logout com confirmação
function fazerLogout() {
    Swal.fire({
        title: 'Você tem certeza que deseja sair?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não'
    }).then((result) => {
        if (result.isConfirmed) {
            // Remove o indicador de sessão ativa do localStorage
            localStorage.removeItem('usuarioLogado');
            localStorage.removeItem('usuarioEmail');

            // Redireciona para a página de login
            window.location.href = 'loginCadastro.html';
        }
    });
}

// Função para limpar as contas do localStorage
function limparContas() {
    localStorage.removeItem('contas');
    Swal.fire({
        icon: 'success',
        title: 'Contas limpas',
        text: 'Todas as contas foram removidas com sucesso.',
    });
}
