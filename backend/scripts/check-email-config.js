import dotenv from 'dotenv';
import { isEmailConfigured } from '../utils/brevoMailer.js';

// Load environment variables
dotenv.config();

console.log('\n📧 Email Configuration Check\n');
console.log('='.repeat(50));

// Check JWT_SECRET
if (process.env.JWT_SECRET) {
  console.log('✅ JWT_SECRET: Configured');
} else {
  console.log('❌ JWT_SECRET: NOT configured');
  console.log('   → Add JWT_SECRET to your .env file');
}

console.log('');

// Check Brevo configuration
if (isEmailConfigured()) {
  console.log('✅ Email Service: Configured');
  console.log(`   → SMTP Host: ${process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com'}`);
  console.log(`   → SMTP Port: ${process.env.BREVO_SMTP_PORT || '587'}`);
  console.log(`   → SMTP User: ${process.env.BREVO_SMTP_USER}`);
  console.log(`   → SMTP Pass: ${process.env.BREVO_SMTP_PASS ? '***' + process.env.BREVO_SMTP_PASS.slice(-4) : 'NOT SET'}`);
} else {
  console.log('❌ Email Service: NOT configured');
  console.log('');
  console.log('   Missing configuration:');
  if (!process.env.BREVO_SMTP_USER) {
    console.log('   → BREVO_SMTP_USER is not set');
  }
  if (!process.env.BREVO_SMTP_PASS) {
    console.log('   → BREVO_SMTP_PASS is not set');
  }
  console.log('');
  console.log('   To fix this:');
  console.log('   1. Sign up at https://www.brevo.com');
  console.log('   2. Get your SMTP credentials from Settings → SMTP & API');
  console.log('   3. Add them to your .env file:');
  console.log('      BREVO_SMTP_USER=your-email@example.com');
  console.log('      BREVO_SMTP_PASS=your-smtp-key');
  console.log('   4. See BREVO_SETUP_GUIDE.md for detailed instructions');
}

console.log('');
console.log('='.repeat(50));
console.log('');

if (isEmailConfigured() && process.env.JWT_SECRET) {
  console.log('✅ All email configuration is ready!');
  console.log('   You can now use the forgot password feature.');
} else {
  console.log('⚠️  Configuration incomplete. Please fix the issues above.');
}

console.log('');
