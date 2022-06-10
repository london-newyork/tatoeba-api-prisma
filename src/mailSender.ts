import sgMail from '@sendgrid/mail';
import { ResponseError } from '@sendgrid/helpers/classes';

require('dotenv').config();

export const sendRegistrationAuthEmail = async (props: any) => {
  const { token } = props;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

  const message = {
    from: {
      name: '差出人',
      email: process.env.EMAIL_FROM as string,
    },
    to: {
      name: '宛先',
      email: process.env.EMAIL_TO as string,
    },
    bcc: [process.env.EMAIL_BCC as string],
    subject: 'ここに件名が入ります',
    text: [
      'この度は新規会員登録をしていただき、誠にありがとうございます。',
      'お手数ですが、以下のURLから会員登録完了ページへ遷移し、会員登録を完了させていただけますようお願いいたします。',
      `http://localhost:3000/registrations/complete/&${token}`,
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
