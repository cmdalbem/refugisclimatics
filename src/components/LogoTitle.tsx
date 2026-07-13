import { APP_TITLE } from '../constants';

interface Props {
  id?: string;
  className?: string;
}

export default function LogoTitle({ id, className = 'logo-title' }: Props) {
  return (
    <h1 id={id} className={className}>
      {APP_TITLE.split(' ')[0]}{' '}
      <span className="logo-title-clima">Climàt</span>ics
    </h1>
  );
}
