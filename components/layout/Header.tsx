"use client";
import Link from "next/link";
import { BookOpen, RotateCcw, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
export function Header({
  day,
  completed,
  onReset,
  onTutorial,
}: {
  day: number;
  completed: boolean;
  onReset: () => void;
  onTutorial: () => void;
}) {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="FarmStreet home">
        <span className="brand-icon">
          <Sprout size={24} strokeWidth={2.3} />
        </span>
        <span>
          Farm<span className="text-emerald-400">Street</span>
          <span className="brand-period">.</span>
        </span>
      </Link>
      <div className="header-breadcrumb">
        <span className="text-slate-600">Workspace</span>
        <span className="text-slate-600">/</span>
        <span>Trading terminal</span>
      </div>
      <div className="header-actions">
        <span className="session-badge">
          <span className={completed ? "status-dot muted" : "status-dot"} />
          {completed ? "Season complete" : `DAY ${day} OF 7`}
          <span className="session-separator" />
          <span className="simulated-label">SIMULATED</span>
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="How to play"
          title="Open tutorial"
          onClick={onTutorial}
        >
          <BookOpen size={18} />
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Reset game">
              <RotateCcw size={13} />
              <span className="reset-label">Reset game</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-xl font-semibold">Start with a fresh harvest?</DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-slate-400">
              This starts a new season with your starting crop inventory and clears trades and
              selling results. You can edit the inventory before your first sale.
            </DialogDescription>
            <div className="mt-6 flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Keep playing</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={onReset}>Reset game</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
