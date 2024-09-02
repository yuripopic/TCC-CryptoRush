#======================{ BIBLIOTECAS }=======================
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.dates import DateFormatter


#========================={ BASES }==========================
base_bitcoin = pd.read_csv(r'C:\Users\yupopic\Documents\FEI\TCC\CryptoRush\Bases\Bitcoin Historical Data.csv')
base_ethereum = pd.read_csv(r'C:\Users\yupopic\Documents\FEI\TCC\CryptoRush\Bases\Ethereum Historical Data.csv')
base_bnb = pd.read_csv(r'C:\Users\yupopic\Documents\FEI\TCC\CryptoRush\Bases\BNB Historical Data.csv')
base_solana = pd.read_csv(r'C:\Users\yupopic\Documents\FEI\TCC\CryptoRush\Bases\Solana Historical Data.csv')


#======================{ TRATAR BASES }=======================
# Converter a coluna "Date" de cada base para o formato de data
for df in [base_bitcoin, base_ethereum, base_bnb, base_solana]:
    df['Date'] = pd.to_datetime(df['Date'], format='%m/%d/%Y')

# Mudar o tipo das colunas, nas quais o conteúdo é dinheiro, para float e remover ',' dos valores
colunas_dinheiro = ['Price', 'Open', 'High', 'Low']
for df in [base_bitcoin, base_ethereum, base_bnb, base_solana]:
    for coluna in colunas_dinheiro:
        if df[coluna].dtype == 'object':  
            df[coluna] = pd.to_numeric(df[coluna].str.replace(',', ''))

# Remover '%' dos valores e mudar o tipo na coluna 'Change %' 
for df in [base_bitcoin, base_ethereum, base_bnb, base_solana]:
    if df['Change %'].dtype == 'object':  
        df['Change %'] = pd.to_numeric(df['Change %'].str.replace('%', ''))

# Filtro para determinar o período em que vamos puxar os dados da base
base_bitcoin = base_bitcoin[base_bitcoin['Date'].dt.year >= 2023]
base_ethereum = base_ethereum[base_ethereum['Date'].dt.year >= 2023]
base_bnb = base_bnb[base_bnb['Date'].dt.year >= 2023]
base_solana = base_solana[base_solana['Date'].dt.year >= 2023]

print(base_bitcoin)
