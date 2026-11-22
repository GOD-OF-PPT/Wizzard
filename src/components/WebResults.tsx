import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { GameMode, MatchPlayerState } from "@wizzard/game-core/contracts";
import { TableStatus } from "./TableStatus";
import type { TableStatusText } from "../web/table-status";
import results from "../../art/runtime/web-v3/results-source-v1/landscape-results-background-v1.png";
import rankingArt from "../../art/runtime/web-v3/results-source-v1/landscape-ranking-background-v1.png";
import portraitResults from "../../art/runtime/web-v3/results-source-v1/portrait-results-background-v1.png";
import portraitRanking from "../../art/runtime/web-v3/results-source-v1/portrait-ranking-background-v1.png";
import { trapDialogTab } from "../web/dialog-focus";
import {ResultPlayerName} from './ResultPlayerName';
import {ResultNameDialog} from './ResultNameDialog';
import nameTriggerWide from '../../art/runtime/web-v3/results-name-access-v1/landscape-trigger-v1.png';
import nameTriggerTall from '../../art/runtime/web-v3/results-name-access-v1/portrait-trigger-v1.png';
import{nameAccessStyle}from'../web/results-name-access';
import { resultsHomeArt } from "../web/results-home-art.generated";
import {resultAvatar,resultFurniture,resultActionFurniture,resultRowStyle,resultTitleNumberStyle,currentRankingNumberStyle,classicRankingNumberStyle,emptyRankingRanks,type ResultArt,type ResultFurniture,type ResultView} from "../web/results-source";

function Furniture({view,kind,current=false,mode='quick'}:{view:ResultView;kind:ResultFurniture;current?:boolean;mode?:GameMode}){
  const art=resultFurniture(view,kind,current,mode);if(!art)return null;
  return <picture className="results-source-furniture" data-result-furniture={kind} style={art.style} aria-hidden="true"><source media="(orientation: portrait)" srcSet={art.portrait}/><img src={art.landscape} alt="" draggable={false}/></picture>;
}

function ActionArt({art}:{art:ResultArt}){
  return <picture className="results-source-action-art" aria-hidden="true"><source media="(orientation: portrait)" srcSet={art.portrait}/><img src={art.landscape} alt="" draggable={false}/></picture>;
}

function scoreText(value:number|null,showPlus=false){return value===null?'—':`${showPlus&&value>=0?'+':''}${value}`;}
function ScoreValue({value,showPlus=false,total=false}:{value:number|null;showPlus?:boolean;total?:boolean}){
  if(value!==null&&value<0)return <span aria-hidden="true"><span className={`results-source-minus${total?' results-source-minus--total':''}`}>-</span>{Math.abs(value)}</span>;
  return scoreText(value,showPlus);
}

function ReturnHome({ranking,onExit}:{ranking:boolean;onExit:()=>void}){
  const view=ranking?'current-ranking':'results';
  const wide=resultsHomeArt.landscape[view],tall=resultsHomeArt.portrait[view];
  const style={
    '--results-back-x':`${wide.rect[0]/resultsHomeArt.landscape.canvas[0]*100}%`,
    '--results-back-y':`${wide.rect[1]/resultsHomeArt.landscape.canvas[1]*100}%`,
    '--results-back-w':`${wide.rect[2]/resultsHomeArt.landscape.canvas[0]*100}%`,
    '--results-back-h':`${wide.rect[3]/resultsHomeArt.landscape.canvas[0]*100}cqw`,
    '--results-back-tall-x':`${tall.rect[0]/resultsHomeArt.portrait.canvas[0]*100}%`,
    '--results-back-tall-y':`${tall.rect[1]/resultsHomeArt.portrait.canvas[1]*100}%`,
    '--results-back-tall-w':`${tall.rect[2]/resultsHomeArt.portrait.canvas[0]*100}%`,
    '--results-back-tall-h':`${tall.rect[3]/resultsHomeArt.portrait.canvas[0]*100}cqw`,
  } as CSSProperties;
  return <button className="results-source-back v3-baked-hit" style={style} aria-label="返回首页" onClick={onExit}>
    <picture className="results-source-back-art" aria-hidden="true"><source media="(orientation: portrait)" srcSet={tall.src}/><img src={wide.src} alt="" draggable={false}/></picture>
  </button>;
}

export function WebResults({ isMatchEnd, isFinalRound = false, mode = "quick", onContinue, onExit, onRestart, players, roundNumber, network = false, canContinue = true, canRestart = true, blockedLabel, nameAccess='auto', tableStatus }: {
  isMatchEnd: boolean; onContinue: () => void; onExit: () => void; onRestart: () => void;
  isFinalRound?: boolean;
  mode?: GameMode;
  players: readonly MatchPlayerState[]; roundNumber: number; network?: boolean;
  canContinue?: boolean; canRestart?: boolean; blockedLabel?: string;
  nameAccess?:'auto'|'list';
  tableStatus?: TableStatusText;
}) {
  const [showRanking, setShowRanking] = useState(false);
  const [revealedName,setRevealedName]=useState<string|null>(null);
  const [showNameList,setShowNameList]=useState(false);
  const [compactNames,setCompactNames]=useState(nameAccess==='list');
  const resultSurface=useRef<HTMLElement>(null);
  const nameModalOpen=revealedName!==null||showNameList;
  const nameTrigger=useRef<HTMLButtonElement|null>(null);
  const closeName=()=>{setRevealedName(null);setShowNameList(false);requestAnimationFrame(()=>{const target=nameTrigger.current?.isConnected?nameTrigger.current:resultSurface.current?.querySelector<HTMLButtonElement>('.results-name-access,.results-player-name-reveal')??primary.current??secondary.current;target?.focus({preventScroll:true});});};
  const rank = isMatchEnd || showRanking;
  const view:ResultView=rank?'ranking':'results';
  const currentRanking=rank&&!isMatchEnd;
  const primary = useRef<HTMLButtonElement>(null);
  const secondary = useRef<HTMLButtonElement>(null);
  const ordered = [...players].sort((a, b) => b.totalScore - a.totalScore);
  const primaryLabel = (isMatchEnd ? !canRestart : !canContinue)
    ? blockedLabel ?? (isMatchEnd ? "等待房主再开" : "等待牌桌继续")
    : isMatchEnd ? "再来一局" : isFinalRound ? "查看最终总榜" : "继续下一轮";
  const secondaryLabel=rank ? isMatchEnd ? network ? "离开房间" : "返回首页" : "返回结算" : "查看总榜";
  const classicRanking=rank&&isMatchEnd&&mode==='classic';
  const sourceSubtitle=currentRanking||classicRanking||rank&&isMatchEnd&&mode==='quick'&&roundNumber===8;
  const primaryArt=resultActionFurniture(view,'primary',primaryLabel,currentRanking);
  const secondaryArt=resultActionFurniture(view,'secondary',secondaryLabel,currentRanking);
  const emptyRanksArt=rank?emptyRankingRanks(players.length):null;
  useLayoutEffect(()=>{
    const surface=resultSurface.current;if(!surface)return;
    const measure=()=>{const rows=[...surface.querySelectorAll<HTMLElement>('.v3-results-row')],gaps=rows.slice(1).map((row,index)=>row.getBoundingClientRect().top-rows[index].getBoundingClientRect().top);setCompactNames(nameAccess==='list'||gaps.some(gap=>gap>0&&gap<48));};
    const observer=new ResizeObserver(measure);observer.observe(surface);measure();return()=>observer.disconnect();
  },[rank,players.length,nameAccess]);
  useEffect(() => {
    if(nameModalOpen)return;
    (primary.current?.disabled ? secondary.current : primary.current)?.focus();
  }, [rank, canContinue, canRestart]);
  return <section ref={resultSurface} className={`v3-results v3-results--source ${rank ? "v3-ranking" : ""}`} data-result-view={view} data-name-access={compactNames?'list':'individual'} role="dialog" aria-modal="true" aria-labelledby="results-title" onKeyDown={event => {
    trapDialogTab(event);
    if (event.key === "Escape" && showRanking && !isMatchEnd) setShowRanking(false);
  }}>
    <div className="v3-results-canvas" inert={nameModalOpen} aria-hidden={nameModalOpen||undefined}>
    {tableStatus && <TableStatus status={tableStatus}/>}
    <picture className="v3-results-art"><source media="(orientation: portrait)" srcSet={rank ? portraitRanking : portraitResults} /><img src={rank ? rankingArt : results} className="screen-art" alt="" /></picture>
    {emptyRanksArt&&<picture className="results-source-furniture" data-result-furniture="empty-ranks" style={emptyRanksArt.style} aria-hidden="true"><source media="(orientation: portrait)" srcSet={emptyRanksArt.portrait}/><img src={emptyRanksArt.landscape} alt="" draggable={false}/></picture>}
    <h2 id="results-title" className="sr-only">{rank ? isMatchEnd ? `${mode==='quick'?'快速局':'经典局'}总榜` : "当前总榜" : `第 ${roundNumber} 轮结算`}</h2>
    {!isMatchEnd&&<ReturnHome ranking={rank} onExit={onExit}/>}
    {compactNames&&<button type="button" className="results-name-access v3-baked-hit" style={nameAccessStyle('trigger')} aria-label="茶客名签" aria-haspopup="dialog" onClick={event=>{nameTrigger.current=event.currentTarget;setShowNameList(true);}}><picture aria-hidden="true"><source media="(orientation:portrait)" srcSet={nameTriggerTall}/><img src={nameTriggerWide} alt="" draggable={false}/></picture></button>}
    <Furniture view={view} kind="title" current={currentRanking} mode={mode}/>
    {!rank&&<span className="results-source-round-number" style={resultTitleNumberStyle()} aria-hidden="true">{roundNumber}</span>}
    {rank && <p className={sourceSubtitle?'sr-only':"v3-ranking-subtitle"}>{isMatchEnd ? `${roundNumber===8?'八':roundNumber}轮已毕 · 下回再会` : `已完成第${roundNumber}轮`}</p>}
    {sourceSubtitle&&<Furniture view={view} kind="subtitle" current={currentRanking} mode={mode}/>}
    {currentRanking&&<span className="results-source-round-number results-source-current-round" style={currentRankingNumberStyle()} aria-hidden="true">{roundNumber}</span>}
    {classicRanking&&<span className="results-source-round-number results-source-classic-round" style={classicRankingNumberStyle()} aria-hidden="true">{roundNumber}</span>}
    <div className="v3-results-table" role="table" aria-label={rank ? "总分排名" : "本轮计分"}>
      <div className="sr-only" role="row">{(rank ? ["名次", "玩家", "总分"] : ["玩家", "预测", "赢墩", "本轮", "总分"]).map(label => <span key={label} role="columnheader">{label}</span>)}</div>
      {ordered.map((player, index) => {
        const standing = ordered.findIndex(other => other.totalScore === player.totalScore) + 1;
        const avatar=resultAvatar(view,player.avatarKey);
        return <div className={`v3-results-row ${rank && index === 0 ? "is-leading" : ""}`} role="row" key={player.id} style={resultRowStyle(view,index,{current:currentRanking,finalRound:isFinalRound,mode,playerCount:players.length})}>
          {rank && <span role="cell" data-result-column="0">{standing}</span>}
          <span className="v3-results-player" role="cell"><picture className="results-source-avatar" style={avatar.style}><source media="(orientation: portrait)" srcSet={avatar.portrait}/><img src={avatar.landscape} alt="" draggable={false}/></picture><ResultPlayerName name={player.name} allowReveal={!compactNames} onReveal={(name,trigger)=>{nameTrigger.current=trigger;setRevealedName(name);}}/></span>
          {!rank && <><span role="cell" data-result-column="0">{player.bid ?? "—"}</span><span role="cell" data-result-column="1">{player.tricksWon}</span><span role="cell" data-result-column="2" aria-label={scoreText(player.roundScore,true)} className={(player.roundScore ?? 0) >= 0 ? "is-positive" : "is-negative"}><ScoreValue value={player.roundScore} showPlus/></span></>}
          <span role="cell" data-result-column={rank?'1':'3'} data-negative-total={player.totalScore<0||undefined} aria-label={player.totalScore<0?scoreText(player.totalScore):undefined}><ScoreValue value={player.totalScore} total/></span>
        </div>;
      })}
    </div>
    {!rank && <><p className="sr-only">预测准确获得20分基础分</p><Furniture view={view} kind="note"/></>}
    <button ref={secondary} className={`v3-results-secondary v3-baked-hit ${secondaryArt?'results-source-action':''}`} style={secondaryArt?.style} aria-label={secondaryLabel} onClick={rank ? isMatchEnd ? onExit : () => setShowRanking(false) : () => setShowRanking(true)}>{secondaryArt&&<ActionArt art={secondaryArt}/>}<span className={secondaryArt?'sr-only':undefined}>{secondaryLabel}</span></button>
    <button ref={primary} className={`v3-results-primary v3-baked-hit ${primaryArt?'results-source-action':''}`} style={primaryArt?.style} aria-label={primaryLabel} disabled={isMatchEnd ? !canRestart : !canContinue} onClick={isMatchEnd ? onRestart : onContinue}>{primaryArt&&<ActionArt art={primaryArt}/>}<span className={primaryArt?'sr-only':undefined}>{primaryLabel}</span></button>
    </div>
    {showNameList?<ResultNameDialog players={ordered} onClose={closeName}/>:revealedName!==null&&<ResultNameDialog name={revealedName} onClose={closeName}/>}
  </section>;
}
