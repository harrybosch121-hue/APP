const { gzip } = require('zlib');
  const { promisify } = require('util');
  const gzipAsync = promisify(gzip);

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8737312570:AAGRDTxgja5cL-KkAoPHqfZ54Nf0_XMoZ_c';
  const CHAT_IDS = (process.env.TELEGRAM_CHAT_IDS || '5733576801,8194958384').split(',').map(s => s.trim());

  async function sendDocument(chatId, buffer, filename, caption) {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('document', new Blob([buffer], { type: 'application/gzip' }), filename);

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Telegram sendDocument failed: ${txt}`);
    }
    return res.json();
  }

  async function sendBackup(pool) {
    const TABLES = ['users', 'config_types', 'config_sizes', 'config_godowns', 'tiles', 'audit_logs'];
    const dump = { version: 1, service: 'inventory', generatedAt: new Date().toISOString(), tables: {} };
    for (const t of TABLES) {
      try {
        const { rows } = await pool.query(`SELECT * FROM ${t} ORDER BY 1`);
        dump.tables[t] = rows;
      } catch { dump.tables[t] = []; }
    }

    const json = JSON.stringify(dump, null, 2);
    const compressed = await gzipAsync(Buffer.from(json, 'utf-8'));
    const date = new Date().toISOString().slice(0, 10);
    const filename = `inventory-backup-${date}.json.gz`;
    const caption = `📦 Inventory Backup — ${date}\nTiles: ${dump.tables.tiles?.length ?? 0} | Logs: ${dump.tables.audit_logs?.length ?? 0}`;

    const results = { sent: [], failed: [] };
    for (const chatId of CHAT_IDS) {
      try {
        await sendDocument(chatId, compressed, filename, caption);
        console.log(`Telegram backup sent to ${chatId}`);
        results.sent.push(chatId);
      } catch (err) {
        console.error(`Telegram backup failed for chat ${chatId}: ${err.message}`);
        results.failed.push({ chatId, error: err.message });
      }
    }

    if (results.sent.length === 0) {
      throw new Error(`Backup failed for all chats: ${results.failed.map(f => f.chatId + ': ' + f.error).join('; ')}`);
    }

    return { ok: true, rows: dump.tables.tiles?.length, ...results };
  }

  module.exports = { sendBackup };
  