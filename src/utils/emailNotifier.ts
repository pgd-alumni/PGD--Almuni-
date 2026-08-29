import { EventRegistration, MemberJoinRequest, EmailNotificationPayload } from '../types';

export function createEventApprovalEmail(reg: EventRegistration, eventVenue?: string, eventDate?: string, eventTime?: string): EmailNotificationPayload {
  const recipientEmail = reg.memberEmail || (reg.emailOrWhatsApp.includes('@') ? reg.emailOrWhatsApp : 'alumni@butex.edu.bd');
  const subject = `Confirmation: Registration Approved for ${reg.eventTitle} — BUTEX PGD Alumni`;

  const dateText = eventDate || reg.paymentSubmissionDate || "Upcoming Schedule";
  const venueText = eventVenue || "BUTEX Campus / Online";
  const timeText = eventTime || "10:00 AM";

  const contentText = `Dear ${reg.studentName},

Congratulations! Your registration for the event "${reg.eventTitle}" has been officially APPROVED & CONFIRMED by the BUTEX PGD Alumni Executive Committee.

EVENT DETAILS:
- Event: ${reg.eventTitle}
- Date: ${dateText}
- Time: ${timeText}
- Venue: ${venueText}

REGISTRATION & TICKET INFORMATION:
- Attendee Name: ${reg.studentName}
- Student / Roll No: ${reg.studentId}
- Registration ID: ${reg.id}
- Transaction ID: ${reg.transactionId}
- Payment Gateway: ${reg.paymentGateway || reg.paymentMethod}
- Status: Confirmed & VIP Verified

Please bring this email or your Digital Alumni ID card on your mobile device at the entry desk.

For any queries or schedule updates, feel free to reply to this email or reach us at butexpgdalumni@gmail.com.

Warm regards,
BUTEX PGD Alumni Association
Executive Committee
Tejgaon, Dhaka-1208, Bangladesh
https://ais-dev-s2gwmg3lcl4rjyvtkj4rp5-155346389596.asia-southeast1.run.app`;

  const contentHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #002147; padding: 24px; text-align: center; border-bottom: 4px solid #FFBF00;">
      <h1 style="color: #FFBF00; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">BUTEX PGD Alumni Association</h1>
      <p style="color: #ffffff; margin: 6px 0 0 0; font-size: 13px;">Official Event Registration Confirmation</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="font-size: 16px; color: #1e293b; font-weight: bold;">Dear ${reg.studentName},</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We are thrilled to inform you that your registration for <strong>"${reg.eventTitle}"</strong> has been <span style="color: #16a34a; font-weight: bold;">OFFICIALLY APPROVED</span> by the BUTEX PGD Alumni Executive Committee!
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <h3 style="color: #002147; margin: 0 0 12px 0; font-size: 15px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Event Details</h3>
        <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; font-weight: bold; width: 35%;">Event Title:</td><td>${reg.eventTitle}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Date & Time:</td><td>${dateText} (${timeText})</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Venue:</td><td>${venueText}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Attendee Name:</td><td>${reg.studentName}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Roll / Student ID:</td><td>${reg.studentId}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Trx ID / Ref:</td><td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${reg.transactionId}</code> (${reg.paymentGateway || reg.paymentMethod})</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Pass Status:</td><td><span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 99px; font-weight: bold; font-size: 11px;">CONFIRMED & VERIFIED</span></td></tr>
        </table>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
        Please save this email on your smartphone as your entry ticket. We look forward to seeing you at the event!
      </p>

      <div style="text-align: center; margin-top: 24px;">
        <a href="https://wa.me/?text=I%20am%20attending%20${encodeURIComponent(reg.eventTitle)}" style="background-color: #002147; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-block;">
          Join Alumni Discussion
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
      Bangladesh University of Textiles (BUTEX) • Post Graduate Diploma Alumni Association<br/>
      Tejgaon, Dhaka-1208 • Contact: butexpgdalumni@gmail.com
    </div>
  </div>`;

  return {
    to: recipientEmail,
    subject,
    recipientName: reg.studentName,
    type: 'event_approval',
    contentHtml,
    contentText
  };
}

export function createWelcomeMemberEmail(member: MemberJoinRequest | { name: string; email: string; rollNo?: string; company?: string; designation?: string; batch?: string; phone?: string }): EmailNotificationPayload {
  const recipientEmail = member.email || 'alumni@butex.edu.bd';
  const subject = `🎉 Welcome to BUTEX PGD Alumni Association! You are now part of this PGD Alumni`;

  const rollText = member.rollNo || "PGD Alumni";
  const batchText = member.batch || "Post Graduate Diploma";
  const companyText = member.company ? `${member.company}${member.designation ? ` (${member.designation})` : ''}` : (member.designation || 'Apparel & Textile Industry');

  const contentText = `Dear ${member.name},

Congratulations and a very warm welcome!

You are officially registered and approved as a verified member of the BUTEX Post Graduate Diploma (PGD) Alumni Association. You are now an active part of this prestigious professional alumni network!

YOUR REGISTERED ALUMNI PROFILE:
- Full Name: ${member.name}
- Roll / ID: ${rollText}
- Batch: ${batchText}
- Current Organization: ${companyText}
- Verified Contact: ${member.phone || 'Recorded'}
- Official Status: Verified Member of PGD Alumni Association

EXCLUSIVE ALUMNI MEMBER BENEFITS NOW UNLOCKED FOR YOU:
1. Master Directory Access: Connect with 410+ GMs, DGM, Merchandising Heads, and Textile Operations leaders.
2. Executive Job Exchange: Access internal apparel, knitwear, and merchandising vacancies posted directly by hiring managers.
3. 1-on-1 Mentorship: Request professional guidance from senior industry leaders across Bangladesh and international hubs.
4. Digital Alumni ID Card: Generate your personalized QR-verified digital PGD alumni credential.
5. Technical Events & Factory Visits: Priority invitations to industry summits, factory automation tours, and symposiums.
6. WhatsApp Community: Network live with your fellow batchmates and industry peers.

ACCESS THE ALUMNI PORTAL:
Visit the portal here: https://ais-dev-s2gwmg3lcl4rjyvtkj4rp5-155346389596.asia-southeast1.run.app

We are proud to have you with us in shaping the future of the global textile and apparel industry.

Warmest regards,

Executive Committee
BUTEX PGD Alumni Association
Bangladesh University of Textiles, Tejgaon, Dhaka
Email: butexpgdalumni@gmail.com`;

  const contentHtml = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
    <div style="background-color: #002147; padding: 28px 24px; text-align: center; border-bottom: 4px solid #FFBF00;">
      <h1 style="color: #FFBF00; margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px;">BUTEX PGD Alumni Association</h1>
      <p style="color: #e2e8f0; margin: 6px 0 0 0; font-size: 14px; font-weight: bold;">Official Membership Welcome Notification</p>
    </div>
    
    <div style="padding: 24px;">
      <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <span style="font-size: 28px;">🎉</span>
        <h2 style="color: #78350f; margin: 4px 0 0 0; font-size: 17px; font-weight: 800;">Congratulations, ${member.name}!</h2>
        <p style="color: #92400e; margin: 4px 0 0 0; font-size: 13px; font-weight: bold;">You are now officially part of this BUTEX PGD Alumni Network</p>
      </div>

      <p style="font-size: 14px; color: #334155; line-height: 1.6;">
        We are thrilled to welcome you as a verified member of the <strong>Bangladesh University of Textiles (BUTEX) Post Graduate Diploma Alumni Association</strong>. Your profile has been successfully integrated into our official database and master directory.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 18px 0;">
        <h3 style="color: #002147; margin: 0 0 10px 0; font-size: 14px; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">Your Verified Alumni Credentials</h3>
        <table style="width: 100%; font-size: 13px; color: #334155; border-collapse: collapse;">
          <tr><td style="padding: 4px 0; font-weight: bold; width: 38%;">Member Name:</td><td><strong>${member.name}</strong></td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Roll / Student ID:</td><td><code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold;">${rollText}</code></td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Batch / Program:</td><td>${batchText}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Current Workplace:</td><td>${companyText}</td></tr>
          <tr><td style="padding: 4px 0; font-weight: bold;">Directory Status:</td><td><span style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 99px; font-weight: bold; font-size: 11px;">ACTIVE & VERIFIED</span></td></tr>
        </table>
      </div>

      <h3 style="color: #002147; margin: 18px 0 8px 0; font-size: 14px;">Your Member Privileges Include:</h3>
      <ul style="font-size: 13px; color: #475569; padding-left: 20px; line-height: 1.6; margin: 0 0 20px 0;">
        <li><strong>Job Vacancies:</strong> Direct access to executive textile & garment jobs posted by alumni hiring managers.</li>
        <li><strong>Mentorship:</strong> Connect 1-on-1 with senior GMs, Operations Heads, and Sourcing Directors.</li>
        <li><strong>Digital Alumni ID Card:</strong> Generate your official QR-coded ID card anytime.</li>
        <li><strong>Events & Seminars:</strong> Factory automation visits, grand reunions, and technical workshops.</li>
      </ul>

      <div style="text-align: center; margin: 24px 0;">
        <a href="https://ais-dev-s2gwmg3lcl4rjyvtkj4rp5-155346389596.asia-southeast1.run.app" style="background-color: #FFBF00; color: #002147; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          Open BUTEX Alumni Portal
        </a>
      </div>
    </div>

    <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">
      Bangladesh University of Textiles (BUTEX) • Post Graduate Diploma Alumni Association<br/>
      Tejgaon, Dhaka-1208 • Contact: butexpgdalumni@gmail.com
    </div>
  </div>`;

  return {
    to: recipientEmail,
    subject,
    recipientName: member.name,
    type: 'welcome_member',
    contentHtml,
    contentText
  };
}

export function openMailClient(emailPayload: EmailNotificationPayload) {
  const mailtoUrl = `mailto:${encodeURIComponent(emailPayload.to)}?subject=${encodeURIComponent(emailPayload.subject)}&body=${encodeURIComponent(emailPayload.contentText)}`;
  window.open(mailtoUrl, '_blank');
}

export async function dispatchEmailApi(payload: EmailNotificationPayload): Promise<{ success: boolean; message: string; method?: string }> {
  try {
    const res = await fetch('/api/notify/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("API email dispatch unreachable, fallback to client mailer:", err);
    return {
      success: true,
      message: `Email prepared for ${payload.to}`,
      method: 'client-fallback'
    };
  }
}
