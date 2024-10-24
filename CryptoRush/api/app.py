from flask import Flask, jsonify, request
from flask_cors import CORS
import csv
import os

app = Flask(__name__)
CORS(app)

# Obtendo o caminho absoluto para o arquivo saldo.txt
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, 'data')
SALDO_PATH = os.path.join(BASE_DIR, 'data', 'saldo.txt')
COTACAO_PATH = os.path.join(BASE_DIR, 'data/cotacao-atual.csv')
TRANSACOES_PATH = os.path.join(BASE_DIR, 'data/transacoes.csv')
QUANTIDADE_PATH = os.path.join(BASE_DIR, 'data/quantidade.txt')
ANO_PATH = os.path.join(BASE_DIR, 'data/ano.txt')
SEMANA_PATH = os.path.join(BASE_DIR, 'data/semana.txt')

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

# Função para ler o arquivo ano.txt e retornar o ano atual
def get_ano():
    if os.path.exists(ANO_PATH):
        with open(ANO_PATH, 'r') as file:
            return int(file.read().strip())
    return None

# Função para ler o arquivo semana.txt e retornar a semana atual
def get_semana_cotacao():
    if os.path.exists(SEMANA_PATH):
        with open(SEMANA_PATH, 'r') as file:
            return int(file.read().strip())
    return None

@app.route('/get-cotacao', methods=['POST'])
def get_cotacao():
    try:
        data = request.get_json()
        moeda = data.get('moeda')

        ano = get_ano()
        semana = get_semana_cotacao()

        if not ano or not semana:
            return jsonify({"error": "Ano ou semana não encontrados."}), 400

        csv_file = os.path.join(DATA_DIR, f"previsão semanal - {moeda}.csv")

        if not os.path.exists(csv_file):
            return jsonify({"error": f"Arquivo de cotações para {moeda} não encontrado."}), 404

        with open(csv_file, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row['Ano']) == ano and int(row['Semana']) == semana:
                    return jsonify({"cotacao": float(row['Price'])}), 200

        return jsonify({"error": "Cotação não encontrada para a combinação de ano e semana."}), 404
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
        with open(TRANSACOES_PATH, mode='a', newline='') as file:
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
        with open(TRANSACOES_PATH, mode='r') as file:
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
    if os.path.exists(TRANSACOES_PATH):
        with open(TRANSACOES_PATH, 'r') as file:
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
    if os.path.exists(TRANSACOES_PATH):
        with open(TRANSACOES_PATH, 'r') as file:
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
        print(quantidades)
        salvar_quantidades(quantidades)

        return jsonify({"message": "Quantidade atualizada com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/validar-quantidade', methods=['POST'])
def validar_quantidade():
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
                return jsonify({"error": "Constatada quantidade insuficiente para venda"}), 400

        return jsonify({"message": "Quantidade validada com sucesso"}), 200
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
    
@app.route('/salvar-ano', methods=['POST'])
def salvar_ano():
    try:
        data = request.get_json()
        ano = data.get('ano')

        # Grava o ano no arquivo ano.txt
        with open(ANO_PATH, 'w') as file:
            file.write(str(ano))

        return jsonify({"message": "Ano salvo com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para limpar os arquivos quantidade.txt e transacoes.csv
@app.route('/limpar-arquivos', methods=['POST'])
def limpar_arquivos():
    try:
        # Limpa o arquivo quantidade.txt
        open(QUANTIDADE_PATH, 'w').close()

        # Limpa o arquivo transacoes.csv, mas preserva o cabeçalho
        with open(TRANSACOES_PATH, 'w', newline='') as file:
            file.write('tipo,valor,quantidade,moeda\n')  # Cabeçalho preservado

        return jsonify({"message": "Arquivos limpos com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para salvar o valor 1 no arquivo semana.txt
@app.route('/salvar-semana', methods=['POST'])
def salvar_semana():
    try:
        data = request.get_json()
        semana = data.get('semana')

        # Grava o valor 1 no arquivo semana.txt
        with open(SEMANA_PATH, 'w') as file:
            file.write(str(semana))

        return jsonify({"message": "Semana salva com sucesso"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# Função para buscar a semana atual no arquivo semana.txt
@app.route('/get-semana', methods=['GET'])
def get_semana():
    try:
        if os.path.exists(SEMANA_PATH):
            with open(SEMANA_PATH, 'r') as file:
                semana = int(file.read().strip())
        else:
            semana = 1  # Se o arquivo não existir, começa na semana 1

        return jsonify({"semana": semana}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para avançar a data e incrementar o valor no arquivo semana.txt
@app.route('/avancar-data', methods=['POST'])
def avancar_data():
    try:
        # Lê o valor atual da semana
        if os.path.exists(SEMANA_PATH):
            with open(SEMANA_PATH, 'r') as file:
                semana = int(file.read().strip())
        else:
            semana = 1  # Se o arquivo não existir, começa na semana 1

        # Incrementa a semana
        semana += 1

        # Salva o novo valor no arquivo semana.txt
        with open(SEMANA_PATH, 'w') as file:
            file.write(str(semana))

        return jsonify({"message": "Data avançada com sucesso", "semana": semana}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get-variacao', methods=['POST'])
def get_variacao():
    try:
        data = request.get_json()
        moeda = data.get('moeda')
        semana = data.get('semana')

        # Caminho do arquivo CSV da criptomoeda
        csv_file = os.path.join(DATA_DIR, f"previsão semanal - {moeda}.csv")

        if not os.path.exists(csv_file):
            return jsonify({"error": f"Arquivo de cotações para {moeda} não encontrado."}), 404

        # Abrindo o arquivo CSV e buscando pela coluna Variação Real (%)
        with open(csv_file, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row['Semana']) == semana:
                    return jsonify({"variacao_real": row['VariaÃ§Ã£o Real (%)']}), 200

        return jsonify({"error": "Variação não encontrada para a semana especificada."}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Função para ler o arquivo quantidade.txt
def get_quantidade():
    quantidade = {}
    if os.path.exists(QUANTIDADE_PATH):
        with open(QUANTIDADE_PATH, 'r') as file:
            for line in file:
                moeda, qtd = line.strip().split(',')
                quantidade[moeda] = float(qtd)
    return quantidade

# Função para obter o valor investido (baseado nas transações)
def calcular_valor_investido(moeda):
    valor_investido = 0
    if os.path.exists(TRANSACOES_PATH):
        with open(TRANSACOES_PATH, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if row['moeda'] == moeda:
                    if row['tipo'] == 'Compra':
                        valor_investido += float(row['valor'])
                    elif row['tipo'] == 'Venda':
                        valor_investido -= float(row['valor'])
    return valor_investido

# Função para obter a cotação atual de uma criptomoeda
def get_cotacao_atual(moeda, semana_atual):
    csv_file = os.path.join(DATA_DIR, f"previsão semanal - {moeda}.csv")
    if os.path.exists(csv_file):
        with open(csv_file, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if int(row['Semana']) == semana_atual:
                    return float(row['Price'])
    return None

# Função para ler a semana atual
def get_semana_atual():
    if os.path.exists(SEMANA_PATH):
        with open(SEMANA_PATH, 'r') as file:
            return int(file.read().strip())
    return None

# Endpoint para calcular o lucro
@app.route('/get-lucro', methods=['POST'])
def get_lucro():
    try:
        data = request.get_json()
        moeda = data.get('moeda')

        # Calcula o valor investido
        valor_investido = calcular_valor_investido(moeda)

        # Pega a quantidade de criptomoedas
        quantidade = get_quantidade().get(moeda, 0)

        # Pega a semana atual
        semana_atual = get_semana_atual()

        # Pega a cotação atual
        cotacao_atual = get_cotacao_atual(moeda, semana_atual)

        if cotacao_atual is None:
            return jsonify({"error": "Cotação não encontrada para a semana atual."}), 404

        # Calcula o valor atual da criptomoeda
        valor_atual = cotacao_atual * quantidade

        # Calcula o lucro
        lucro = valor_atual - valor_investido

        return jsonify({
            "moeda": moeda,
            "valor_investido": valor_investido,
            "valor_atual": valor_atual,
            "lucro": lucro
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
