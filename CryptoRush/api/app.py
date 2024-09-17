from flask import Flask, jsonify, request
from flask_cors import CORS
import csv

app = Flask(__name__)
CORS(app)

# Rota para retornar o saldo atual
@app.route('/get-saldo', methods=['GET'])
def get_saldo():
    try:
        with open('data/saldo.txt', 'r') as file:
            saldo = file.read().strip()
            return jsonify({"saldo": float(saldo)})
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
        with open('data/saldo.txt', 'w') as file:
            file.write(str(saldo))

        return jsonify({"message": "Saldo salvo com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-cotacao', methods=['GET'])
def get_cotacao():
    data = request.get_json()
    moeda = data.get('moeda')

    try:
        with open('data/cotacao-atual.csv', newline='') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                if row['moeda'] == moeda:
                    return jsonify({'cotacao': float(row['cotacao'])})
        return jsonify({'error': 'Criptomoeda não encontrada'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True)
