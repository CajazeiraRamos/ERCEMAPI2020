#!/webapps/adimo/.virtualenvs/adimo/bin/python
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
import time,glob,os
import pandas as pd

download_path = '/home/jonnison/mapas/'
output_path = download_path

#REMOVENDO ARQUIVOS ANTIGOS
for file in glob.glob(download_path+"*.csv"):
	os.remove(file)

#CONFIGURAÇÕES DE DOWNLOAD
profile = webdriver.FirefoxProfile()
profile.set_preference("browser.download.folderList", 2)
profile.set_preference("browser.download.manager.showWhenStarting", False)
profile.set_preference("browser.download.dir", download_path)
profile.set_preference("browser.helperApps.neverAsk.saveToDisk","text/csv,application/csv,text/plan,text/comma-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.spreadsheetml.template,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel.template.macroEnabled.12,application/vnd.ms-excel.addin.macroEnabled.12,application/vnd.ms-excel.sheet.binary.macroEnabled.12")


#FIREFOX HEADLESS
options = Options()
# options.headless = True

#ACESSANDO O SITE
driver=webdriver.Firefox(firefox_profile=profile,options=options)
driver.get("https://covid.saude.gov.br/")
time.sleep(5)

#SELECIONANDO O ELEMENTO E CLICANDO
btn=list(filter(lambda x: "Arquivo" in x.text,driver.find_elements_by_xpath("//ion-button")))[0]
btn.click()

#FECHANDO O NAVEGADOR
time.sleep(10)
driver.close()

#ABRINDO O CSV
csv_name = glob.glob(download_path+"*.csv")
if len(csv_name)>0:
	pd_df = pd.read_csv(csv_name[0],sep=";")
else:
	csv_name = glob.glob(download_path+"*.xlsx")[0]
	pd_df = pd.read_excel(csv_name)
	pd_df = pd_df[['regiao','estado','data','casosAcumulado','casosNovos','obitosAcumulado','obitosNovos']]
pd_df = pd_df.rename(columns=lambda x: "data" if "data" in x.lower() else x)
pd_df['data'] = pd_df['data'].astype('datetime64[ns]')
pd_df.to_csv(output_path+"minSaude.csv",header=['regiao','estado','data','casosNovos','casosAcumulados','obitosNovos','obitosAcumulados'],index=False,date_format='%d/%m/%Y')




