// testEmail.js — node testEmail.js
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
for (const line of lines) {
  const [key, ...val] = line.split('=');
  if (key && val.length) process.env[key.trim()] = val.join('=').trim();
}

async function testEmail() {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  console.log('🔑 Brevo API Key:', apiKey ? 'Found ✅' : 'NOT FOUND ❌');
  console.log('📧 Sender Email:', senderEmail || 'NOT FOUND ❌');

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      sender: {
        name: 'HelpNow SL',
        email: senderEmail,
      },
      to: [{ email: 'arunadarshana17617@gmail.com' }],
      subject: '✅ HelpNow SL — Brevo Test Email',
      htmlContent: '<h2>මචං Brevo works! 🎉</h2><p>Real users ට දැන් email යනවා!</p>',
    }),
  });

  const data = await res.json();
  console.log('\n📬 Brevo Response:', JSON.stringify(data, null, 2));

  if (data.messageId) {
    console.log('\n✅ Email sent! Gmail inbox check කරන්නකෝ.');
  } else {
    console.log('\n❌ Failed. Error above check කරන්න.');
  }
}

testEmail().catch(console.error);