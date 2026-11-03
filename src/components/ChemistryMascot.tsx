import type { CSSProperties } from 'react';

type MascotMood = 'curious' | 'cheer' | 'think' | 'focus';

const expressions: Record<MascotMood, { mouth: string; brow: string; arm: string }> = {
  curious: { mouth: 'M132 103 Q140 111 148 103', brow: 'M119 78 Q126 73 132 78', arm: 'M174 149 Q190 130 184 113' },
  cheer: { mouth: 'M129 99 Q140 116 152 99', brow: 'M119 75 Q126 68 133 76', arm: 'M174 149 Q196 111 186 91' },
  think: { mouth: 'M134 105 Q141 101 148 105', brow: 'M119 76 Q126 79 132 76', arm: 'M174 149 Q194 126 184 108' },
  focus: { mouth: 'M133 105 Q141 108 149 105', brow: 'M119 78 Q126 75 132 78', arm: 'M174 149 Q188 133 185 119' },
};

export function ChemistryMascot({ mood = 'curious', size = 150, className = '' }: { mood?: MascotMood; size?: number; className?: string }) {
  const face = expressions[mood];
  const style = { width: size, height: 'auto', '--mascot-size': `${size}px` } as CSSProperties;
  return (
    <svg className={`chem-mascot ${className}`} style={style} viewBox="0 0 240 230" role="img" aria-label={mood === 'cheer' ? 'Chemistry student mascot celebrating' : mood === 'think' ? 'Chemistry student mascot thinking' : mood === 'focus' ? 'Chemistry student mascot studying' : 'Curious chemistry student mascot'}>
      <defs>
        <linearGradient id="coat" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8fcff"/><stop offset="1" stopColor="#cbdbea"/></linearGradient>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a95d3c"/><stop offset="1" stopColor="#713b2d"/></linearGradient>
        <linearGradient id="flask" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a5fff0"/><stop offset="1" stopColor="#20b8aa"/></linearGradient>
        <linearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#293342"/><stop offset="1" stopColor="#101827"/></linearGradient>
      </defs>
      <ellipse cx="119" cy="211" rx="67" ry="10" fill="#061827" opacity=".14"/>
      <circle cx="118" cy="112" r="94" fill="#22c7b7" opacity=".09"/>
      <circle cx="192" cy="49" r="13" fill="#f4b84a" opacity=".8"/>
      <path d="M58 201 Q61 158 88 146 L151 146 Q181 157 185 201Z" fill="url(#coat)" stroke="#a9bfd2" strokeWidth="2"/>
      <path d="M102 146 L119 171 L137 146 L149 201 L91 201Z" fill="#e9f2f8"/>
      <path d="M116 148 L126 148 L132 181 L120 193 L108 181Z" fill="#22c7b7"/>
      <path d="M91 151 L108 172 L98 183 L82 161Z" fill="#fff" stroke="#b8cad8" strokeWidth="2"/>
      <path d="M145 151 L131 172 L143 183 L159 161Z" fill="#fff" stroke="#b8cad8" strokeWidth="2"/>
      <path d="M74 161 Q55 171 62 191 Q68 201 81 191 L95 176" fill="none" stroke="url(#skin)" strokeWidth="15" strokeLinecap="round"/>
      <path d={face.arm} fill="none" stroke="url(#skin)" strokeWidth="15" strokeLinecap="round"/>
      <path d="M159 169 L174 153 L185 161 L169 181Z" fill="#d7e5ef"/>
      <path d="M166 105 L166 84 L180 84 L180 105" fill="#e8f5f4" stroke="#159b91" strokeWidth="3"/>
      <path d="M166 101 L180 101 L180 126 Q173 132 166 126Z" fill="url(#flask)" stroke="#159b91" strokeWidth="2"/>
      <path d="M169 113 Q173 108 177 113" fill="none" stroke="#eafffb" strokeWidth="2" strokeLinecap="round"/>
      <path d="M80 76 Q76 29 119 25 Q163 24 166 74 L159 94 L86 94Z" fill="url(#hair)"/>
      <ellipse cx="120" cy="88" rx="42" ry="48" fill="url(#skin)"/>
      <path d="M78 78 Q80 34 119 34 Q154 33 162 69 Q143 59 127 57 Q105 69 78 78Z" fill="url(#hair)"/>
      <path d="M83 66 Q70 82 79 103 Q65 90 70 68 Q75 42 101 32 Q91 48 83 66Z" fill="#202b3a"/>
      <path d={face.brow} fill="none" stroke="#44291f" strokeWidth="3" strokeLinecap="round"/>
      <path d="M141 78 Q148 73 154 78" fill="none" stroke="#44291f" strokeWidth="3" strokeLinecap="round"/>
      <ellipse cx="126" cy="88" rx="3.5" ry="5" fill="#17212d"/>
      <ellipse cx="148" cy="88" rx="3.5" ry="5" fill="#17212d"/>
      <circle cx="127" cy="86" r="1.2" fill="#fff"/><circle cx="149" cy="86" r="1.2" fill="#fff"/>
      <path d={face.mouth} fill="none" stroke="#542d27" strokeWidth="2.8" strokeLinecap="round"/>
      <path d="M113 94 Q107 99 110 103" fill="none" stroke="#8c4c39" strokeWidth="2" opacity=".55"/>
      <path d="M95 143 Q119 155 145 143" fill="none" stroke="#8d4b35" strokeWidth="3" opacity=".45"/>
      <circle cx="87" cy="97" r="5" fill="#d98b70" opacity=".45"/><circle cx="157" cy="97" r="5" fill="#d98b70" opacity=".45"/>
      <path d="M106 181 L120 193 L134 181" fill="none" stroke="#9fb4c6" strokeWidth="2"/>
      <path d="M101 201 L101 184 L112 190 L120 204 L128 190 L139 184 L139 201" fill="none" stroke="#b8cad8" strokeWidth="2"/>
      <path d="M92 159 L84 177 L99 185" fill="none" stroke="#c0d1de" strokeWidth="2"/>
      <path d="M153 159 L160 177 L145 185" fill="none" stroke="#c0d1de" strokeWidth="2"/>
      <circle cx="52" cy="65" r="4" fill="#22c7b7"/><path d="M48 48 L48 39 M43 44 L53 44" stroke="#f4b84a" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
