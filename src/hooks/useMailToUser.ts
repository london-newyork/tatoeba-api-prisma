import sgMail from '@sendgrid/mail';

require('dotenv').config();

type Message = {
  from: string | { name: string; email: string | undefined };
  to: string | { name: string; email: string | undefined };
  bcc: [string | undefined];
  subject: string;
  text: string[];
};

export const useMailToUser = async (props: any) => {
  const { token } = props;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

  const message: Message = {
    from: {
      name: '差出人',
      email: process.env.EMAIL_FROM,
    },
    to: {
      name: '宛先',
      email: process.env.EMAIL_TO,
    },
    bcc: [process.env.EMAIL_TO],
    subject: 'ここに件名が入ります',
    text: [
      'こんにちは',
      '新規ご登録ありがとうございます。',
      '以下のURLに遷移してパスワードを入力して新規登録を完了させて下さい。',
      `http://localhost:3000/registrations/complete/${token}`,
    ].concat('\n'),
  };

  try {
    const response = await sgMail.send(message); // <3>
    console.info(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error(err);
    console.debug(JSON.stringify(err.response.body.errors, null, 2));
  }
};
