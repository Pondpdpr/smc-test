import { Button, Html, Text } from '@react-email/components';
import * as React from 'react';

type VerifyEmailProps = {
  firstName: string;
  url: string;
};

// Written with React.createElement (not JSX/.tsx) - this repo's SWC build
// (nest-cli.json builder: "swc") does not compile .tsx files into dist
// (verified: the pre-existing template.default.tsx never made it into a
// build either), so .tsx here would work in dev but silently 404/500 in prod.
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
