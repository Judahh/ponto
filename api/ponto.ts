import * as playwright from 'playwright-aws-lambda';


function getPassword(username: string): string {
    const password = process.env[username] || process.env[username.replaceAll('.', '_')];
    return password || '';
    }

export async function registrarPonto(username: string, url: string, latitude?: string, longitude?: string) {
  const agora = new Date().toISOString();
  try {
    const browser =  await playwright.launchChromium();
    const context = await browser.newContext();
    const page = await context.newPage();

    await context.overridePermissions(url, ['geolocation']);
    await context.setGeolocation({ latitude, longitude });

    await page.goto(url);

    await page.waitForSelector('#usuario');
    await page.waitForSelector('#senha');

    await page.fill('#usuario', username);
    await page.fill('#senha', getPassword(username)); // TODO: Obter dinamicamente

    await page.keyboard.press('Enter');

    await page.waitForSelector('#btnRegistrar');
    await page.click('#btnRegistrar');

    const confirmation = await page.textContent('div.alert.alert-success.growl-animated');

    await browser.close();

    return {
      usuario: username,
      hora: agora,
      mensagem: `Registrando ponto às ${agora}`,
      confirmacao: confirmation
    };

  } catch (error: any) {
    return {
      usuario: username,
      hora: agora,
      mensagem: `Erro ao registrar ponto: ${error.message}`,
      error: error.stack
    };
  }
}
