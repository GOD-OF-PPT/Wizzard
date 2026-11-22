import {useEffect,useLayoutEffect,useRef} from 'react';
import panel from '../../art/runtime/web-v3/results-name-dialog-v1/landscape-panel-v1.png';
import portraitPanel from '../../art/runtime/web-v3/results-name-dialog-v1/portrait-panel-v1.png';
import listPanel from '../../art/runtime/web-v3/results-name-access-v1/landscape-panel-v3.png';
import portraitListPanel from '../../art/runtime/web-v3/results-name-access-v1/portrait-panel-v3.png';
import type{MatchPlayerState}from'@wizzard/game-core/contracts';
import{resultAvatar}from'../web/results-source';
import{nameAccessStyle,nameListRowStyle}from'../web/results-name-access';

function NameListRow({player,index}:{player:MatchPlayerState;index:number}){
  const band=useRef<HTMLSpanElement>(null),ink=useRef<HTMLSpanElement>(null),avatar=resultAvatar('results',player.avatarKey);
  useLayoutEffect(()=>{
    const b=band.current,e=ink.current;if(!b||!e)return;let disposed=false;
    const fit=()=>{if(disposed)return;e.style.fontSize='100%';e.style.whiteSpace='nowrap';e.style.width='max-content';const size=parseFloat(getComputedStyle(b).fontSize),width=e.getBoundingClientRect().width,available=b.clientWidth-1;if(width<=0||available<=0)return;const target=Math.min(size,size*available/width);e.style.fontSize=`${Math.max(12,target)/size*100}%`;if(target<12){e.style.whiteSpace='normal';e.style.width='100%';}};
    const observer=new ResizeObserver(fit);observer.observe(b);document.fonts.addEventListener('loadingdone',fit);void document.fonts.ready.then(fit);fit();return()=>{disposed=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',fit);};
  },[player.name]);
  return <li role="listitem" className="results-name-list-row" style={nameListRowStyle(index)}><picture aria-hidden="true"><source media="(orientation:portrait)" srcSet={avatar.portrait}/><img src={avatar.landscape} alt="" draggable={false}/></picture><span ref={band} className="results-name-list-band" data-name-latin={/[A-Za-z0-9]/.test(player.name)||undefined}><span ref={ink}>{player.name}</span></span></li>;
}

export function ResultNameDialog({name,players,onClose}:({name:string;players?:never}|{name?:never;players:readonly MatchPlayerState[]})&{onClose:()=>void}){
  const close=useRef<HTMLButtonElement>(null);
  const nameBand=useRef<HTMLParagraphElement>(null);
  const nameInk=useRef<HTMLSpanElement>(null);
  const onCloseRef=useRef(onClose);onCloseRef.current=onClose;
  useEffect(()=>{
    close.current?.focus({preventScroll:true});
    // The centered stage can have letterboxing. Keep keyboard ownership even
    // after a pointer click in that area moves focus to the document body.
    const keydown=(event:KeyboardEvent)=>{
      if(event.key!=='Tab'&&event.key!=='Escape')return;
      event.preventDefault();event.stopPropagation();
      if(event.key==='Escape')onCloseRef.current();else close.current?.focus();
    };
    document.addEventListener('keydown',keydown,true);
    return()=>document.removeEventListener('keydown',keydown,true);
  },[]);
  useLayoutEffect(()=>{
    const band=nameBand.current,ink=nameInk.current;if(!band||!ink)return;
    let disposed=false;
    const fit=()=>{
      if(disposed)return;
      // Measure the loaded/fallback font itself: wide Latin and mixed scripts
      // cannot be estimated from character counts. Always retain the full text.
      ink.style.fontSize='100%';
      const style=getComputedStyle(band),available=band.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),width=ink.getBoundingClientRect().width;
      if(width>0&&available>0)ink.style.fontSize=`${Math.min(1,Math.max(0,available-.5)/width)*100}%`;
    };
    const observer=new ResizeObserver(fit);observer.observe(band);
    document.fonts.addEventListener('loadingdone',fit);void document.fonts.ready.then(fit);fit();
    return()=>{disposed=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',fit);};
  },[name]);
  if(players)return <div className="results-name-scrim" onMouseDown={event=>{if(!(event.target instanceof Element)||!event.target.closest('button'))event.preventDefault();}}><section className="results-name-list-dialog" role="dialog" aria-modal="true" aria-labelledby="results-name-title" style={nameAccessStyle('panel')}>
    <picture aria-hidden="true"><source media="(orientation:portrait)" srcSet={portraitListPanel}/><img src={listPanel} alt="" draggable={false}/></picture><h2 id="results-name-title" className="sr-only">茶客名签</h2>
    <ul aria-label="完整昵称">{players.map((player,index)=><NameListRow key={player.id} player={player} index={index}/>)}</ul>
    <button ref={close} type="button" className="results-name-list-close v3-baked-hit" aria-label="收起名签" onClick={onClose}/>
  </section></div>;
  return <div className="results-name-scrim" onMouseDown={event=>{if(!(event.target instanceof Element)||!event.target.closest('button'))event.preventDefault();}}><section className="results-name-dialog" role="dialog" aria-modal="true" aria-labelledby="results-name-title" aria-describedby="results-name-full">
    <picture aria-hidden="true"><source media="(orientation:portrait)" srcSet={portraitPanel}/><img src={panel} alt="" draggable={false}/></picture>
    <h2 id="results-name-title" className="sr-only">茶客名签</h2>
    <p ref={nameBand} id="results-name-full"><span ref={nameInk}>{name}</span></p>
    <button ref={close} type="button" className="results-name-close v3-baked-hit" aria-label="收起名签" onClick={onClose}/>
  </section></div>;
}
