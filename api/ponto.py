import os
from playwright.sync_api import sync_playwright
from datetime import datetime

def registrar_ponto(username, url, latitude=None, longitude=None):
    password = os.getenv(username) or os.getenv(username.replace('.', '_'))
    if not password:
        return {"error": f"Senha não encontrada para o usuário: {username}"}

    if url is None:
        url = os.getenv('URL')

    latitude = float(latitude or os.getenv(username + '_LATITUDE') or -15.7417317027277)
    longitude = float(longitude or os.getenv(username + '_LONGITUDE') or -47.914133845299254)

    agora = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                geolocation={"latitude": latitude, "longitude": longitude},
                permissions=["geolocation"]
            )
            page = context.new_page()

            print("Abrindo a URL...")
            page.goto(url)

            # Esperar explicitamente pelo campo de usuário
            print("Esperando pelo campo de usuário...")
            page.wait_for_selector('#usuario', timeout=10000)

            print("Esperando pelo campo de senha...")
            page.wait_for_selector('#senha', timeout=10000)

            # preencher os campos
            print("Preenchendo os campos...")
            page.fill('#usuario', username)
            page.fill('#senha', password)
            page.press('#senha', 'Enter')

            # esperar pelo botão de registrar
            print("Esperando pelo botão de registrar...")
            page.wait_for_selector('#btnRegistrar', timeout=10000)
            page.click('#btnRegistrar')

            # esperar mensagem de sucesso
            print("Esperando pela confirmação...")
            page.wait_for_selector('div.alert.alert-success.growl-animated', timeout=20000)

            confirmation = page.locator('div.alert.alert-success.growl-animated').inner_text()

            browser.close()

            return {
                "usuario": username,
                "hora": agora,
                "mensagem": f"Registrando ponto às {agora} (Dia da semana: {datetime.now().strftime('%A')})",
                "confirmacao": confirmation
            }

    except Exception as e:
        return {
            "usuario": username,
            "hora": agora,
            "mensagem": f"Erro ao registrar ponto: {e}",
            "error": str(e)
        }