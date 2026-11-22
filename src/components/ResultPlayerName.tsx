import {useLayoutEffect,useRef,useState} from 'react';

/** Measure the displayed ink, so ordinary names do not gain an unnecessary action. */
export function ResultPlayerName({name,onReveal,allowReveal=true}:{name:string;onReveal:(name:string,trigger:HTMLButtonElement)=>void;allowReveal?:boolean}){
  const ink=useRef<HTMLSpanElement>(null);
  const measureInk=useRef<HTMLSpanElement>(null);
  const [label,setLabel]=useState({name,display:name,clipped:false});
  const current=label.name===name?label:{name,display:name,clipped:false};
  useLayoutEffect(()=>{
    const element=ink.current,measureElement=measureInk.current;if(!element||!measureElement)return;
    let disposed=false;
    const measure=()=>{
      if(disposed)return;
      const width=element.getBoundingClientRect().width;
      measureElement.textContent=name;
      const clipped=measureElement.getBoundingClientRect().width>width+.1;
      let display=name;
      if(clipped){
        // Render the actual ellipsis with the same fallback fonts as the name.
        // Browser text-overflow may choose a different ellipsis font/advance.
        const parts=[...new Intl.Segmenter(undefined,{granularity:'grapheme'}).segment(name)].map(part=>part.segment);
        while(parts.length){parts.pop();display=parts.join('')+'…';measureElement.textContent=display;if(measureElement.getBoundingClientRect().width<=width)break;}
      }
      setLabel(previous=>previous.name===name&&previous.display===display&&previous.clipped===clipped?previous:{name,display,clipped});
    };
    const observer=new ResizeObserver(measure);observer.observe(element);
    document.fonts.addEventListener('loadingdone',measure);void document.fonts.ready.then(measure);measure();
    return()=>{disposed=true;observer.disconnect();document.fonts.removeEventListener('loadingdone',measure);};
  },[name]);
  return <span className="results-player-name" title={name} data-name-latin={/[A-Za-z]/.test(name)||undefined}>
    <span ref={ink} className="results-player-name-ink" aria-hidden={current.clipped||undefined}>{current.display}</span>
    <span ref={measureInk} className="results-player-name-measure" aria-hidden="true"/>
    {current.clipped&&!allowReveal&&<span className="sr-only">{name}</span>}
    {current.clipped&&allowReveal&&<button type="button" className="results-player-name-reveal" aria-haspopup="dialog" aria-label={`查看完整昵称：${name}`} onClick={event=>onReveal(name,event.currentTarget)}/>}
  </span>;
}
