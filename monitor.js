const fetch = require('node-fetch');

// 🔴 重点：这里不再填具体的值，而是告诉代码“去系统环境里找”
const CONFIG = {
  TG_BOT_TOKEN: process.env.TG_BOT_TOKEN,
  TG_CHAT_ID: process.env.TG_CHAT_ID,
  FLARESOLVERR_API: process.env.FLARESOLVERR_API,
  
  // 这些不敏感的配置可以写死，也可以用变量，随你
  TARGET_URL: process.env.TARGET_URL || 'https://dash.hidencloud.com/store/view/349',
  OUT_OF_STOCK_TEXT: 'No Available Locations',
  INTERVAL: 60000
};

async function checkStock() {
  // 安全检查：防止你忘了在后台填变量
  if (!CONFIG.TG_BOT_TOKEN || !CONFIG.FLARESOLVERR_API) {
    console.error("❌ 错误：未检测到环境变量！请在 ClawCloud 后台填入 TG_BOT_TOKEN 和 FLARESOLVERR_API");
    return;
  }

  try {
    console.log(`[${new Date().toISOString()}] 正在检查...`);
    const response = await fetch(CONFIG.FLARESOLVERR_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cmd: 'request.get',
        url: CONFIG.TARGET_URL,
        maxTimeout: 60000
      })
    });

    const data = await response.json();

    if (data.status === 'ok') {
      const html = data.solution.response;
      if (!html.includes(CONFIG.OUT_OF_STOCK_TEXT) && html.length > 1000) {
        console.log("!!! 有货 !!!");
        await sendTG(`🚨 <b>有货啦！</b>\n直达: ${CONFIG.TARGET_URL}`);
      } else {
        console.log("无货");
      }
    } else {
      console.error("FlareSolverr 报错:", data.message);
    }
  } catch (error) {
    console.error("运行出错:", error.message);
  }
}

async function sendTG(text) {
  const url = `https://api.telegram.org/bot${CONFIG.TG_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CONFIG.TG_CHAT_ID, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error("发送通知失败", e);
  }
}

// 启动
console.log("启动监控 (GitHub 安全版)...");
checkStock();
setInterval(checkStock, CONFIG.INTERVAL);
