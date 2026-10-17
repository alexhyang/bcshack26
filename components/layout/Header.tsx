"use client";
import Link from "next/link";
import { BookOpen, RotateCcw, Sprout, ArrowUpRight } from "lucide-react";
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
}: {
  day: number;
  completed: boolean;
  onReset: () => void;
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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="How to play">
              <BookOpen size={18} />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-xl font-semibold">
              Welcome to your trading desk.
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm leading-6 text-slate-400">
              You have 1,000 kg of carrots and seven days to make the most of your harvest. All
              prices, buyers, and events are fictional.
            </DialogDescription>
            <ol className="help-list">
              <li>
                <b>Compare your buyers.</b> A higher price can come with lower capacity and higher
                delivery costs.
              </li>
              <li>
                <b>Place your orders.</b> Choose a buyer and quantity. Each buyer accepts one order
                per day, even if you sell less than their capacity.
              </li>
              <li>
                <b>Sell or hold.</b> Advancing charges storage on remaining stock, then removes
                spoiled carrots. Freshness tracks quality; it does not apply an extra price
                discount.
              </li>
              <li>
                <b>Finish your season.</b> Trade on Day 7 before ending the game. Unsold stock has
                no salvage value.
              </li>
            </ol>
            <div className="info-note mt-4">
              Cash includes selling returns minus storage. It can go below $0. Production costs are
              excluded, so your result is a net selling margin, not full farm profit.
            </div>
            <DialogClose asChild>
              <Button className="mt-5 w-full">
                Let’s trade <ArrowUpRight size={16} />
              </Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
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
              This replaces your saved season, including all trades, with 1,000 kg of carrots on Day
              1.
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
