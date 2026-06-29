const SHELL_AMBIENT_BG = [
  'radial-gradient(ellipse 90% 70% at 100% 0%, rgba(96, 165, 250, 0.35), transparent 58%)',
  'radial-gradient(ellipse 70% 55% at 0% 100%, rgba(129, 140, 248, 0.28), transparent 55%)',
  'radial-gradient(ellipse 50% 40% at 40% 30%, rgba(191, 219, 254, 0.25), transparent 60%)',
  'linear-gradient(165deg, #f0f4ff 0%, #eef2ff 35%, #f8fafc 70%, #f1f5f9 100%)',
].join(', ');

export function ShellAmbient() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 contain-strict"
      style={{ background: SHELL_AMBIENT_BG }}
      aria-hidden
    />
  );
}
