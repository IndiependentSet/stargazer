import { Button } from '../../themes/stargazer/kit/Button';

interface Props {
  /** a run is in flight */
  running: boolean;
  /** the sky on screen no longer matches the settings */
  stale: boolean;
  onGenerate: () => void;
  /** what it makes: "Generate" for a sky, "Generate the week" for a schedule */
  label?: string;
}

/** The one way an admin page starts generating: gold while the settings have moved on from what is shown, quiet once it is current. */
export function GenerateButton({ running, stale, onGenerate, label = 'Generate' }: Props) {
  return (
    <Button size="xs" kind={stale && !running ? 'primary' : 'soft'} disabled={running} onClick={onGenerate}
      title={stale ? 'settings changed since this was made' : 'make it again'}>
      {running ? 'Generating…' : stale ? label : `${label} again`}
    </Button>
  );
}
