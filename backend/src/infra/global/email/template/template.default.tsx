import * as React from 'react';
import { Html, Button } from '@react-email/components';

type DefaultProps = {
  url: string;
};

export default function TemplateDefault({ url }: DefaultProps) {
  return (
    <Html lang="en">
      <Button href={url}>Click me</Button>
    </Html>
  );
}
