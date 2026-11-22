import type{CSSProperties}from'react';
import layout from '../../art/runtime/web-v3/results-name-access-v1/layout-v1.json';
import typography from '../../art/runtime/web-v3/name-list-type-v1.json';
export function nameAccessStyle(kind:'trigger'|'panel'){
  const style:Record<string,string>={};
  for(const[profile,p]of Object.entries(layout.profiles)){
    const[x,y,w,h]=p[kind],prefix=profile==='landscape'?'--names-wide-':'--names-tall-';
    style[prefix+'x']=`${x/p.canvas[0]*100}%`;style[prefix+'y']=`${y/p.canvas[1]*100}%`;style[prefix+'w']=`${w/p.canvas[0]*100}%`;style[prefix+'h']=`${h/p.canvas[0]*100}cqw`;
    if(kind==='panel'){const[a,b,c,d]=p.close;style[prefix+'close-x']=`${a/w*100}%`;style[prefix+'close-y']=`${b/h*100}%`;style[prefix+'close-w']=`${c/w*100}%`;style[prefix+'close-h']=`${d/p.canvas[0]*100}cqw`;}
  }
  return style as CSSProperties;
}
export function nameListRowStyle(index:number){
  const style:Record<string,string>={};for(const[profile,p]of Object.entries(layout.profiles)){
    const prefix=profile==='landscape'?'--names-wide-':'--names-tall-',w=p.panel[2],h=p.panel[3];style[prefix+'row-y']=`${p.rows[index]/h*100}%`;style[prefix+'avatar-x']=`${p.avatar[0]/w*100}%`;style[prefix+'avatar-size']=`${p.avatar[1]/p.canvas[0]*100}cqw`;style[prefix+'name-x']=`${p.name[0]/w*100}%`;style[prefix+'name-w']=`${(p.name[1]-(profile==='portrait'?typography.portraitWidthInset:0))/w*100}%`;style[prefix+'font']=`${typography.font/p.canvas[0]*100}cqw`;
    for(const[key,value]of Object.entries({tracking:typography.tracking,stroke:profile==='portrait'?typography.portraitStroke:typography.stroke,'ink-x':typography.cjkOffsetX,'latin-x':typography.latinOffsetX,'latin-y':typography.latinOffsetY}))style[prefix+key]=`${value/p.canvas[0]*100}cqw`;
  }return style as CSSProperties;
}
