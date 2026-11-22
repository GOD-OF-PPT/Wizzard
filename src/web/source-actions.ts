import type { CSSProperties } from 'react';
import { sourceActions } from './source-action-assets.generated';

export type SourceActionState = keyof typeof sourceActions.landscape;

export function sourceActionPair(state: SourceActionState) {
  return { landscape:sourceActions.landscape[state], portrait:sourceActions.portrait[state] };
}

export function sourceActionStyle(state: SourceActionState): CSSProperties {
  const variables:Record<string,string>={};
  for(const [profile,asset]of Object.entries(sourceActionPair(state))){
    const [w,h]=profile==='portrait'?[941,1672]:[1672,941];
    const [x,y,width,height]=asset.rect,prefix=profile==='portrait'?'--portrait-action-':'--source-action-';
    variables[prefix+'left']=`${x/w*100}%`;
    variables[prefix+'top']=`${y/h*100}%`;
    variables[prefix+'width']=`${width/w*100}%`;
    variables[prefix+'height']=`${height/w*100}cqw`;
  }
  return variables as CSSProperties;
}
