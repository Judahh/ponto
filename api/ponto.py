import os
from dotenv import load_dotenv
import ssl
import time
import warnings
from datetime import datetime
from pytz import timezone
 
load_dotenv()
 
# Configurações de SSL
ssl._create_default_https_context = ssl._create_unverified_context
 
# URL
URL = os.getenv('URL')
# Chave da API
google_maps_api_key = os.getenv('GOOGLE_MAPS_API')

def get_password(username):
    """
    Função para obter a senha do usuário a partir de um arquivo .env.
    """
    load_dotenv()
    password = os.getenv(username)
    if password is None:
        # check if replacing '.' with '_'
        # if username has '.' replace with '_'
        username = username.replace('.', '_')
        password = os.getenv(username)

    if password is None:
        raise ValueError(f"Senha não encontrada para o usuário: {username}")
    return password
 
def registrar_ponto(username, url):
    password = get_password(username)
    agora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"Registrando ponto às {agora} (Dia da semana: {datetime.now().strftime('%A')})")
    # Configuração do Chrome
    chrome_options = Options()
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
 
    # Inicializar o WebDriver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    try:
        # Injetar a API Key do Google Maps
        driver.execute_script(f"""
            var script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key={google_maps_api_key}&libraries=places';
            document.head.appendChild(script);
        """)
 
        # Definir a geolocalização
        driver.execute_script("""
            navigator.geolocation.getCurrentPosition = function(success) {
                var position = {
                    coords: {
                        latitude: -15.821305,
                        longitude: -47.893889,
                        accuracy: 100
                    }
                };
                success(position);
            };
        """)
 
        # Abrir a URL
        if url is None:
            url = URL
        driver.get(url)
        time.sleep(2)
 
        # Esperar até que o campo de nome de usuário esteja presente
        username_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'usuario'))
        )
        password_input = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'senha'))
        )
        # Inserir credenciais
        username_input.clear()
        username_input.send_keys(username)
        password_input.clear()
        password_input.send_keys(password)
 
        # Pressionar ENTER para enviar o formulário
        password_input.send_keys(Keys.RETURN)
        time.sleep(2)  # Aguardar resposta do login
 
        # Esperar até que a página de destino carregue
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, 'btnRegistrar'))
        )
        print("Página de destino carregada.")
 
        # Esperar até que o botão de registrar ponto esteja visível e clicável
        punch_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, 'btnRegistrar'))
        )
        print("Botão de registrar ponto disponível.")
 
        # Tentar clicar no botão de registrar ponto
        punch_button.click()
        print("Botão de registrar ponto clicado.")
 
        # Verificar se uma mensagem de confirmação aparece usando a classe CSS
        confirmation_message = WebDriverWait(driver, 20).until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, "div.alert.alert-success.growl-animated"))
        )
        print("Ponto registrado com sucesso!")
        # retornar objeto de confirmação com usuario, hora e mensage de confirmação
        driver.quit()
        return {
            "usuario": username,
            "hora": agora,
            "mensagem": f"Registrando ponto às {agora} (Dia da semana: {datetime.now().strftime('%A')})",
            "confirmacao": confirmation_message.text
        }
 
    except Exception as e:
        print(f"Ocorreu um erro ao registrar o ponto: {e}")
        # driver.save_screenshot(f'erro_{agora}.png')
        # print("Screenshot capturada.")
        # retornar objeto de erro com usuario, hora e mensagem de erro
        driver.quit()
        return {
            "usuario": username,
            "hora": agora,
            "mensagem": f"Erro ao registrar ponto: {e}",
            "error": e
        }
    finally:
        print("Finalizando o WebDriver...")
