import sgMail from '@sendgrid/mail';
import { ResponseError } from '@sendgrid/helpers/classes';

require('dotenv').config();

export const sendConfirmRegistrationAuthPassword = async (email: string) => {
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
    subject: '新規会員登録完了',
    text: [
      'Tatoeba事務局でございます。',
      'ご本人確認ができましたため、新規会員登録が完了いたしました。',
      '引き続きTatoebaをお楽しみください。',
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
