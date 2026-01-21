const nodemailer = require('nodemailer');

// Create transporter - using Gmail as example
// For production, use environment variables for credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Alternative: Use SMTP (works with any email provider)
const createSMTPTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

const sendOTPEmail = async (email, otp) => {
  try {
    // Check if email is configured
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    
    console.log('Email configuration check:', {
      hasEmailUser: !!emailUser,
      hasEmailPassword: !!emailPassword,
      emailUserValue: emailUser ? (emailUser.substring(0, 3) + '***') : 'NOT SET',
      emailPasswordValue: emailPassword ? '***SET***' : 'NOT SET'
    });
    
    if (!emailUser || !emailPassword || emailUser === 'your-email@gmail.com' || emailPassword === 'your-app-password') {
      console.error('❌ Email not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env file');
      console.error('📝 See EMAIL_SETUP.md for instructions');
      return { 
        success: false, 
        error: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in backend/.env file. See EMAIL_SETUP.md for instructions.' 
      };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: emailUser,
      to: email,
      subject: 'Password Reset OTP - Quiz App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <h2 style="color: #667eea; text-align: center; margin-bottom: 20px;">🔐 Password Reset Request</h2>
            <p style="color: #333; font-size: 16px; line-height: 1.6;">
              You have requested to reset your password for your Quiz App account.
            </p>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
              <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Your OTP code is:</p>
              <h1 style="color: #667eea; font-size: 36px; letter-spacing: 10px; margin: 0;">${otp}</h1>
            </div>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              This OTP will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This is an automated email. Please do not reply.
            </p>
          </div>
        </div>
      `,
      text: `
        Password Reset Request
        
        You have requested to reset your password for your Quiz App account.
        
        Your OTP code is: ${otp}
        
        This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully! Message ID: ', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to send email. ';
    if (error.code === 'EAUTH') {
      errorMessage += 'Authentication failed. Please check your EMAIL_USER and EMAIL_PASSWORD in .env file. Make sure you\'re using an App Password for Gmail.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage += 'Connection failed. Please check your internet connection and SMTP settings.';
    } else {
      errorMessage += error.message || 'Please try again later.';
    }
    
    return { success: false, error: errorMessage };
  }
};

module.exports = { sendOTPEmail };

