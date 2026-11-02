import type { ElementData } from '../data/types';
import { FAMILY_BY_ID } from '../data';
import { FamilyMark } from './FamilyMark';

export function ElementList({ elements, selected }: { elements: ElementData[]; selected: number | null }) {
  if (elements.length === 0) {
    return <p className="empty">No element matches. Try a name (iron), a symbol (Fe) or an atomic number (26).</p>;
  }
  return (
    <ul className="elist" aria-label="Elements">
      {elements.map((e) => (
        <li key={e.number}>
          <a href={`#/explore/${e.number}`} aria-current={selected === e.number ? 'true' : undefined}>
            <span className="elist-num">{e.number}</span>
            <span className="elist-sym sci">{e.symbol}</span>
            <span className="elist-name">{e.name}</span>
            <span className="elist-fam muted"><FamilyMark family={e.family} /> {FAMILY_BY_ID[e.family].label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
