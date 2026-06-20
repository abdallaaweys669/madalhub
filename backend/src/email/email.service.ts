import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendOtpEmail(to: string, code: string): Promise<void> {
    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const from =
      this.configService.get<string>('EMAIL_FROM')?.trim() ||
      'onboarding@resend.dev';

    if (!apiKey) {
      this.logger.warn(`[DEV] RESEND_API_KEY missing — OTP for ${to}: ${code}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `MadalHub <${from}>`,
        to: [to],
        subject: 'Your MadalHub verification code',
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#FF7B3F;margin:0 0 12px;">Your verification code</h2>
            <p style="color:#374151;line-height:1.5;">Use this code to continue in MadalHub. It expires in 10 minutes.</p>
            <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#111827;margin:24px 0;">${code}</p>
            <p style="color:#9CA3AF;font-size:13px;">If you did not request this, you can ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.error(`Resend failed (${response.status}): ${body}`);
      throw new Error('Failed to send verification email');
    }
  }
}
