import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { render } from '@react-email/render';
import Mail from 'nodemailer/lib/mailer';

import { AppConfig } from '@/infra/config';
import { ApiException } from '@/shared/http/http.exception';

import { NODE_MAILER } from './email.provider';

@Injectable()
export class EmailService {
  constructor(
    @Inject(NODE_MAILER)
    private mail: Mail,
    private configService: ConfigService,
  ) {}

  async send(
    email: string,
    subject: string,
    template: React.JSX.Element,
  ): Promise<void> {
    try {
      await this._sendMail(email, subject, template);
    } catch (error) {
      throw new ApiException(500, 'failSendingEmail', { error });
    }
  }

  async sendMany(
    emails: string[],
    subject: string,
    template: React.JSX.Element,
  ): Promise<void> {
    await Promise.all(
      emails.map((email) => this._sendMail(email, subject, template)),
    );
  }

  // Volatile function will raise error
  private async _sendMail(
    email: string,
    subject: string,
    template: React.JSX.Element,
  ) {
    const emailHtml = await render(template);
    return this.mail.sendMail({
      from: this._getFrom(),
      to: email,
      html: emailHtml,
      subject,
    });
  }

  private _getFrom() {
    const emailConfig =
      this.configService.getOrThrow<AppConfig['email']>('email');
    return emailConfig.from;
  }
}
