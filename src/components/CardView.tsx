import type { CSSProperties } from "react";
import {
  cardImages,
  gameArt,
  getCardImage,
  suitNames,
} from "../game-assets";
import type { Card } from "@wizzard/game-core/contracts";

export type CardVisualState =
  | "normal"
  | "legal"
  | "illegal"
  | "selected"
  | "played";

type CardViewProps = {
  card: Card;
  className?: string;
  disabled?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  state?: CardVisualState;
  style?: CSSProperties;
  winner?: boolean;
};

function getCardLabel(card: Card): string {
  if (card.kind === "highest") {
    return "至高牌";
  }

  if (card.kind === "lowest") {
    return "虚无牌";
  }

  return `${suitNames[card.suit]} ${card.rank}`;
}

function getCornerText(card: Card): string | null {
  return card.kind === "number" ? String(card.rank) : null;
}

export function CardView({
  card,
  className = "",
  disabled = false,
  faceDown = false,
  onClick,
  state = "normal",
  style,
  winner = false,
}: CardViewProps) {
  const label = faceDown ? "背面朝上的手牌" : getCardLabel(card);
  const cornerText = getCornerText(card);
  const suitClass = card.kind === "number" ? `game-card--suit-${card.suit}` : "";
  const classNames = `game-card game-card--${state} ${suitClass} ${winner ? "is-winner" : ""} ${className}`;
  const content = (
    <>
      {state === "legal" ? (
        <img
          alt=""
          aria-hidden="true"
          className="game-card__state-fx game-card__state-fx--legal"
          draggable="false"
          src={gameArt.legalHalo}
        />
      ) : null}
      {state === "selected" ? (
        <img
          alt=""
          aria-hidden="true"
          className="game-card__state-fx game-card__state-fx--selected"
          draggable="false"
          src={gameArt.selectedHalo}
        />
      ) : null}
      {winner ? (
        <img
          alt=""
          aria-hidden="true"
          className="game-card__winner-fx"
          draggable="false"
          src={gameArt.trickWin}
        />
      ) : null}
      <img
        alt=""
        aria-hidden="true"
        className="game-card__art"
        draggable="false"
        src={faceDown ? cardImages.back : getCardImage(card)}
      />
      {!faceDown && cornerText ? (
        <>
          <span className="game-card__rank game-card__rank--top">
            {cornerText}
          </span>
          <span className="game-card__rank game-card__rank--bottom">
            {cornerText}
          </span>
        </>
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={label}
        aria-pressed={state === "selected"}
        className={classNames}
        disabled={disabled}
        onClick={onClick}
        style={style}
        type="button"
      >
        {content}
      </button>
    );
  }

  return (
    <div aria-label={label} className={classNames} role="img" style={style}>
      {content}
    </div>
  );
}
