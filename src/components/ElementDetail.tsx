import { ELEMENTS, FAMILY_BY_ID, getElement, getIsotope } from '../data';
import { HIGHLIGHTS } from '../data/highlights';
import type { ElementData } from '../data/types';
import { filingException } from '../engine/config';
import { chargeLabel, ionCharges, isotopeName, isotopeNotation, particles } from '../engine/atom';
import { formatDensity, formatNumber, formatTemp, outerShellElectrons, physicalPropertiesUncertain, relatedElements } from '../engine/display';
import { AtomDiagram } from './AtomDiagram';
import { FamilyMark } from './FamilyMark';

function Row({ k, v, note }: { k: string; v: React.ReactNode; note?: string }) {
  return (
    <div className="prop">
      <dt>{k}</dt>
      <dd>{v}{note && <span className="prop-note"> {note}</span>}</dd>
    </div>
  );
}

const NICE_EXPLANATION: Record<string, string> = {
  Cr: 'A half-filled 3d subshell (5 electrons) is especially stable, so one 4s electron moves into 3d.',
  Cu: 'A completely filled 3d subshell (10 electrons) is especially stable, so one 4s electron moves into 3d.',
};

export function ElementDetail({ el, compact = false }: { el: ElementData; compact?: boolean }) {
  const fam = FAMILY_BY_ID[el.family];
  const iso = getIsotope(el, el.defaultIsotope)!;
  const p = particles(el.number, iso.mass);
  const highlight = HIGHLIGHTS[el.symbol];
  const exception = el.electronConfig ? filingException(el.number, el.electronConfig) : null;
  const related = relatedElements(ELEMENTS, el);
  const ions = ionCharges(el).filter((c) => c !== 0);
  const uncertain = physicalPropertiesUncertain(el);
  const radius = el.radiusPm.empirical ?? el.radiusPm.calculated ?? el.radiusPm.covalent;
  const radiusKind = el.radiusPm.empirical !== null ? 'empirical' : el.radiusPm.calculated !== null ? 'calculated' : 'covalent';

  // On narrow screens the detail is the whole page, so its title is the page heading.
  const Title = compact ? 'h1' : 'h2';
  const Sub = compact ? 'h2' : 'h3';

  return (
    <article className="detail" aria-labelledby="el-title">
      <header className="detail-head" data-family={el.family}>
        <div className="big-tile" data-family={el.family} aria-hidden="true">
          <span className="big-num">{el.number}</span>
          <span className="big-sym sci">{el.symbol}</span>
        </div>
        <div>
          <Title id="el-title" className="detail-title">{el.name}</Title>
          <p className="detail-fam">
            <FamilyMark family={el.family} size={12} /> {fam.label}
            {el.familyPredicted && <span className="tag predicted">Predicted classification</span>}
          </p>
          <p className="muted detail-sub">Atomic number {el.number} · {el.group && el.family !== 'lanthanide' && el.family !== 'actinide' ? `group ${el.group}, ` : ''}period {el.period} · <span className="nowrap">{el.block}-block</span></p>
        </div>
      </header>

      <section aria-labelledby="sec-over">
        <Sub id="sec-over">Overview and properties</Sub>
        {uncertain && (
          <p className="callout warn">Most physical properties of {el.name} have never been measured. Any values shown here may be predictions or estimates.</p>
        )}
        <dl className="props">
          <Row k="Relative atomic mass" v={formatNumber(el.relativeAtomicMass)} note="weighted average of isotopes" />
          <Row k="Physical state" v={el.phase ?? 'Not available'} note={`(${el.phaseRef})`} />
          <Row k="Appearance" v={el.appearance ?? 'Not available'} />
          <Row k="Density" v={formatDensity(el.density)} />
          <Row k="Melting point" v={formatTemp(el.meltingPointK)} />
          <Row k="Boiling point" v={formatTemp(el.boilingPointK)} />
          <Row k="Electronegativity" v={formatNumber(el.electronegativity)} note="Pauling scale" />
          <Row k="First ionisation energy" v={formatNumber(el.firstIonisationKJ, 'kJ/mol')} />
          <Row k="Atomic radius" v={radius === null ? 'Not available' : `${radius} pm`} note={radius === null ? undefined : `(${radiusKind})`} />
          {el.discovered && <Row k="Discovered" v={`${el.discovered.year !== null && el.discovered.year < 0 ? `${Math.abs(el.discovered.year)} BCE` : el.discovered.year ?? 'Unknown'}${el.discovered.by ? `, ${el.discovered.by}` : ''}`} />}
        </dl>
      </section>

      <section aria-labelledby="sec-atom">
        <Sub id="sec-atom">Atomic structure</Sub>
        <p className="muted">
          Shown for {isotopeName(el.name, iso.mass)} ({isotopeNotation(el.symbol, iso.mass)}),{' '}
          {el.defaultIsotopeBasis === 'most-abundant' ? 'the most abundant natural isotope' : 'a representative isotope (this element has no stable natural isotopes)'}.
          Other isotopes have different numbers of neutrons.
        </p>
        <AtomDiagram name={el.name} protons={p.protons} neutrons={p.neutrons} shells={el.shells} charge={0} massNumber={iso.mass} size={compact ? 280 : 320} />
        <p className="counts">
          <span><b>{p.protons}</b> protons</span>
          <span><b>{p.neutrons}</b> neutrons</span>
          <span><b>{p.electrons}</b> electrons</span>
        </p>
        <a className="btn" href={`#/atom/${el.number}`}>Open in atomic explorer</a>
        <details className="isotope-list">
          <summary>Isotopes ({el.isotopes.length})</summary>
          <ul>
            {el.isotopes.map((i) => (
              <li key={i.mass}>
                <span className="sci">{isotopeNotation(el.symbol, i.mass)}</span>: {i.neutrons} neutrons,{' '}
                {i.abundance !== null ? `${i.abundance}% of natural ${el.name}` : i.stable ? 'stable' : 'radioactive'}
              </li>
            ))}
          </ul>
        </details>
      </section>

      <section aria-labelledby="sec-config">
        <Sub id="sec-config">Electron configuration</Sub>
        {el.configPredicted && <p className="callout warn">This configuration is predicted, not measured.</p>}
        <dl className="props">
          <Row k="Shortened" v={<span className="sci cfg">{el.electronConfigShort}</span>} />
          <Row k="Full" v={<span className="sci cfg">{el.electronConfig}</span>} />
          <Row k="Electrons per shell" v={el.shells.join(', ')} note="(simplified shell model)" />
        </dl>
        {exception?.isException && (
          <p className="callout">
            <b>{el.name} is an exception to the simple filling order.</b>{' '}
            {exception.differences.map((d) => `${d.subshell}: ${d.expected} expected, ${d.actual} actual`).join('; ')}.{' '}
            {NICE_EXPLANATION[el.symbol] ?? 'The energies of neighbouring subshells are very close, so the lowest-energy arrangement differs from the simple order.'}
          </p>
        )}
      </section>

      <section aria-labelledby="sec-use">
        <Sub id="sec-use">Uses and occurrence</Sub>
        {highlight ? (
          <>
            <p><b>Uses.</b> {highlight.uses}</p>
            <p><b>Where it is found.</b> {highlight.occurrence}</p>
            <p className="muted small">Draft notes, not yet reviewed by a chemistry teacher.</p>
          </>
        ) : (
          <p className="muted">No written notes for {el.name} yet.{' '}
            {el.crustAbundancePercent ? `It makes up about ${el.crustAbundancePercent}% of the Earth’s crust by mass.` : ''}</p>
        )}
      </section>

      <section aria-labelledby="sec-beh">
        <Sub id="sec-beh">Chemical behaviour</Sub>
        <p>{fam.blurb}</p>
        <p>
          Outer-shell electrons (simplified model): <b>{outerShellElectrons(el)}</b>.
          {ions.length > 0 && <> Common ion{ions.length > 1 ? 's' : ''}: {ions.map((c, i) => <span key={c}>{i > 0 && ', '}<span className="sci">{el.symbol}{chargeLabel(c) === '+' || chargeLabel(c) === '−' ? '' : ''}<sup>{chargeLabel(c)}</sup></span></span>)}.</>}
          {el.family === 'noble-gas' && ' It has a full outer shell, so it rarely forms ions or compounds.'}
        </p>
        {el.oxidationStates && <p className="muted small">Oxidation states in the data: {el.oxidationStates}</p>}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="sec-rel">
          <Sub id="sec-rel">Related elements</Sub>
          <p className="muted small">{el.family === 'lanthanide' || el.family === 'actinide' ? 'Neighbours in the same row.' : `Others in group ${el.group}, which have the same number of outer-shell electrons and similar chemistry.`}</p>
          <div className="chips">
            {related.map((r) => (
              <a key={r.number} className="chip" href={`#/explore/${r.number}`}>
                <span className="sci">{r.symbol}</span> {getElement(r.number)!.name}
              </a>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
