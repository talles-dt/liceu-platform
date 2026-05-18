import dynamic from 'next/dynamic';

const ResetPasswordPage = dynamic(
  () => import('./ResetPasswordPageContent'),
  { ssr: false }
);

export default ResetPasswordPage;