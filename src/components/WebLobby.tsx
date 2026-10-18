import { webLobbyAvatar } from "../web/avatar-assets";
import type { FriendRoomController } from "../hooks/useFriendRoom";
import lobby from "../../art/runtime/web-v3/lobby.png";
import emptySeat from "../../art/runtime/web-v3/lobby-empty-seat-v2.png";
import portraitLobby from "../../art/runtime/web-v3/portrait/lobby.png";
import readyCheck from "../../art/runtime/web-v3/lobby-ready-check-v1.png";
import inviteArt from "../../art/runtime/web-v3/lobby-invite-v1.png";
import groupIcon from "../../art/runtime/web-v3/lobby-group-v2.png";
import wifiIcon from "../../art/runtime/web-v3/lobby-wifi-v2.png";
import addControl from "../../art/runtime/web-v3/lobby-add-control-v2.png";
import removeControl from "../../art/runtime/web-v3/lobby-remove-control-v2.png";
import robotIcon from "../../art/runtime/web-v3/lobby-robot-v2.png";
import minusIcon from "../../art/runtime/web-v3/lobby-minus-v2.png";

type LobbyController = Pick<FriendRoomController, "state" | "pendingCommand" | "setAiCount" | "setReady" | "startRoom">;
const seatPositions = { 3: [1, 3, 5], 4: [0, 2, 3, 5], 5: [0, 1, 2, 3, 5], 6: [0, 1, 2, 3, 4, 5] } as const;

export function WebLobby({ controller, fillAi, onManualAi, onExit, onInvite }: {
  controller: LobbyController; fillAi: boolean; onManualAi: () => void; onExit: () => void; onInvite: () => void;
}) {
  const { room, connection, permissions, error } = controller.state;
  if (!room) return null;
  const self = room.players.find(player => player.playerId === room.selfPlayerId);
  const humans = room.players.filter(player => !player.isAi);
  const connected = humans.filter(player => player.connected);
  const ready = connected.filter(player => player.ready);
  const ai = room.players.filter(player => player.isAi).length;
  const host = room.hostPlayerId === room.selfPlayerId;
  const busy = !!controller.pendingCommand || connection !== "connected";
  const aiAllowed = host && connected.length >= 2 && !busy;
  const startReason = connected.length < 2 ? "等待好友" : ready.length < humans.length ? "等待准备" : (!fillAi && room.players.length < room.maxPlayers) ? "补齐座位" : "开始游戏";
  const canStart = !!permissions?.canStart && startReason === "开始游戏" && !busy;
  // Humans occupy the leading places, AI the final places. Vacant seats remain
  // genuine gaps, not made-up standby players or AI-looking placeholders.
  const aiPlayers = room.players.filter(player => player.isAi);
  const seats = Array.from({ length: room.maxPlayers }, (_, index) =>
    humans[index] ?? (index >= room.maxPlayers - aiPlayers.length ? aiPlayers[index - (room.maxPlayers - aiPlayers.length)] : undefined));
  return <section className="screen-stage v3-lobby" aria-labelledby="room-title">
    <div className="v3-lobby-canvas">
    <picture className="v3-lobby-art"><source media="(orientation: portrait)" srcSet={portraitLobby} /><img src={lobby} className="screen-art" alt="灯下漆木茶桌" draggable={false} /></picture>
    <button className="v3-lobby-back v3-baked-hit" aria-label="返回首页" onClick={onExit} disabled={busy} />
    <header className="v3-lobby-title"><h1 id="room-title">好友房 {room.roomCode}</h1><p>快速局 · 8轮</p></header>
    <p className="v3-lobby-connection" role="status"><img src={wifiIcon} alt="" draggable={false} />{connection === "connected" ? "已连接" : "正在重连"}</p>
    <div className="v3-lobby-seats" aria-label="房间座位">{seats.map((player, index) => {
      const position = seatPositions[room.maxPlayers][index];
      return <article className={`v3-lobby-seat v3-lobby-seat-${position} ${!player ? "is-empty" : ""}`} key={player?.playerId ?? `empty-${index}`}>
        {player ? <><div className="v3-lobby-portrait"><img className="v3-lobby-avatar" src={webLobbyAvatar(player.avatarKey)} alt={`${player.name}头像`} draggable={false} />{player.connected && (player.isAi || player.ready) && <img className="v3-lobby-check" src={readyCheck} alt="" draggable={false} />}</div><strong>{player.name}</strong><span className={`v3-lobby-seat-state ${player.connected && (player.isAi || player.ready) ? "is-ready" : "is-waiting"}`} aria-label={player.isAi ? "AI · 已准备" : undefined}>{!player.connected ? "已离线" : player.isAi || player.ready ? "已准备" : "等待准备"}</span></> : <><img className="v3-lobby-empty-art" src={emptySeat} alt="" draggable={false} /><span className="sr-only">等待好友</span></>}
      </article>;
    })}</div>
    <button className="v3-lobby-invite v3-baked-hit" onClick={onInvite}><img src={inviteArt} alt="" /><span className="sr-only">邀请好友</span></button>
    <aside className="v3-lobby-status"><p><img src={groupIcon} alt="" /><span>真人 {humans.length}/{room.maxPlayers}</span><span>·</span><span className="v3-lobby-ready-count">已准备 {ready.length}人</span></p>
      <div><button disabled={!aiAllowed || room.players.length >= room.maxPlayers} onClick={() => { if (controller.setAiCount(ai + 1)) onManualAi(); }}><img className="v3-lobby-ai-frame" src={addControl} alt="" /><img className="v3-lobby-ai-icon" src={robotIcon} alt="" /><span>添加机器人</span></button><button disabled={!aiAllowed || ai === 0} onClick={() => { if (controller.setAiCount(ai - 1)) onManualAi(); }}><img className="v3-lobby-ai-frame" src={removeControl} alt="" /><img className="v3-lobby-ai-icon" src={minusIcon} alt="" /><span>移除机器人</span></button></div>
    </aside>
    <button className="v3-lobby-ready v3-baked-hit" disabled={busy || !permissions?.canSetReady} onClick={() => controller.setReady(!self?.ready)}>{self?.ready ? "取消准备" : "准备"}</button>
    <button className="v3-lobby-start v3-baked-hit" disabled={!canStart || !host} onClick={() => controller.startRoom(fillAi)}>{host ? startReason : "等待房主"}</button>
    {(error || controller.pendingCommand) && <p className="v3-lobby-feedback" role="status">{error ? "操作未完成，请确认连接与房间状态后重试。" : "正在确认，请稍候…"}</p>}
    </div>
  </section>;
}
