type MascotMood = 'curious' | 'cheer' | 'think' | 'focus';

const illustrations: Record<MascotMood, { src: string; alt: string }> = {
  curious: {
    src: '/illustrations/open-peeps/peep-14.svg',
    alt: 'Open Peeps character illustration with a curious expression',
  },
  cheer: {
    src: '/illustrations/open-peeps/peep-89.svg',
    alt: 'Open Peeps character illustration celebrating a learning moment',
  },
  think: {
    src: '/illustrations/open-peeps/peep-66.svg',
    alt: 'Open Peeps character illustration considering a problem',
  },
  focus: {
    src: '/illustrations/open-peeps/peep-66.svg',
    alt: 'Open Peeps character illustration representing focused study',
  },
};

export function ChemistryMascot({
  mood = 'curious',
  size = 150,
  className = '',
}: {
  mood?: MascotMood;
  size?: number;
  className?: string;
}) {
  const illustration = illustrations[mood];

  return (
    <img
      className={`chem-mascot ${className}`.trim()}
      src={illustration.src}
      width={size}
      alt={illustration.alt}
      decoding="async"
      draggable={false}
      style={{ width: size, height: 'auto' }}
    />
  );
}
