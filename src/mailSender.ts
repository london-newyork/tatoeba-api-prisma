import sgMail from '@sendgrid/mail';
import { ResponseError } from '@sendgrid/helpers/classes';

require('dotenv').config();

export const sendRegistrationAuthEmail = async (
  token: string,
  email: string
) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

  const message = {
    from: {
      name: 'Tatoeba事務局',
      email: process.env.EMAIL_FROM as string,
    },
    to: {
      name: '宛先',
      email: email as string,
    },
    bcc: [process.env.EMAIL_BCC as string],
    subject: '新規会員登録(仮)',
    text: [
      'この度は新規会員登録をしていただき、誠にありがとうございます。',
      'お手数ですが、以下のURLから会員登録完了ページへ遷移し、会員登録を完了させていただけますようお願い申し上げます。',
      '万が一メールにお心当たりのない場合は、破棄していただけますようお願いいたします。',
      `${process.env.FRONTEND_URL}registrations/?token=${token}`,
    ].join('\n'),
  };

  try {
    const response = await sgMail.send(message);
    console.info(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
    if (err instanceof ResponseError) {
      console.debug(JSON.stringify(err.response.body, null, 2));
    }
  }
};
