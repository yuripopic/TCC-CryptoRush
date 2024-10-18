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
    

# Função para ler o arquivo quantidade.txt e retornar as quantidades atuais
def ler_quantidade():
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
            for row in reader:
                moeda, cotacao = row
                cotacoes[moeda] = float(cotacao)
    return cotacoes

# Rota para retornar as quantidades e valores totais
@app.route('/get-rendimentos', methods=['GET'])
def get_rendimentos():
    try:
        quantidades = ler_quantidades()
        cotacoes = ler_cotacoes()

        rendimentos = []
        for moeda, quantidade in quantidades.items():
            cotacao_atual = cotacoes.get(moeda, 0)
            valor_total = quantidade * cotacao_atual
            rendimentos.append({
                'moeda': moeda,
                'quantidade': quantidade,
                'valor_aplicado': valor_total
            })

        return jsonify(rendimentos), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para salvar as quantidades atualizadas no arquivo quantidade.txt
def salvar_quantidade(quantidades):
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

        if not all([moeda, quantidade, tipo]):
            return jsonify({"error": "Dados incompletos para atualizar quantidade"}), 400

        # Lê o arquivo quantidade.txt
        quantidades = ler_quantidade()

        # Valida a quantidade no caso de uma venda
        if tipo == 'Venda':
            if moeda not in quantidades or quantidades[moeda] < quantidade:
                return jsonify({"error": "Quantidade insuficiente para venda"}), 400

        # Atualiza a quantidade baseada no tipo de transação
        if tipo == 'Compra':
            quantidades[moeda] = quantidades.get(moeda, 0) + quantidade
        elif tipo == 'Venda':
            quantidades[moeda] = quantidades.get(moeda, 0) - quantidade
            if quantidades[moeda] < 0:
                quantidades[moeda] = 0  # Garante que não tenha valores negativos

        # Salva as novas quantidades no arquivo
        salvar_quantidade(quantidades)

        return jsonify({"message": "Quantidade atualizada com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
