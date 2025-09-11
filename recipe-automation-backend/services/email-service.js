const nodemailer = require('nodemailer');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()]
});

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });
  }

  async sendReport(data) {
    const { websitesProcessed, recipesCollected, duration } = data;
    const durationMinutes = Math.round(duration / 1000 / 60);
    
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Recipe Automation Report - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>Recipe Automation Completed</h2>
        <p>Your daily recipe automation has finished successfully.</p>
        
        <h3>Summary:</h3>
        <ul>
          <li><strong>Websites Processed:</strong> ${websitesProcessed}</li>
          <li><strong>Total Recipes Collected:</strong> ${recipesCollected}</li>
          <li><strong>Duration:</strong> ${durationMinutes} minutes</li>
          <li><strong>Average per Website:</strong> ${Math.round(recipesCollected / websitesProcessed)} recipes</li>
        </ul>
        
        <p>All recipes have been saved to your Notion database.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated message from your Recipe Automation System.
        </p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Report email sent successfully');
    } catch (error) {
      logger.error('Failed to send email:', error);
    }
  }

  async sendError(error) {
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `Recipe Automation Error - ${new Date().toLocaleDateString()}`,
      html: `
        <h2>Recipe Automation Error</h2>
        <p>An error occurred during the recipe automation process.</p>
        
        <h3>Error Details:</h3>
        <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">
${error.message}
${error.stack}
        </pre>
        
        <p>Please check the server logs for more information.</p>
        
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated error message from your Recipe Automation System.
        </p>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      logger.info('Error email sent');
    } catch (emailError) {
      logger.error('Failed to send error email:', emailError);
    }
  }
}

module.exports = new EmailService();
