from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
CORS(app)

# Obtendo o caminho absoluto para o arquivo saldo.txt
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SALDO_PATH = os.path.join(BASE_DIR, 'data', 'saldo.txt')
COTACAO_PATH = os.path.join(BASE_DIR, 'data/cotacao-atual.csv')
TRANSACTIONS_PATH = os.path.join(BASE_DIR, 'data/transacoes.csv')
QUANTIDADE_PATH = os.path.join(BASE_DIR, 'data/quantidade.txt')

@app.route('/get-saldo', methods=['GET'])
def get_saldo():
    try:
        with open(SALDO_PATH, 'r') as file:
            saldo = file.read().strip()
            return jsonify({"saldo": float(saldo)})
    except FileNotFoundError:
        return jsonify({"error": "Arquivo saldo.txt não encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/atualizar-saldo', methods=['POST'])
def atualizar_saldo():
    try:
        data = request.get_json()
        novo_saldo = data.get('novo_saldo')

        # Atualiza o saldo no arquivo saldo.txt
        with open(SALDO_PATH, 'w') as file:
            file.write(str(novo_saldo))

        return jsonify({"message": "Saldo atualizado com sucesso"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/salvar-saldo', methods=['POST'])
def salvar_saldo():
    try:
        # Verificar se a requisição contém um JSON válido
        if not request.is_json:
            return jsonify({"error": "Requisição não está no formato JSON"}), 400
        
        # Extrair o valor do saldo da requisição
        saldo = request.json.get('saldo')
        
        # Verificar se o saldo foi fornecido corretamente
        if saldo is None:
            return jsonify({"error": "Saldo não fornecido"}), 400

        # Gravar o saldo no arquivo saldo.txt
        with open(SALDO_PATH, 'w') as file:
            file.write(str(saldo))

        return jsonify({"message": "Saldo salvo com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-cotacao', methods=['POST'])
def get_cotacao():
    try:
        data = request.get_json()
        moeda = data.get('moeda')

        if not moeda:
            return jsonify({"error": "Moeda não informada"}), 400

        # Lê o arquivo CSV e busca a cotação da moeda
        with open(COTACAO_PATH, newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row['moeda'] == moeda:
                    return jsonify({"cotacao": float(row['cotacao'])})

        return jsonify({"error": "Cotação não encontrada"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para salvar a transação no arquivo CSV
@app.route('/registrar-transacao', methods=['POST'])
def registrar_transacao():
    try:
        data = request.get_json()
        tipo = data.get('tipo')
        valor = data.get('valor')
        quantidade = data.get('quantidade')
        moeda = data.get('moeda')

        # Verifica se todos os campos estão presentes
        if not all([tipo, valor, quantidade, moeda]):
            return jsonify({"error": "Dados incompletos para registrar transação"}), 400

        # Escreve a transação no arquivo CSV
        with open(TRANSACTIONS_PATH, mode='a', newline='') as file:
            writer = csv.writer(file)
            writer.writerow([tipo, valor, quantidade, moeda])

        return jsonify({"message": "Transação registrada com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Função para carregar as transações do arquivo CSV
@app.route('/carregar-transacoes', methods=['GET'])
def carregar_transacoes():
    try:
        transacoes = []
        with open(TRANSACTIONS_PATH, mode='r') as file:
            reader = csv.reader(file)
            for row in reader:
                transacoes.append({
                    "tipo": row[0],
                    "valor": float(row[1]),
                    "quantidade": float(row[2]),
                    "moeda": row[3]
                })
        return jsonify(transacoes), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    

# Função para ler o arquivo quantidade.txt
def ler_quantidades():
    quantidades = {}
    if os.path.exists(QUANTIDADE_PATH):
        with open(QUANTIDADE_PATH, 'r') as file:
            reader = csv.reader(file)
            for row in reader:
                moeda, quantidade = row
                quantidades[moeda] = float(quantidade)
    return quantidades

# Função para ler as cotações atuais das criptomoedas
def ler_cotacoes():
    cotacoes = {}
    if os.path.exists(COTACAO_PATH):
        with open(COTACAO_PATH, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Ignora o cabeçalho do arquivo CSV
            for row in reader:
                moeda, cotacao = row
                cotacoes[moeda] = float(cotacao)  # Converte o valor da cotação para float
    return cotacoes


# Função para ler o arquivo transacoes.csv
def ler_transacoes():
    transacoes = []
    if os.path.exists(TRANSACTIONS_PATH):
        with open(TRANSACTIONS_PATH, 'r') as file:
            reader = csv.reader(file)
            next(reader)  # Ignora o cabeçalho, se houver
            for row in reader:
                tipo, valor, quantidade, moeda = row
                transacoes.append({
                    'tipo': tipo,
                    'valor': float(valor),
                    'quantidade': float(quantidade),
                    'moeda': moeda
                })
    return transacoes

# Função para ler o saldo do arquivo saldo.txt
def ler_saldo():
    saldo = 0
    if os.path.exists(SALDO_PATH):
        with open(SALDO_PATH, 'r') as file:
            saldo = float(file.read().strip())
    return saldo

# Função para ler o arquivo transacoes.csv e calcular o valor aplicado e a quantidade por moeda
def calcular_valor_e_quantidade():
    transacoes = {}
    if os.path.exists(TRANSACTIONS_PATH):
        with open(TRANSACTIONS_PATH, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                moeda = row['moeda']
                tipo = row['tipo']
                valor = float(row['valor'])
                quantidade = float(row['quantidade'])
                
                if moeda not in transacoes:
                    transacoes[moeda] = {'valor': 0, 'quantidade': 0}

                # Somar se for uma compra e subtrair se for uma venda
                if tipo == 'Compra':
                    transacoes[moeda]['valor'] += valor
                    transacoes[moeda]['quantidade'] += quantidade
                elif tipo == 'Venda':
                    transacoes[moeda]['valor'] -= valor
                    transacoes[moeda]['quantidade'] -= quantidade

    return transacoes

# Rota para retornar os rendimentos e quantidade
@app.route('/get-rendimentos', methods=['GET'])
def get_rendimentos():
    try:
        transacoes = calcular_valor_e_quantidade()

        rendimentos = []
        for moeda, dados in transacoes.items():
            rendimentos.append({
                'moeda': moeda,
                'valor_aplicado': dados['valor'],
                'quantidade': dados['quantidade']
            })

        return jsonify(rendimentos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para salvar as quantidades atualizadas no arquivo quantidade.txt
def salvar_quantidades(quantidades):
    with open(QUANTIDADE_PATH, 'w', newline='') as file:
        writer = csv.writer(file)
        for moeda, quantidade in quantidades.items():
            writer.writerow([moeda, quantidade])

# Função para atualizar a quantidade de criptomoedas após compra/venda
@app.route('/atualizar-quantidade', methods=['POST'])
def atualizar_quantidade():
    try:
        data = request.get_json()
        moeda = data.get('moeda')
        quantidade = float(data.get('quantidade'))
        tipo = data.get('tipo')  # Pode ser 'Compra' ou 'Venda'

        # Ler quantidades atuais
        quantidades = ler_quantidades()

        # Se for uma compra, adicionar a quantidade
        if tipo == 'Compra':
            quantidades[moeda] = quantidades.get(moeda, 0) + quantidade
        # Se for uma venda, subtrair a quantidade
        elif tipo == 'Venda':
            if moeda in quantidades and quantidades[moeda] >= quantidade:
                quantidades[moeda] -= quantidade
                if quantidades[moeda] < 0:
                    quantidades[moeda] = 0  # Garante que não fique negativa
            else:
                return jsonify({"error": "Quantidade insuficiente para venda"}), 400

        # Salvar quantidades atualizadas no arquivo quantidade.txt
        salvar_quantidades(quantidades)

        return jsonify({"message": "Quantidade atualizada com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Função para calcular o patrimônio total e os percentuais de cada moeda
@app.route('/get-patrimonio', methods=['GET'])
def get_patrimonio():
    try:
        # Lê o saldo do caixa atual
        saldo_atual = ler_saldo()

        # Lê os valores investidos e quantidades
        transacoes = calcular_valor_e_quantidade()

        # Calcula o total de investimentos
        total_investido = sum([dados['valor'] for dados in transacoes.values()])

        # Calcula o patrimônio total (caixa + total investido)
        patrimonio_total = saldo_atual + total_investido

        # Calcula o percentual de cada moeda
        patrimonio = []
        for moeda, dados in transacoes.items():
            percentual = (dados['valor'] / patrimonio_total) * 100 if patrimonio_total > 0 else 0
            patrimonio.append({
                'moeda': moeda,
                'valor_aplicado': dados['valor'],
                'percentual': percentual,
                'quantidade': dados['quantidade']
            })

        return jsonify({
            'patrimonio_total': patrimonio_total,
            'saldo_atual': saldo_atual,
            'patrimonio': patrimonio
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
