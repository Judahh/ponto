import * as playwright from 'playwright-aws-lambda';

// @ts-ignore
import * as chromiumBinary from '@sparticuz/chromium';
// @ts-ignore
// const chromiumBinary = require('@sparticuz/chromium');

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

        await page.route('**/*', (route: any) => {
            if (
                ['image', 'stylesheet', 'font'].includes(
                    route.request().resourceType()
                )
            ) {
                route.abort();
            } else {
                route.continue();
            }
        });

        await page.evaluate((o?: { lat?: string | number, lon?: string | number }) => {
            // @ts-ignore
            (navigator as any).geolocation.getCurrentPosition = function (success: any) {
                success({
                    coords: {
                        latitude: o?.lat,
                        longitude: o?.lon,
                        accuracy: 100
                    }
                });
            };
        }, { latitude, longitude });

        await page.goto(url);

        await page.waitForSelector('#usuario');
        await page.waitForSelector('#senha');

        await page.fill('#usuario', username);
        await page.fill('#senha', getPassword(username)); // TODO: Obter dinamicamente

        await page.keyboard.press('Enter');

        await page.waitForSelector('#btnRegistrar');
        await page.click('#btnRegistrar');

        console.log('div.alert.alert-success.growl-animated');

        // wait for the element to be visible
        // <div data-growl="container" class="alert alert-success gro wl-animated animated fadeInDown" role="alert" data-growl-position="top-right" style="position: fixed; margin: Opx; z-index: 1031; display: inline-block; top: 20px; right: 20 px;">@</div>
        const confirmation = await page.waitForSelector('div.alert.alert-success.growl-animated', { timeout: 10000 })
            .then((el: any) => el.innerText)
            .catch(() => {
                return 'Erro ao registrar ponto';
            });
        console.log('confirmation', confirmation);
        // await page.waitForTimeout(1000);
            
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
