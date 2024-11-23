import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler 
from concurrent.futures import ThreadPoolExecutor
from keras.models import Sequential # type: ignore
from keras.layers import Dense, LSTM # type: ignore
from pathlib import Path
import os

# Diretório base onde os arquivos CSV estão localizados
base_diretório = Path(os.getcwd())
caminho_base = base_diretório/'CryptoRush'/'Bases'
caminho_arquivos = base_diretório/'CryptoRush'/'data'

# Definir caminho dos arquivos 
arquivos = {
    'Bitcoin': caminho_base / 'Bitcoin Historical Data.csv',
    'Ethereum': caminho_base / 'Ethereum Historical Data.csv',
    'BNB': caminho_base / 'BNB Historical Data.csv',
    'Solana': caminho_base / 'Solana Historical Data.csv',
}

# Ler o arquivo ano.txt para pegar o ano
with open(caminho_arquivos/'ano.txt', 'r') as file:
    ano = int(file.read().strip())

# Ler o arquivo dificuldade.txt para pegar a dificuldade
with open(caminho_arquivos/'dificuldade.txt', 'r') as file:
    dificuldade = file.read().strip().lower()

# Melhor combinação de paramametro para Bitcoin nas respectivas dificuldades
parametros_bitcoin = {
    'dificil': {'neurons': 100, 'batch_size': 10, 'epochs': 20},
    'normal': {'neurons': 100, 'batch_size': 10, 'epochs': 20},
    'facil': {'neurons': 100, 'batch_size': 10, 'epochs': 20}
}

# Melhor combinação de paramametro para as outras criptomoedas nas respectivas dificuldades
parametros_outras = {
    'dificil': {'neurons': 100, 'batch_size': 10, 'epochs': 20},
    'normal': {'neurons': 100, 'batch_size': 10, 'epochs': 20},
    'facil': {'neurons': 100, 'batch_size': 10, 'epochs': 20}
}

# Obter os parâmetros com base na dificuldade para Bitcoin e para outras criptomoedas
params_bitcoin = parametros_bitcoin[dificuldade]
params_outras = parametros_outras[dificuldade]

# Função para tratar os dados de cada criptomoeda
def tratar_dados_cripto(caminho_csv):
    # Ler o arquivo CSV
    acao = pd.read_csv(caminho_csv)
    acao['Date'] = pd.to_datetime(acao['Date'])

    return acao

# Aplicar a função para cada criptomoeda e armazenar o resultado em um DataFrame
df_bitcoin = tratar_dados_cripto(arquivos['Bitcoin'])
df_ethereum = tratar_dados_cripto(arquivos['Ethereum'])
df_bnb = tratar_dados_cripto(arquivos['BNB'])
df_solana = tratar_dados_cripto(arquivos['Solana'])


def previsao(acao, neurons, batch_size, epochs, nome):
    # Separar um df no qual vai conter apenas os dado para treinamento
    # Que é com base no ano escolhido pelo jogador
    df_treinamento = acao[acao['Date'].dt.year < ano]

    # Apenas cotação dos dados de treinamento 
    cotacao_treinamento = df_treinamento['Price'].to_numpy().reshape(-1, 1)

    # Cotação dos dados da base toda
    cotacao = acao['Price'].to_numpy().reshape(-1, 1)

    # Armazenar tamanho dos dados de treinamento
    tamanho_dados_treinamento = int(len(cotacao_treinamento) * 1)

    #escalar os dados entre 0 e 1, para deixar mais fácil o processamento
    #dados em escala pré definidas são mais fáceis de lidar. 
    escalador = MinMaxScaler(feature_range=(0, 1))

    dados_entre_0_e_1_treinamento = escalador.fit_transform(cotacao[0: tamanho_dados_treinamento, :])
    dados_entre_0_e_1_restantes = escalador.transform(cotacao[tamanho_dados_treinamento: , :])

    dados_entre_0_e_1 = list(dados_entre_0_e_1_treinamento.reshape(
        len(dados_entre_0_e_1_treinamento))) + list(dados_entre_0_e_1_restantes.reshape(len(dados_entre_0_e_1_restantes)))
                                                    
    dados_entre_0_e_1 = np.array(dados_entre_0_e_1).reshape(len(dados_entre_0_e_1), 1)
    dados_para_treinamento = dados_entre_0_e_1[0: tamanho_dados_treinamento, :]

    #dados que serão usados para gerar o resultado
    treinamento_x = []
    #cotação que aconteceu de fato
    treinamento_y = []

    for i in range(60, len(dados_para_treinamento)):

        #60 ultimos dias
        treinamento_x.append(dados_para_treinamento[i - 60: i, 0])
        #cotacao
        treinamento_y.append(dados_para_treinamento[i, 0])
    
    #transformando as listas em arrays e dando reshape 3d 

    treinamento_x, treinamento_y = np.array(treinamento_x), np.array(treinamento_y)
    treinamento_x = treinamento_x.reshape(treinamento_x.shape[0], treinamento_x.shape[1], 1)

    #construindo o modelo
    modelo = Sequential()

    modelo.add(LSTM(neurons, return_sequences=True, input_shape=(treinamento_x.shape[1], 1)))
    modelo.add(LSTM(neurons//2, return_sequences=False))
    modelo.add(Dense((neurons//2)//2))
    modelo.add(Dense(1))

    treinamento_x.shape[1]

    #copilando o modelo
    modelo.compile(optimizer="adam", loss="mean_squared_error") 

    modelo.fit(treinamento_x, treinamento_y, batch_size=batch_size, epochs=epochs)

    dados_teste = dados_entre_0_e_1[tamanho_dados_treinamento - 60:, :]

    predicao_x = []

    for i in range(60, len(dados_teste)):
        predicao_x.append(dados_teste[i - 60: i, 0])

    # Reshape
    predicao_x = np.array(predicao_x)
    predicao_x = predicao_x.reshape(predicao_x.shape[0], predicao_x.shape[1], 1)

    # Pegando predições do modelo
    predicoes = modelo.predict(predicao_x)

    # Tirando a escala dos dados
    predicoes = escalador.inverse_transform(predicoes)

    # dados do modelo
    treinamento = acao.iloc[:tamanho_dados_treinamento, :]
    df_previsao = pd.DataFrame({"Date": acao['Date'].iloc[tamanho_dados_treinamento:],
                                "Price": acao['Price'].iloc[tamanho_dados_treinamento:],
                                "predicoes": predicoes.reshape(len(predicoes))})
    
    # Setar a data como index dos df (df_previsao e treinamento)
    df_previsao.set_index('Date', inplace=True)
    treinamento.set_index('Date', inplace=True)

    df_previsao.sort_index()

    df_previsao_semanal = df_previsao
    df_previsao_semanal['Semana'] = ((df_previsao_semanal.index - df_previsao_semanal.index.min()).days // 7) + 1

    df_previsao_semanal = df_previsao_semanal.reset_index() 


    df_previsao_semanal.reset_index() 
    # Agrupar por semana e calcular o preço médio semanal das previsões
    df_semana = df_previsao_semanal.groupby('Semana').agg({
        'predicoes': 'mean',   # Previsão média por semana
        'Price': 'mean',       # Preço médio por semana
        'Date': 'first'        # Pega a primeira data da semana 
    })

    # Adicionar colunas de mês e ano com base na coluna 'Data'
    df_semana['Mes'] = df_semana['Date'].dt.month
    df_semana['Ano'] = df_semana['Date'].dt.year

    # Calcular a variação percentual semanal para Price e Predicoes
    df_semana['Variação Real (%)'] = df_semana['Price'].pct_change() * 100
    df_semana['Variação Prevista (%)'] = df_semana['predicoes'].pct_change() * 100

    # Remover NaN (primeira linha não terá variação por não ter valor anterior)
    # df_semana = df_semana.dropna()

    df_semana.to_csv(f"{caminho_arquivos}\previsão semanal - {nome}.csv")

    return df_semana

# Executor para rodar as previsões com os parâmetros específicos
if ano > 2021:
    with ThreadPoolExecutor() as executor:
        # Executar previsão para as 4 criptos
        executor.submit(previsao, df_bitcoin, **params_bitcoin, nome='Bitcoin')
        executor.submit(previsao, df_ethereum, **params_outras, nome='Ethereum')
        executor.submit(previsao, df_bnb, **params_outras, nome='BNB')
        executor.submit(previsao, df_solana, **params_outras, nome='Solana')
        
else:
    # Remoção da Solana se for 2020 ou 2021
    if os.path.exists(caminho_arquivos / 'previsão semanal - Solana.csv'):
        os.remove(caminho_arquivos / 'previsão semanal - Solana.csv')

    with ThreadPoolExecutor() as executor:
        # Executar previsão desconsiderando a Solana
        executor.submit(previsao, df_bitcoin, **params_bitcoin, nome='Bitcoin')
        executor.submit(previsao, df_ethereum, **params_outras, nome='Ethereum')
        executor.submit(previsao, df_bnb, **params_outras, nome='BNB')

    