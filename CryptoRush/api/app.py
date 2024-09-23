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



if __name__ == '__main__':
    app.run(debug=True)
