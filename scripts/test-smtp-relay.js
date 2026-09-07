let nodemailer;
try {
  nodemailer = require('/app/node_modules/nodemailer');
} catch {
  try {
    nodemailer = require('/app/packages/twenty-server/node_modules/nodemailer');
  } catch {
    nodemailer = require('nodemailer');
  }
}

async function testSmtp() {
  const host = process.env.EMAIL_SMTP_HOST || 'smtp-relay.brevo.com';
  const port = parseInt(process.env.EMAIL_SMTP_PORT || '587', 10);
  const user = process.env.EMAIL_SMTP_USER || 'anh.legiang@gmail.com';
  const pass = process.env.EMAIL_SMTP_PASSWORD;
  const from = `${process.env.EMAIL_FROM_NAME || 'Crove CRM'} <${process.env.EMAIL_FROM_ADDRESS || 'crm@crove.com'}>`;
  const to = 'anh.legiang@gmail.com';

  console.log(`Testing SMTP connection to ${host}:${port}...`);
  console.log(`User: ${user}`);
  console.log(`From: ${from} -> To: ${to}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  await transporter.verify();
  console.log('✅ SMTP connection verified successfully with Brevo!');

  const info = await transporter.sendMail({
    from,
    to,
    subject: '🧪 [Crove CRM] Test Transactional Email via Brevo SMTP Relay',
    text: 'Hello from Crove CRM v2.38.0! Brevo SMTP Relay is configured and working perfectly.',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e53e3e;">Crove CRM System Test</h2>
        <p>This is a test transactional email sent via <strong>Brevo SMTP Relay</strong> from <code>crm@crove.com</code>.</p>
        <p>✅ SMTP Port 587 Connected<br/>✅ Authentication Verified<br/>✅ Delivery Confirmed</p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <small style="color: #888;">Crove OS & CRM Ecosystem</small>
      </div>
    `,
  });

  console.log('✅ Test email sent successfully! MessageId:', info.messageId);
}

testSmtp().catch((err) => {
  console.error('❌ SMTP Test Failed:', err);
  process.exit(1);
});
