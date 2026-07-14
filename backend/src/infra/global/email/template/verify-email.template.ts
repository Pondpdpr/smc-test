import { Button, Html, Text } from '@react-email/components';
import * as React from 'react';

type VerifyEmailProps = {
  firstName: string;
  url: string;
};

// React.createElement, not JSX/.tsx - this repo's SWC build doesn't compile .tsx
// into dist, so a .tsx template works in dev but silently 404/500s in prod.
export default function VerifyEmailTemplate({
  firstName,
  url,
}: VerifyEmailProps) {
  return React.createElement(
    Html,
    { lang: 'en' },
    React.createElement(Text, null, `Hi ${firstName},`),
    React.createElement(
      Text,
      null,
      'Please confirm your email address to finish setting up your account.',
    ),
    React.createElement(Button, { href: url }, 'Verify email'),
    React.createElement(Text, null, 'This link expires in 24 hours.'),
  );
}
