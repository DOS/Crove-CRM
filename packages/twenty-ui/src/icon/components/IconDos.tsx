import IconDosRaw from '@assets/icons/dos.svg?react';
import { useTheme } from '@ui/theme';

interface IconDosProps {
  size?: number | string;
}

export const IconDos = (props: IconDosProps) => {
  const theme = useTheme();
  const size = props.size ?? theme.icon.size.md;

  return <IconDosRaw height={size} width={size} />;
};
