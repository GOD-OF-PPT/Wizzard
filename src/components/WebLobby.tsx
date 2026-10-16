import { avatarImages } from "../game-assets";
import type { FriendRoomController } from "../hooks/useFriendRoom";
import lobby from "../../art/runtime/web-v3/lobby.png";
import emptySeat from "../../art/runtime/web-v3/empty-seat.png";

export function WebLobby({ controller, fillAi, onManualAi, onExit, onInvite }: {
  controller: FriendRoomController; fillAi: boolean; onManualAi: () => void; onExit: () => void; onInvite: () => void;
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
  return <section className="screen-stage v3-lobby" aria-labelledby="room-title">
    <img src={lobby} className="screen-art" alt="灯下漆木茶桌" draggable={false} />
    <button className="v3-lobby-back v3-baked-hit" aria-label="返回首页" onClick={onExit} disabled={busy} />
    <header className="v3-lobby-title"><h1 id="room-title">好友房 {room.roomCode}</h1><p>快速局 · 8轮</p></header>
    <p className="v3-lobby-connection" role="status">{connection === "connected" ? "已连接" : "正在重连"}</p>
    <div className="v3-lobby-seats" aria-label="房间座位">{Array.from({ length: room.maxPlayers }, (_, index) => {
      const player = room.players[index];
      return <article className={`v3-lobby-seat v3-lobby-seat-${index} ${!player ? "is-empty" : ""}`} key={player?.playerId ?? `empty-${index}`}>
        {player ? <><img className="v3-lobby-avatar" src={avatarImages[player.avatarKey].normal} alt={`${player.name}头像`} /><strong>{player.name}</strong><span>{!player.connected ? "已离线" : player.isAi ? "AI · 已准备" : player.ready ? "已准备" : "等待准备"}</span></> : <><img className="v3-lobby-avatar" src={emptySeat} alt="" /><strong>等待好友</strong></>}
      </article>;
    })}</div>
    <button className="v3-lobby-invite v3-baked-hit" onClick={onInvite}>邀请好友</button>
    <aside className="v3-lobby-status"><p>真人 {humans.length}/{room.maxPlayers} · 已准备 {ready.length}人</p>
      <div><button disabled={!aiAllowed || room.players.length >= room.maxPlayers} onClick={() => { if (controller.setAiCount(ai + 1)) onManualAi(); }}>添加机器人</button><button disabled={!aiAllowed || ai === 0} onClick={() => { if (controller.setAiCount(ai - 1)) onManualAi(); }}>移除机器人</button></div>
    </aside>
    <button className="v3-lobby-ready v3-baked-hit" disabled={busy || !permissions?.canSetReady} onClick={() => controller.setReady(!self?.ready)}>{self?.ready ? "取消准备" : "准备"}</button>
    <button className="v3-lobby-start v3-baked-hit" disabled={!canStart || !host} onClick={() => controller.startRoom(fillAi)}>{host ? startReason : "等待房主"}</button>
    {(error || controller.pendingCommand) && <p className="v3-lobby-feedback" role="status">{error ? "操作未完成，请确认连接与房间状态后重试。" : "正在确认，请稍候…"}</p>}
  </section>;
}
