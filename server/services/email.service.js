const transporter = require('../config/email');

class EmailService {
  async sendMemberInvite({ to, memberName, uniqueId, gymName }) {
    const subject = `Welcome to ${gymName} - Your Member ID`;
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f6ff; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(39,46,66,0.08);">
          <h1 style="font-family: 'Manrope', Arial, sans-serif; color: #0050d4; margin: 0 0 8px;">GymFlow</h1>
          <p style="color: #6f768e; margin: 0 0 32px; font-size: 14px;">Precision Management for Kinetic Ateliers</p>
          <h2 style="color: #272e42; margin: 0 0 16px;">Welcome, ${memberName}!</h2>
          <p style="color: #535b71; line-height: 1.6;">You have been registered as a member at <strong>${gymName}</strong>.</p>
          <div style="background: linear-gradient(135deg, #0050d4, #0046bb); color: white; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;">Your Unique Member ID</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; font-family: 'Manrope', Arial, sans-serif;">${uniqueId}</p>
          </div>
          <p style="color: #535b71; line-height: 1.6;">Use this ID to connect to the GymFlow mobile app. Your gym will be automatically identified.</p>
          <p style="color: #6f768e; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} Kinetic Precision Systems. All Rights Reserved.</p>
        </div>
      </div>
    `;
    const text = `Welcome to ${gymName}, ${memberName}! Your unique member ID is: ${uniqueId}. Use this ID to connect to the GymFlow mobile app.`;

    return transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@gymflow.com',
      to,
      subject,
      html,
      text
    });
  }

  async sendStaffInvite({ to, staffName, uniqueId, gymName }) {
    const subject = `Welcome to ${gymName} Staff - Your Staff ID`;
    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f6f6ff; padding: 40px 20px;">
        <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(39,46,66,0.08);">
          <h1 style="font-family: 'Manrope', Arial, sans-serif; color: #0050d4; margin: 0 0 8px;">GymFlow</h1>
          <p style="color: #6f768e; margin: 0 0 32px; font-size: 14px;">Staff Management Portal</p>
          <h2 style="color: #272e42; margin: 0 0 16px;">Welcome, ${staffName}!</h2>
          <p style="color: #535b71; line-height: 1.6;">You have been added as a staff member at <strong>${gymName}</strong>.</p>
          <div style="background: linear-gradient(135deg, #006286, #005675); color: white; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8;">Your Staff ID</p>
            <p style="margin: 0; font-size: 28px; font-weight: 700; font-family: 'Manrope', Arial, sans-serif;">${uniqueId}</p>
          </div>
          <p style="color: #535b71; line-height: 1.6;">This ID has been linked to your email and can be used for authentication purposes.</p>
          <p style="color: #6f768e; font-size: 12px; margin-top: 32px;">© ${new Date().getFullYear()} Kinetic Precision Systems. All Rights Reserved.</p>
        </div>
      </div>
    `;
    const text = `Welcome to ${gymName} staff, ${staffName}! Your unique staff ID is: ${uniqueId}.`;

    return transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@gymflow.com',
      to,
      subject,
      html,
      text
    });
  }
}

module.exports = new EmailService();
