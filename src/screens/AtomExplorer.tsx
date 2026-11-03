import { Atom as AtomIcon } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { useEffect, useMemo } from 'react';
import { ELEMENTS, getElement, getIsotope } from '../data';
import { chargeLabel, ionCharges, ionShells, isotopeName, isotopeNotation, particles } from '../engine/atom';
import { isoelectronicNobleGas } from '../engine/display';
import { AtomDiagram } from '../components/AtomDiagram';
import { go, type Route } from '../router';
import { viewElement } from '../engine/progress';
import { useProgress } from '../state/ProgressContext';

function nav(z: number, iso?: number, q?: number) {
  const params = new URLSearchParams();
  if (iso !== undefined) params.set('iso', String(iso));
  if (q) params.set('q', String(q));
  const qs = params.toString();
  go(`atom/${z}${qs ? `?${qs}` : ''}`, true);
}

export function AtomExplorer({ route }: { route: Route }) {
  const { update } = useProgress();
  const z = route.segments[1] === undefined ? 6 : Number(route.segments[1]);
  const el = Number.isInteger(z) && z >= 1 && z <= 118 ? getElement(z) : undefined;
  if (!el) {
    return (
      <>
        <PageHeader Icon={AtomIcon} eyebrow="Explore" title="Element not found" subtitle="Choose an element from the periodic table to inspect its atomic structure." />
        <p className="muted">Atomic numbers must be whole numbers from 1 to 118.</p>
        <a className="btn primary" href="#/explore">Return to the periodic table</a>
      </>
    );
  }
  const charges = useMemo(() => ionCharges(el), [el]);
  const isoParam = Number(route.query.get('iso'));
  const iso = getIsotope(el, isoParam) ?? getIsotope(el, el.defaultIsotope)!;
  const qParam = Number(route.query.get('q') ?? 0);
  const charge = charges.includes(qParam) ? qParam : 0;

  useEffect(() => { update((p) => viewElement(p, el.number)); }, [el.number, update]);

  const p = particles(el.number, iso.mass, charge);
  const shells = ionShells(el.shells, charge) ?? el.shells;
  const ng = isoelectronicNobleGas(ELEMENTS, shells);
  const ionName = charge === 0 ? isotopeName(el.name, iso.mass) : `${isotopeName(el.name, iso.mass)} ${charge > 0 ? 'cation' : 'anion'}`;

  return (
    <>
      <PageHeader Icon={AtomIcon} eyebrow="Explore" title="Atomic explorer" subtitle="Choose an element, an isotope and a charge. Watch how the number of protons, neutrons and electrons changes." />

      <div className="atom-grid">
        <div className="atom-stage card">
          <AtomDiagram name={el.name} protons={p.protons} neutrons={p.neutrons} shells={shells} charge={charge} massNumber={iso.mass} size={420} />
          <p className="model-note">Simplified shell (Bohr) model. Real electrons occupy orbitals, not circular paths, and the sizes here are not to scale.</p>
        </div>

        <div className="atom-controls">
          <div className="field">
            <label htmlFor="atom-el">Element</label>
            <div className="stepper">
              <button className="btn" onClick={() => nav(Math.max(1, el.number - 1))} disabled={el.number <= 1} aria-label="Previous element">‹</button>
              <select id="atom-el" className="select" value={el.number} onChange={(e) => nav(Number(e.target.value))}>
                {ELEMENTS.map((e) => <option key={e.number} value={e.number}>{e.number}. {e.name} ({e.symbol})</option>)}
              </select>
              <button className="btn" onClick={() => nav(Math.min(118, el.number + 1))} disabled={el.number >= 118} aria-label="Next element">›</button>
            </div>
          </div>

          <fieldset className="field fieldset">
            <legend className="label">Isotope</legend>
            <div className="chips" role="radiogroup" aria-label="Isotope">
              {el.isotopes.map((i) => (
                <button key={i.mass} role="radio" aria-checked={i.mass === iso.mass} className="chip" onClick={() => nav(el.number, i.mass, charge)}>
                  <span className="sci">{isotopeNotation(el.symbol, i.mass)}</span>
                  {i.mass === el.defaultIsotope && <span className="chip-note">{el.defaultIsotopeBasis === 'most-abundant' ? 'most abundant' : 'representative'}</span>}
                </button>
              ))}
            </div>
            <p className="muted small">{iso.stable ? 'Stable isotope.' : 'Radioactive isotope.'}{iso.abundance !== null ? ` About ${iso.abundance}% of natural ${el.name} atoms.` : ''}</p>
          </fieldset>

          <fieldset className="field fieldset">
            <legend className="label">Charge</legend>
            <div className="chips" role="radiogroup" aria-label="Charge">
              {charges.map((c) => (
                <button key={c} role="radio" aria-checked={c === charge} className="chip" onClick={() => nav(el.number, iso.mass, c)}>
                  {c === 0 ? 'Neutral atom' : <span className="sci">{el.symbol}<sup>{chargeLabel(c)}</sup></span>}
                </button>
              ))}
            </div>
            {charges.length === 1 && <p className="muted small">{el.name} does not form common simple ions in this model.</p>}
          </fieldset>

          <table className="counts-table">
            <caption className="sr-only">Particles in {ionName}</caption>
            <tbody>
              <tr><th scope="row">Protons</th><td>{p.protons}</td><td className="muted">atomic number</td></tr>
              <tr><th scope="row">Neutrons</th><td>{p.neutrons}</td><td className="muted">{iso.mass} − {el.number}</td></tr>
              <tr><th scope="row">Electrons</th><td>{p.electrons}</td><td className="muted">{charge === 0 ? 'same as protons' : `${el.number} ${charge > 0 ? '−' : '+'} ${Math.abs(charge)}`}</td></tr>
              <tr><th scope="row">Charge</th><td>{charge === 0 ? '0' : chargeLabel(charge)}</td><td className="muted">protons − electrons</td></tr>
              <tr><th scope="row">Mass number</th><td>{iso.mass}</td><td className="muted">protons + neutrons</td></tr>
              <tr><th scope="row">Electron arrangement</th><td>{shells.length ? shells.join(', ') : 'none'}</td><td className="muted">shells K, L, M …</td></tr>
            </tbody>
          </table>

          <div className="explain card" aria-live="polite">
            <h2>What this shows</h2>
            <p>
              {ionName} has <b>{p.protons}</b> protons because {el.name} has atomic number {el.number}.
              It has {iso.mass} − {el.number} = <b>{p.neutrons}</b> neutrons.
              {charge === 0
                ? <> As a neutral atom it has <b>{p.electrons}</b> electrons, one for each proton.</>
                : charge > 0
                  ? <> It has lost {charge} electron{charge > 1 ? 's' : ''}, leaving <b>{p.electrons}</b> electrons. The number of protons does not change.</>
                  : <> It has gained {Math.abs(charge)} electron{Math.abs(charge) > 1 ? 's' : ''}, giving <b>{p.electrons}</b> electrons. The number of protons does not change.</>}
              {charge !== 0 && ng && <> Its electron arrangement ({shells.join(', ')}) is the same as a {ng.name.toLowerCase()} atom.</>}
            </p>
            {el.defaultIsotopeBasis === 'representative' && <p className="muted small">{el.name} has no stable isotopes, so the default is a representative isotope, not a natural-abundance average.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
