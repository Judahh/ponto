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

        const context = await browser.newContext({
            geolocation: {
                latitude: Number(latitude) || 0,
                longitude: Number(longitude) || 0,
            },
            permissions: ['geolocation'],
        });
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

        console.log('Preenchendo o formulário...');

        const password = getPassword(username);

        await page.fill('#usuario', username);
        await page.fill('#senha', password); // TODO: Obter dinamicamente

        console.log("username", username);
        console.log("password", password);


        await page.keyboard.press('Enter');

        await page.waitForSelector('#btnRegistrar');
        await page.click('#btnRegistrar');

        // print page html
        const text = 'com sucesso.';
        // check if this text is appears in the page after clicking the button
        let error;
        let confirmation;
        try {
            const growlAnimated = await page.waitForSelector('div.alert.alert-success.growl-animated', { timeout: 10000 });
            confirmation = await growlAnimated.innerText();
        } catch (error) {
            try {
                const textSelector = await page.waitForSelector(`text=${text}`, { timeout: 10000 });
                confirmation = await textSelector.innerText();
            } catch (error) {
                console.log('Erro ao registrar ponto 2');
                try {
                    const geoError = await page.$('div.alert.alert-danger.growl-animated');
                    if (geoError) {
                        error = await geoError.innerText();
                        console.log('Erro de geolocalização:', error);
                    }
                    error = 'Erro ao registrar ponto:' + error;
                } catch (error) {
                    error = 'Erro ao registrar ponto';
                }
                
            }
        }
        
            
        const html = await page.content();
        console.log(html);
        console.log('confirmation', confirmation);

        if (confirmation.includes('Erro') || error) {
            console.log('Erro');
            return {
                usuario: username,
                hora: agora,
                mensagem: `Erro ao registrar ponto: ${confirmation}`,
                confirmacao: confirmation
            };
        }

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
