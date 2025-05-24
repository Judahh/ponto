import * as playwright from 'playwright-aws-lambda';

import * as chromiumBinary from '@sparticuz/chromium';

import { chromium } from 'playwright-core';

function getPassword(username: string): string {
    const password = process.env[username] || process.env[username.replaceAll('.', '_')];
    return password || '';
    }

export async function registrarPonto(username: string, url: string, latitude?: string, longitude?: string) {
  const agora = new Date().toISOString();
  try {
    // const browser =  await playwright.launchChromium();
    
    const executablePath = await chromiumBinary.executablePath();

        // launch browser with external Chromium
    const browser = await chromium.launch({
        args: chromiumBinary.args,
        executablePath: executablePath,
        headless: true,
    });

    const context = await browser.newContext();
    const page = (await context.newPage()) as any;

    await page.evaluateOnNewDocument((lat?: string | number, lon?: string | number) => {
        // @ts-ignore
        (navigator as any).geolocation.getCurrentPosition = function (success: any) {
          success({
            coords: {
              latitude: lat,
              longitude: lon,
              accuracy: 100
            }
          });
        };
      }, latitude, longitude);

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
