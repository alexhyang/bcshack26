"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, Check, Info, MousePointer2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameView } from "@/types/game";
import { positionTourCard, spotlightRect, type TourRect } from "./positioning";
import { tutorialSteps } from "./steps";
import "./tutorial.css";

export function Tutorial({
  onClose,
  onNavigate,
}: {
  onClose: () => void;
  onNavigate: (view: GameView) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<TourRect | null>(null);
  const [placement, setPlacement] = useState<{ left: number; top: number; side: string } | null>(
    null,
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const maskId = useId();
  const step = tutorialSteps[stepIndex];
  const lastStep = stepIndex === tutorialSteps.length - 1;

  useLayoutEffect(() => {
    onNavigate(step.view);
  }, [onNavigate, step.view]);

  useLayoutEffect(() => {
    const originalPadding = document.body.style.paddingBottom;
    const basePadding = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    let frame = 0;
    let revealFrame = 0;
    let retry = 0;
    let target: HTMLElement | null = null;
    let disposed = false;

    const measure = () => {
      if (disposed) return;
      const viewport = { width: document.documentElement.clientWidth, height: window.innerHeight };
      const card = {
        width: Math.min(350, viewport.width - 32),
        height: cardRef.current?.offsetHeight || 280,
      };
      const rectangle = target?.getBoundingClientRect();
      const rect =
        rectangle && rectangle.width > 0 && rectangle.height > 0
          ? spotlightRect(rectangle, viewport)
          : null;
      const position = positionTourCard(rect, viewport, card);
      // Tall phone targets can extend behind the docked card. Spotlight only
      // the unobstructed portion rather than drawing a frame behind the guide.
      const visibleRect =
        rectangle && viewport.width <= 700
          ? spotlightRect(rectangle, { ...viewport, height: position.top - 12 })
          : rect;
      setSpotlight(visibleRect);
      setPlacement(position);
    };
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    if (cardRef.current) observer.observe(cardRef.current);

    const reveal = () => {
      if (disposed) return;
      target = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      if (!target && retry++ < 12) {
        revealFrame = requestAnimationFrame(reveal);
        return;
      }
      const mobile = document.documentElement.clientWidth <= 700;
      const cardHeight = cardRef.current?.offsetHeight || 280;
      document.body.style.paddingBottom = mobile
        ? `${basePadding + cardHeight + 36}px`
        : originalPadding;
      if (target) {
        observer.observe(target);
        const rect = target.getBoundingClientRect();
        const availableHeight = window.innerHeight - (mobile ? cardHeight + 52 : 32);
        const desiredTop = Math.max(16, (availableHeight - rect.height) / 2);
        window.scrollTo({
          top: Math.max(0, window.scrollY + rect.top - desiredTop),
          behavior: "instant",
        });
      }
      measure();
    };
    // Navigation commits the correct page before looking up its highlight target.
    revealFrame = requestAnimationFrame(reveal);
    window.addEventListener("scroll", scheduleMeasure, true);
    window.addEventListener("resize", reveal);
    window.visualViewport?.addEventListener("resize", reveal);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(revealFrame);
      observer.disconnect();
      window.removeEventListener("scroll", scheduleMeasure, true);
      window.removeEventListener("resize", reveal);
      window.visualViewport?.removeEventListener("resize", reveal);
      document.body.style.paddingBottom = originalPadding;
    };
  }, [step]);

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="tour-overlay">
          <svg className="tour-mask" width="100%" height="100%" aria-hidden="true">
            <defs>
              <mask id={maskId}>
                <rect width="100%" height="100%" fill="white" />
                {spotlight && (
                  <rect
                    x={spotlight.left}
                    y={spotlight.top}
                    width={spotlight.width}
                    height={spotlight.height}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(3, 8, 15, 0.78)" mask={`url(#${maskId})`} />
            {spotlight && (
              <rect
                className="tour-spotlight"
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                fill="none"
                stroke="#34d399"
                strokeWidth="2"
              />
            )}
          </svg>
        </Dialog.Overlay>
        <Dialog.Content
          ref={cardRef}
          className="tour-card"
          style={placement ? { left: placement.left, top: placement.top } : undefined}
          data-side={placement?.side}
          onPointerDownOutside={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            titleRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document
              .querySelector<HTMLButtonElement>('button[aria-label="How to play"]')
              ?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Close asChild>
            <button className="tour-skip" aria-label="Skip tutorial">
              <span>Skip tutorial</span>
              <X size={15} />
            </button>
          </Dialog.Close>
          <div className="tour-card-header">
            <span>
              <MousePointer2 size={13} />
              QUICK TOUR
            </span>
            <span>
              {stepIndex + 1} <span>/ {tutorialSteps.length}</span>
            </span>
          </div>
          <div className="tour-card-copy" aria-live="polite" aria-atomic="true">
            <Dialog.Title ref={titleRef} tabIndex={-1} className="tour-title">
              {step.title}
            </Dialog.Title>
            <Dialog.Description className="tour-description">{step.description}</Dialog.Description>
            <div className="tour-hint">
              <Info size={14} />
              <p>{step.hint}</p>
            </div>
          </div>
          <div
            className="tour-progress"
            aria-label={`Step ${stepIndex + 1} of ${tutorialSteps.length}`}
          >
            {tutorialSteps.map((item, index) => (
              <button
                key={item.id}
                aria-label={`Step ${index + 1}: ${item.label}`}
                aria-current={stepIndex === index ? "step" : undefined}
                className={index <= stepIndex ? "visited" : ""}
                onClick={() => setStepIndex(index)}
              />
            ))}
          </div>
          <div className="tour-actions">
            <Button
              size="sm"
              variant="outline"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex(stepIndex - 1)}
            >
              <ArrowLeft size={14} />
              Back
            </Button>
            <Button size="sm" onClick={() => (lastStep ? onClose() : setStepIndex(stepIndex + 1))}>
              {lastStep ? "Finish tour" : "Next"}
              {lastStep ? <Check size={14} /> : <ArrowRight size={14} />}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
