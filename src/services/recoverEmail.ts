import { EmailConfig } from 'next-auth/providers';
import nodemailer from 'nodemailer';
import { nextUrl } from '../utils/nextUrl';

interface RecoverRequest {
  identifier: string;
  url: string;
  token: string;
  baseUrl: string;
  provider?: EmailConfig;
}

type Html = ({
  url,
  site,
  email,
  token,
}: {
  url: string;
  site: string;
  email: string;
  token?: string;
}) => string;

type Text = ({
  url,
  site,
  email,
}: {
  url: string;
  site: string;
  email?: string;
}) => string;

// Email HTML body
const html: Html = ({ url, email }) => {
  // Insert invisible space into domains and email address to prevent both the
  // email address and the domain from being turned into a hyperlink by email
  // clients like Outlook and Apple mail, as this is confusing because it seems
  // like they are supposed to click on their email address to sign in.
  const escapedEmail = `${email.replace(/\./g, '&#8203;.')}`;
  const escapedSite = `${'MCE Onboarding'.replace(/\./g, '&#8203;.')}`;

  // Some simple styling options
  const backgroundColor = '#f9f9f9';
  const textColor = '#444444';
  const mainBackgroundColor = '#ffffff';
  const buttonBackgroundColor = '#346df1';
  const buttonBorderColor = '#346df1';
  const buttonTextColor = '#ffffff';

  // Uses tables for layout and inline CSS due to email client limitations
  return `
<body style="background: ${backgroundColor};">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 10px 0px 20px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
        <strong>${escapedSite}</strong>
      </td>
    </tr>
  </table>
  <table width="100%" border="0" cellspacing="20" cellpadding="0" style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center" style="padding: 10px 0px 0px 0px; font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
        Recuperar senha de <strong>${escapedEmail}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}"><a href="${url}" target="_blank" style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; text-decoration: none;border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">Recuperar senha</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;
};

// Email text body – fallback for email clients that don't render HTML
const text: Text = ({ url, site }) =>
  Buffer.from(
    `Recuperação de senha para a plataforma MCE ${site}\n${url}\n\n`,
    'utf8'
  ).toString();

export async function recoverRequest({
  identifier: email,
  token,
  baseUrl,
  provider,
}: RecoverRequest): Promise<void> {
  try {
    const providerSpill = !provider
      ? { server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM }
      : provider;
    const { server, from } = providerSpill;
    // Strip protocol from URL and use domain as site name
    const site = baseUrl.replace(/^https?:\/\//, '');
    const callbackLink = `${nextUrl}/recovery/callback?email=${email}&token=${token}`;
    const encodedLink = Buffer.from(callbackLink, 'utf-8').toString();

    await nodemailer.createTransport(server).sendMail({
      to: email,
      from,
      subject: Buffer.from(
        `Recuperação de senha MCE Onboarding`,
        'utf8'
      ).toString(),
      text: text({ url: encodedLink, site, email }),
      html: html({ url: encodedLink, site, email, token }),
    });
    return;
  } catch (err) {
    throw new Error('Error');
  }
}
