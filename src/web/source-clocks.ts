import type {CSSProperties} from 'react';
import layout from '../../art/runtime/web-v3/hud-clock-v1/clock-layout-v1.json';
import noTimerLayout from '../../art/runtime/web-v3/hud-clock-v1/dense-notimer-layout-v1.json';
import wide from '../../art/runtime/web-v3/hud-clock-v1/landscape-clock-normal-v1.png';
import tall from '../../art/runtime/web-v3/hud-clock-v1/portrait-clock-normal-v1.png';
import tallBid from '../../art/runtime/web-v3/hud-clock-v1/portrait-clock-bid-v1.png';
import tallDense from '../../art/runtime/web-v3/hud-clock-v1/portrait-clock-dense-v1.png';
import noTimerWide from '../../art/runtime/web-v3/hud-clock-v1/landscape-dense-notimer-patch-v1.png';
import noTimerTall from '../../art/runtime/web-v3/hud-clock-v1/portrait-dense-notimer-patch-v1.png';

export type SourceClockVariant='normal'|'bid'|'dense';
export const sourceClockArt={landscape:{normal:wide,bid:wide,dense:wide},portrait:{normal:tall,bid:tallBid,dense:tallDense}};
export const sourceDenseNoTimerArt={landscape:noTimerWide,portrait:noTimerTall};
export function sourceClockStyle(variant:SourceClockVariant):CSSProperties {
 const vars:Record<string,string>={};
 for(const profile of ['landscape','portrait']as const){const p=layout.profiles[profile][variant],[cw,ch]=p.canvas,[x,y,w,h]=p.tile,prefix=profile==='portrait'?'--clock-tall-':'--clock-wide-';
  vars[prefix+'left']=`${x/cw*100}%`;vars[prefix+'top']=`${y/ch*100}%`;vars[prefix+'width']=`${w/cw*100}%`;vars[prefix+'height']=`${h/ch*100}%`;
  vars[prefix+'value-left']=`${p.value.x/w*100}%`;vars[prefix+'value-top']=`${p.value.y/h*100}%`;vars[prefix+'value-width']=`${p.value.width/w*100}%`;vars[prefix+'value-height']=`${p.value.height/cw*100}cqw`;vars[prefix+'value-font']=`${p.value.font/cw*100}cqw`;vars[prefix+'value-color']=`rgb(${p.value.color.join(' ')})`;
 }
 return vars as CSSProperties;
}
export function sourceDenseNoTimerStyle():CSSProperties {
 const vars:Record<string,string>={};
 for(const [profile,p]of Object.entries(noTimerLayout.profiles)){const [cw,ch]=p.canvas,[x,y,w,h]=p.roi,prefix=profile==='portrait'?'--dense-notimer-tall-':'--dense-notimer-wide-';vars[prefix+'left']=`${x/cw*100}%`;vars[prefix+'top']=`${y/ch*100}%`;vars[prefix+'width']=`${w/cw*100}%`;vars[prefix+'height']=`${h/ch*100}%`;}
 return vars as CSSProperties;
}
