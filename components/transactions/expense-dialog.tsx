"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { deletePaymentMethod, savePaymentMethod, saveTransaction } from "@/lib/actions/transactions";
import { PAYMENT_KINDS } from "@/lib/constants";
import { toDatetimeLocalValue } from "@/lib/format";
import { isCardKind } from "@/lib/payments";
import type { ActionResult, Category, PaymentKind, PaymentMethod, Transaction } from "@/lib/types";
import { CategoryIcon } from "@/components/category-icon";
import { buttonClass, ghostButtonClass, inputClass, panelClass } from "@/components/ui";

export function ExpenseDialog({
  categories,
  paymentMethods,
  open,
  transaction,
  onClose,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  open: boolean;
  transaction: Transaction | null;
  onClose: () => void;
}) {
  if (!open) return null;

  return createPortal(
    <ExpenseForm
      key={transaction?.id ?? "new"}
      categories={categories}
      paymentMethods={paymentMethods}
      transaction={transaction}
      onClose={onClose}
    />,
    document.body,
  );
}

function ExpenseForm({
  categories,
  paymentMethods,
  transaction,
  onClose,
}: {
  categories: Category[];
  paymentMethods: PaymentMethod[];
  transaction: Transaction | null;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    saveTransaction,
    null,
  );
  const [categoryId, setCategoryId] = useState(transaction?.category_id ?? categories[0]?.id ?? "");
  const [paymentKind, setPaymentKind] = useState<PaymentKind | "">(transaction?.payment_kind ?? "");
  const [cardName, setCardName] = useState(transaction?.card_name ?? "");
  const [savedCards, setSavedCards] = useState(paymentMethods);
  const [cardMessage, setCardMessage] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);
  const [savingCard, startSavingCard] = useTransition();
  const [confirmCardId, setConfirmCardId] = useState<string | null>(null);
  const [deletingCardId, setDeletingCardId] = useState<string | null>(null);
  const [deletingCard, startDeletingCard] = useTransition();

  useEffect(() => {
    if (state?.message && !state.error) onClose();
  }, [state, onClose]);

  function chooseKind(kind: PaymentKind) {
    setPaymentKind(kind);
    setCardError(null);
    setCardMessage(null);
    if (kind === "cash") setCardName("");
  }

  function saveCard() {
    if (!isCardKind(paymentKind)) return;
    const name = cardName.trim();
    if (!name) {
      setCardError("Name this card before saving it.");
      setCardMessage(null);
      return;
    }
    setCardError(null);
    setCardMessage(null);
    startSavingCard(async () => {
      const result = await savePaymentMethod(paymentKind, name);
      if (result.error || !result.method) {
        setCardError(result.error ?? "Could not save that card.");
        return;
      }
      setCardName(result.method.name);
      setSavedCards((current) =>
        current.some((card) => card.id === result.method?.id) ? current : [...current, result.method!],
      );
      setCardMessage("Card saved");
    });
  }

  function removeCard(id: string) {
    setCardError(null);
    setCardMessage(null);
    setDeletingCardId(id);
    startDeletingCard(async () => {
      const result = await deletePaymentMethod(id);
      setDeletingCardId(null);
      setConfirmCardId(null);
      if (result.error) {
        setCardError(result.error);
        return;
      }
      const removed = savedCards.find((card) => card.id === id);
      if (removed && removed.name === cardName.trim() && removed.kind === paymentKind) {
        setCardName("");
      }
      setSavedCards((current) => current.filter((card) => card.id !== id));
    });
  }

  const cardsForKind = isCardKind(paymentKind)
    ? savedCards.filter((card) => card.kind === paymentKind)
    : [];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Close dialog" onClick={onClose} />
      <form
        action={formAction}
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-dialog-title"
        className={`${panelClass} relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto p-5`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="expense-dialog-title" className="text-lg font-semibold">
              {transaction ? "Edit expense" : "Add expense"}
            </h2>
            <p className="text-sm text-slate-400">Log a card payment or other charge.</p>
          </div>
          <button type="button" onClick={onClose} className={ghostButtonClass} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}
        <input type="hidden" name="payment_kind" value={paymentKind} />
        <input type="hidden" name="card_name" value={paymentKind === "cash" ? "" : cardName} />

        <div className="space-y-4">
          <label className="block space-y-1.5 text-sm">
            <span className="text-slate-300">Amount</span>
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              defaultValue={transaction?.amount ?? ""}
              placeholder="0.00"
              className={inputClass}
              autoFocus
            />
          </label>

          <label className="block space-y-1.5 text-sm">
            <span className="text-slate-300">Title / merchant</span>
            <input
              name="title"
              required
              defaultValue={transaction?.title ?? ""}
              placeholder="Trader Joe's"
              className={inputClass}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm text-slate-300">Payment method</legend>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_KINDS.map((kind) => {
                const selected = paymentKind === kind.id;
                return (
                  <button
                    key={kind.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => chooseKind(kind.id)}
                    className={`rounded-full px-3 py-1 text-xs transition ${
                      selected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    {kind.label}
                  </button>
                );
              })}
            </div>
            {isCardKind(paymentKind) ? (
              <div className="space-y-2">
                <label className="block space-y-1.5 text-sm" htmlFor="card-name">
                  <span className="text-slate-300">Card name</span>
                  <input
                    id="card-name"
                    value={cardName}
                    onChange={(event) => {
                      setCardName(event.target.value);
                      setCardMessage(null);
                    }}
                    placeholder={paymentKind === "credit" ? "Chase Sapphire" : "Checking"}
                    className={inputClass}
                  />
                </label>
                <button
                  type="button"
                  className={ghostButtonClass}
                  onClick={saveCard}
                  disabled={savingCard}
                >
                  {savingCard ? "Saving card…" : "Save card"}
                </button>
                {cardsForKind.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {cardsForKind.map((card) => {
                      const selected = card.name === cardName.trim();
                      const confirming = confirmCardId === card.id;
                      const chipClass = selected
                        ? "bg-indigo-500 text-white"
                        : "bg-white/5 text-slate-300";
                      return (
                        <span
                          key={card.id}
                          className={`inline-flex items-center rounded-full text-xs ${chipClass}`}
                        >
                          {confirming ? (
                            <>
                              <span className="px-3 py-1">Delete {card.name}?</span>
                              <button
                                type="button"
                                className="px-2 py-1 font-medium"
                                disabled={deletingCard && deletingCardId === card.id}
                                onClick={() => removeCard(card.id)}
                              >
                                {deletingCard && deletingCardId === card.id ? "Deleting…" : "Delete"}
                              </button>
                              <button
                                type="button"
                                className="pr-3 pl-1 py-1 opacity-80"
                                onClick={() => setConfirmCardId(null)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-pressed={selected}
                                onClick={() => setCardName(card.name)}
                                className="px-3 py-1"
                              >
                                {card.name}
                              </button>
                              <button
                                type="button"
                                aria-label={`Delete ${card.name}`}
                                onClick={() => setConfirmCardId(card.id)}
                                className="pr-2 pl-0.5 py-1 opacity-80 hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                        </span>
                      );
                    })}
                  </div>
                ) : null}
                {cardMessage ? <p className="text-xs text-emerald-300">{cardMessage}</p> : null}
                {cardError ? (
                  <p role="alert" className="text-xs text-rose-200">
                    {cardError}
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          <label className="block space-y-1.5 text-sm">
            <span className="text-slate-300">Date and time</span>
            <input
              name="transaction_date"
              type="datetime-local"
              required
              defaultValue={toDatetimeLocalValue(transaction?.transaction_date ?? new Date())}
              className={inputClass}
            />
          </label>

          <div className="space-y-2">
            <label className="block space-y-1.5 text-sm" htmlFor="category">
              <span className="text-slate-300">Category</span>
              <select
                id="category"
                name="category_id"
                required
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                className={inputClass}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const selected = category.id === categoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setCategoryId(category.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
                      selected ? "bg-indigo-500 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"
                    }`}
                  >
                    <CategoryIcon name={category.icon_name} className="h-3.5 w-3.5" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="text-slate-300">Notes</span>
            <textarea
              name="notes"
              rows={3}
              defaultValue={transaction?.notes ?? ""}
              placeholder="Optional"
              className={inputClass}
            />
          </label>
        </div>

        {state?.error ? (
          <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
            {state.error}
          </p>
        ) : null}

        <div className="sticky bottom-0 -mx-5 mt-5 flex justify-end gap-2 border-t border-white/10 bg-slate-900 px-5 py-4">
          <button type="button" onClick={onClose} className={ghostButtonClass}>
            Cancel
          </button>
          <button type="submit" className={buttonClass} disabled={pending || categories.length === 0}>
            {pending ? "Saving…" : transaction ? "Save changes" : "Add expense"}
          </button>
        </div>
      </form>
    </div>
  );
}
