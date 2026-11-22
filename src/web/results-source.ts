import type {CSSProperties} from 'react';
import layout from '../../art/runtime/web-v3/results-source-v1/layout-v1.json';
import typography from '../../art/runtime/web-v3/results-typography-layout-v1.json';
import ink from '../../art/runtime/web-v3/results-ink-v1.json';
import totalMinus from '../../art/runtime/web-v3/results-total-minus-v1.json';
import {resultSourceAssets} from './results-source-assets.generated';
import {currentRankingArt} from './current-ranking-assets.generated';
import {resultStateActions} from './result-state-actions.generated';
import {resultModeArt} from './result-mode-art.generated';
import {rankingCountArt} from './ranking-count-art.generated';
import type {GameMode} from '@wizzard/game-core/contracts';
export type ResultView='results'|'ranking';
export type ResultFurniture='title'|'subtitle'|'note'|'secondary'|'primary';
type ResultInkContext={current?:boolean;finalRound?:boolean;mode?:GameMode;playerCount?:number};
type ResultInkVariant=keyof typeof ink.profiles.landscape.variants;
function resultInkVariant(view:ResultView,context:ResultInkContext):ResultInkVariant{
 if(view==='results')return context.finalRound?'final-round':'results';
 if(context.current)return context.finalRound?'current-final':'current-ranking';
 if(context.mode!=='classic'){
  if(context.playerCount===3)return'ranking3';
  if(context.playerCount===4)return'ranking4';
  if(context.playerCount===5)return'ranking5';
 }
 return'ranking';
}
const variable=(rect:readonly number[],canvas:readonly number[],prefix:string)=>({[prefix+'left']:`${rect[0]/canvas[0]*100}%`,[prefix+'top']:`${rect[1]/canvas[1]*100}%`,[prefix+'width']:`${rect[2]/canvas[0]*100}%`,[prefix+'height']:`${rect[3]/canvas[0]*100}cqw`});
export function emptyRankingRanks(playerCount:number){
 if(playerCount!==3&&playerCount!==4&&playerCount!==5)return null;
 const a=rankingCountArt.landscape[playerCount],b=rankingCountArt.portrait[playerCount];
 return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,rankingCountArt.landscape.canvas,'--result-art-'),...variable(b.rect,rankingCountArt.portrait.canvas,'--result-tall-art-')}as CSSProperties};
}
export function resultFurniture(view:ResultView,kind:ResultFurniture,current=false,mode:GameMode='quick'){
 if(view==='ranking'&&!current&&mode==='classic'&&(kind==='title'||kind==='subtitle')){
  const key=kind==='title'?'classic-ranking-title':'classic-ranking-subtitle',a=resultModeArt.landscape[key],b=resultModeArt.portrait[key];
  return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,resultModeArt.landscape.canvas,'--result-art-'),...variable(b.rect,resultModeArt.portrait.canvas,'--result-tall-art-')}as CSSProperties};
 }
 if(current&&view==='ranking'&&kind!=='note'){
  const a=currentRankingArt.landscape[kind],b=currentRankingArt.portrait[kind];
  return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,currentRankingArt.landscape.canvas,'--result-art-'),...variable(b.rect,currentRankingArt.portrait.canvas,'--result-tall-art-')}as CSSProperties};
 }
 const wide=resultSourceAssets.landscape[view],tall=resultSourceAssets.portrait[view];
 const a=wide[kind as keyof typeof wide],b=tall[kind as keyof typeof tall];
 if(!a||!b||!('src'in a)||!('src'in b))return null;
 return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,layout.profiles.landscape.canvas,'--result-art-'),...variable(b.rect,layout.profiles.portrait.canvas,'--result-tall-art-')}as CSSProperties};
}
export type ResultArt=NonNullable<ReturnType<typeof resultFurniture>>;
export function resultActionFurniture(view:ResultView,kind:'primary'|'secondary',label:string,current=false):ResultArt|null{
 if(view==='ranking'&&current&&kind==='primary'&&label==='查看最终总榜'){
  const a=resultModeArt.landscape['current-final-primary'],b=resultModeArt.portrait['current-final-primary'];
  return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,resultModeArt.landscape.canvas,'--result-art-'),...variable(b.rect,resultModeArt.portrait.canvas,'--result-tall-art-')}as CSSProperties};
 }
 const key=view==='results'&&kind==='primary'&&label==='查看最终总榜'?'final-round-primary'
  :view==='ranking'&&kind==='primary'&&label==='等待房主再开'?'guest-waiting-primary'
  :view==='ranking'&&kind==='secondary'&&label==='离开房间'?'guest-waiting-secondary':null;
 if(key){const a=resultStateActions.landscape[key],b=resultStateActions.portrait[key];return{landscape:a.src,portrait:b.src,style:{...variable(a.rect,resultStateActions.landscape.canvas,'--result-art-'),...variable(b.rect,resultStateActions.portrait.canvas,'--result-tall-art-')}as CSSProperties};}
 const canonical=kind==='primary'?(view==='results'||current?'继续下一轮':'再来一局'):view==='results'?'查看总榜':current?'返回结算':'返回首页';
 return label===canonical?resultFurniture(view,kind,current):null;
}
export function resultRowStyle(view:ResultView,index:number,context:ResultInkContext={}):CSSProperties{
 const vars:Record<string,string>={};
 for(const[profile,p]of Object.entries(layout.profiles)){const s=p[view],prefix=profile==='portrait'?'--result-tall-':'--result-wide-',[cw,ch]=p.canvas,rowY=s.rows[index]??s.rows.at(-1)!;
  vars[prefix+'row-top']=`${rowY/ch*100}%`;vars[prefix+'name-left']=`${s.name.x/cw*100}%`;vars[prefix+'name-width']=`${(profile==='portrait'&&view==='ranking'?172:s.name.width)/cw*100}%`;vars[prefix+'name-font']=`${s.name.font/cw*100}cqw`;vars[prefix+'number-font']=`${s.numberFont/cw*100}cqw`;
  s.columns.forEach((x,i)=>vars[prefix+'col'+i]=`${x/cw*100}%`);
  const type=typography.profiles[profile as keyof typeof typography.profiles][view];
  vars[prefix+'name-tracking']=`${type.nameTracking/cw*100}cqw`;
  vars[prefix+'score-font']=`${type.scoreFont/cw*100}cqw`;
  vars[prefix+'rank-font']=`${type.rankFont/cw*100}cqw`;
  vars[prefix+'rank-stroke']=`${type.rankStroke/cw*100}cqw`;
  const paint=ink.profiles[profile as keyof typeof ink.profiles],colors=paint.variants[resultInkVariant(view,context)];
  vars[prefix+'positive-ink']=colors.positive;vars[prefix+'negative-ink']=colors.negative;vars[prefix+'leading-ink']=colors.leading;
  vars[prefix+'minus-scale-x']=String(paint.minus.scaleX);vars[prefix+'minus-scale-y']=String(paint.minus.scaleY);
  vars[prefix+'minus-shift-x']=`${paint.minus.shiftX/cw*100}cqw`;vars[prefix+'minus-shift-y']=`${paint.minus.shiftY/cw*100}cqw`;vars[prefix+'minus-origin']=paint.minus.origin;
  const count=context.playerCount===3?'3':context.playerCount===4?'4':context.playerCount===5?'5':'6',totalSign=view==='results'?paint.minus:totalMinus.profiles[profile as keyof typeof totalMinus.profiles][count];
  vars[prefix+'total-minus-scale-x']=String(totalSign.scaleX);vars[prefix+'total-minus-scale-y']=String(totalSign.scaleY);
  vars[prefix+'total-minus-shift-x']=`${totalSign.shiftX/cw*100}cqw`;vars[prefix+'total-minus-shift-y']=`${totalSign.shiftY/cw*100}cqw`;vars[prefix+'total-minus-origin']=totalSign.origin;
 }
 return vars as CSSProperties;
}
export function resultAvatar(view:ResultView,key:string):{landscape:string;portrait:string;style:CSSProperties}{
 const vars:Record<string,string>={},src:Record<string,string>={};
 for(const profile of ['landscape','portrait']as const){const p=layout.profiles[profile],assets=resultSourceAssets[profile][view].avatars,resolvedKey=key in assets?key:'masked-traveler',art=assets[resolvedKey as keyof typeof assets],sourceIndex=Object.keys(assets).indexOf(resolvedKey),[x,y,w,h]=art.rect,originY=p[view].rows[sourceIndex],prefix=profile==='portrait'?'--result-avatar-tall-':'--result-avatar-wide-';
  vars[prefix+'left']=`${x/p.canvas[0]*100}%`;vars[prefix+'top']=`${(y-originY)/p.canvas[0]*100}cqw`;vars[prefix+'width']=`${w/p.canvas[0]*100}%`;vars[prefix+'height']=`${h/p.canvas[0]*100}cqw`;src[profile]=art.src;
 }
 return{landscape:src.landscape,portrait:src.portrait,style:vars as CSSProperties};
}
export function resultTitleNumberStyle():CSSProperties{
 const vars:Record<string,string>={};for(const[profile,p]of Object.entries(layout.profiles)){const rect=p.results.roundValue,prefix=profile==='portrait'?'--result-title-tall-':'--result-title-wide-';Object.assign(vars,variable(rect,p.canvas,prefix));vars[prefix+'font']=`${(profile==='portrait'?76:68)/p.canvas[0]*100}cqw`;}
 return vars as CSSProperties;
}
export function currentRankingNumberStyle():CSSProperties{
 const vars:Record<string,string>={};for(const[profile,p]of Object.entries(currentRankingArt)){const prefix=profile==='portrait'?'--result-title-tall-':'--result-title-wide-';Object.assign(vars,variable(p.digit,p.canvas,prefix));vars[prefix+'font']=`${(profile==='portrait'?31:29)/p.canvas[0]*100}cqw`;}
 return vars as CSSProperties;
}
export function classicRankingNumberStyle():CSSProperties{
 const vars:Record<string,string>={};for(const[profile,p]of Object.entries(resultModeArt)){const prefix=profile==='portrait'?'--result-title-tall-':'--result-title-wide-';Object.assign(vars,variable(p.classicDigit,p.canvas,prefix));vars[prefix+'font']=`${p.classicFont/p.canvas[0]*100}cqw`;}
 return vars as CSSProperties;
}
