import { Resend } from "resend";

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing env var: RESEND_API_KEY");
  const client=new Resend(apiKey);
  const send=client.emails.send.bind(client.emails);
  client.emails.send=async (...args:Parameters<typeof send>)=>{const result=await send(...args);if(result.error)throw new Error("Email provider rejected the message");return result;};
  return client;
}
