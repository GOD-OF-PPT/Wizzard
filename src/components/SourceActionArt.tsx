import { sourceActionPair, type SourceActionState } from '../web/source-actions';

export function SourceActionArt({state}:{state:SourceActionState}) {
  const art=sourceActionPair(state);
  return <picture className="source-action__art" aria-hidden="true">
    <source media="(orientation: portrait)" srcSet={art.portrait.src}/>
    <img src={art.landscape.src} alt="" draggable={false}/>
  </picture>;
}
