import type {CSSProperties} from 'react';
import layout from '../../art/runtime/web-v3/hud-clock-v1/round-layout-v1.json';
import wide from '../../art/runtime/web-v3/hud-clock-v1/landscape-round-normal-v1.png';
import tall from '../../art/runtime/web-v3/hud-clock-v1/portrait-round-normal-v1.png';
import denseWide from '../../art/runtime/web-v3/hud-clock-v1/landscape-round-dense-v1.png';
import denseTall from '../../art/runtime/web-v3/hud-clock-v1/portrait-round-dense-v1.png';

export const sourceRoundArt={normal:{landscape:wide,portrait:tall},dense:{landscape:denseWide,portrait:denseTall}};
export function sourceRoundStyle(dense:boolean):CSSProperties {
  const vars:Record<string,string>={};
  for(const [profile,p]of Object.entries(layout.profiles)){
    const prefix=profile==='portrait'?'--round-tall-':'--round-wide-',[cw,ch]=p.canvas,[x,y,w,h]=p.frame;
    vars[prefix+'left']=`${x/cw*100}%`;vars[prefix+'top']=`${y/ch*100}%`;vars[prefix+'width']=`${w/cw*100}%`;vars[prefix+'height']=`${h/ch*100}%`;
    vars[prefix+'color']=profile==='portrait'?(dense?'#080704':'#060502'):(dense?'#0b0704':'#241506');
    for(const kind of ['round','hand']as const){const n=p[kind];vars[prefix+kind+'-left']=`${n.x/w*100}%`;vars[prefix+kind+'-top']=`${n.y/h*100}%`;vars[prefix+kind+'-width']=`${n.width/w*100}%`;vars[prefix+kind+'-height']=`${n.height/cw*100}cqw`;vars[prefix+kind+'-font']=`${n.font/cw*100}cqw`;}
  }
  return vars as CSSProperties;
}
