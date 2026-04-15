const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// 📁 pasta persistente (IMPORTANTE)
const SESSION_DIR = './sessao';

let browser;
let page;

// delay humano
const delay = (min = 800, max = 2000) =>
  new Promise(r => setTimeout(r, Math.random() * (max - min) + min));


// 🚀 inicia browser com sessão persistente
async function startBrowser(headless = true) {
  browser = await puppeteer.launch({
    headless,
    userDataDir: SESSION_DIR, // 🔥 salva sessão aqui
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  );
}


// 🔐 LOGIN (manual uma vez)
app.get('/login', async (req, res) => {
  try {
    await startBrowser(false); // 👈 abre visível

    await page.goto('https://www.instagram.com/accounts/login/', {
      waitUntil: 'networkidle2'
    });

    res.send('Faça login manual e depois acesse /ready');

  } catch (err) {
    res.json({ error: err.message });
  }
});


// ✅ verificar login salvo
app.get('/ready', async (req, res) => {
  try {
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'networkidle2'
    });

    const logged = await page.evaluate(() => {
      return !!document.querySelector('nav');
    });

    res.json({ logged });

  } catch (err) {
    res.json({ error: err.message });
  }
});


// 🔁 inicia já logado (usa sessão salva)
app.get('/start', async (req, res) => {
  try {
    await startBrowser(true);

    await page.goto('https://www.instagram.com/', {
      waitUntil: 'networkidle2'
    });

    res.send('Sessão carregada');

  } catch (err) {
    res.json({ error: err.message });
  }
});


// 📥 EXTRAÇÃO HUMANIZADA
app.get('/extract', async (req, res) => {
  const username = req.query.user;

  if (!username) {
    return res.json({ error: 'Passe ?user=' });
  }

  try {
    await page.goto(`https://www.instagram.com/${username}/`, {
      waitUntil: 'networkidle2'
    });

    await delay(2000, 4000);

    const btn = await page.$('a[href$="/followers/"]');
    if (!btn) return res.json({ error: 'Perfil não encontrado' });

    await btn.click();
    await delay(2000, 3000);

    const scrollBox = await page.$('div[role="dialog"] ul');

    const users = new Map();

    for (let i = 0; i < 15; i++) {
      const data = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('div[role="dialog"] li')).map(el => {
          const username = el.querySelector('a')?.innerText;
          const img = el.querySelector('img')?.src;
          const name = el.querySelector('span')?.innerText;

          return { username, img, name };
        });
      });

      data.forEach(u => u.username && users.set(u.username, u));

      // scroll humano
      await page.evaluate(async (el) => {
        el.scrollTop += Math.floor(Math.random() * 500) + 300;
      }, scrollBox);

      await delay(1500, 3000);
    }

    res.json({
      total: users.size,
      data: Array.from(users.values())
    });

  } catch (err) {
    res.json({ error: err.message });
  }
});


app.listen(PORT, () => {
  console.log('Servidor ON');
});
