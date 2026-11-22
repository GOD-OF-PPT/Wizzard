import type { CSSProperties } from "react";
import {
  cardImages,
  gameArt,
  suitNames,
} from "../game-assets";
import type { Card } from "@wizzard/game-core/contracts";
import webSelectedHalo from "../../art/runtime/web-v3/selected-halo.png";
import { webCardImage, webPortraitCardImage } from "../web/card-assets";
import { trickCardImage } from "../web/trick-card-assets";

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
  surface?: "hand" | "trick";
};

export function getCardLabel(card: Card): string {
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
  surface = "hand",
}: CardViewProps) {
  const label = faceDown ? "背面朝上的手牌" : getCardLabel(card);
  const cornerText = getCornerText(card);
  const sourceNumberFace = !faceDown && card.kind === "number";
  const suitClass = card.kind === "number" ? `game-card--suit-${card.suit}` : "";
  const classNames = `game-card game-card--${state} ${suitClass} ${sourceNumberFace ? "game-card--source-face" : ""} ${winner ? "is-winner" : ""} ${className}`;
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
          src={webSelectedHalo}
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
      <span className="game-card__face" aria-hidden="true">
        {sourceNumberFace ? (
          <picture className="game-card__picture">
            <source media="(orientation: portrait)" srcSet={surface === "trick" ? trickCardImage(card, true) : webPortraitCardImage(card)} />
            <img alt="" className="game-card__art" draggable="false" src={surface === "trick" ? trickCardImage(card) : webCardImage(card)} />
          </picture>
        ) : (
          <img alt="" className="game-card__art" draggable="false" src={faceDown ? cardImages.back : webCardImage(card)} />
        )}
        {!faceDown && cornerText ? (
          <span className="game-card__rank game-card__rank--top" data-rank={cornerText}>
            {cornerText}
          </span>
        ) : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button
        aria-label={label}
        aria-pressed={state === "selected"}
        className={classNames}
        disabled={disabled}
        data-card-id={card.id}
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
