"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LibraryBook,
  LibraryLoan,
  LibraryMember,
  LibraryStore,
  loadStore,
  saveStore,
} from "../lib/libraryStore";

export function useLibraryStore() {
  const [store, setStore] = useState<LibraryStore | null>(null);

  useEffect(() => {
    setStore(loadStore());

    function handleStorage(event: StorageEvent) {
      if (event.key === "sl_library_store_v1") {
        setStore(loadStore());
      }
    }

    function handleStoreUpdated() {
      setStore(loadStore());
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener("sl_library_store_updated", handleStoreUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("sl_library_store_updated", handleStoreUpdated);
    };
  }, []);

  const persist = useCallback((next: LibraryStore) => {
    saveStore(next);
    setStore(next);
  }, []);

  const addBook = useCallback(
    (book: LibraryBook) => {
      if (!store) return;
      persist({ ...store, books: [book, ...store.books] });
    },
    [persist, store]
  );

  const updateBook = useCallback(
    (bookId: string, updates: Partial<LibraryBook>) => {
      if (!store) return;
      const books = store.books.map((book) =>
        book.id === bookId ? { ...book, ...updates } : book
      );
      persist({ ...store, books });
    },
    [persist, store]
  );

  const deleteBook = useCallback(
    (bookId: string) => {
      if (!store) return;
      const books = store.books.filter((book) => book.id !== bookId);
      const loans = store.loans.filter((loan) => loan.bookId !== bookId);
      persist({ ...store, books, loans });
    },
    [persist, store]
  );

  const addMember = useCallback(
    (member: LibraryMember) => {
      if (!store) return;
      persist({ ...store, members: [member, ...store.members] });
    },
    [persist, store]
  );

  const rentBook = useCallback(
    (loan: LibraryLoan) => {
      if (!store) return;
      const books = store.books.map((book) =>
        book.id === loan.bookId
          ? {
              ...book,
              available: Math.max(0, book.available - 1),
              status: (book.available - 1 > 0
                ? "available"
                : "on_loan") as LibraryBook["status"],
            }
          : book
      );
      persist({ ...store, books, loans: [loan, ...store.loans] });
    },
    [persist, store]
  );

  const returnBook = useCallback(
    (loanId: string) => {
      if (!store) return;
      const loans = store.loans.map((loan) =>
        loan.id === loanId ? { ...loan, returned: true } : loan
      );
      const returning = store.loans.find((loan) => loan.id === loanId);
      const books = returning
        ? store.books.map((book) =>
            book.id === returning.bookId
              ? {
                  ...book,
                  available: Math.min(book.quantity, book.available + 1),
                  status: (book.available + 1 > 0
                    ? "available"
                    : "on_loan") as LibraryBook["status"],
                }
              : book
          )
        : store.books;
      persist({ ...store, loans, books });
    },
    [persist, store]
  );

  const stats = useMemo(() => {
    if (!store) {
      return { books: 0, members: 0, loans: 0 };
    }
    return {
      books: store.books.length,
      members: store.members.length,
      loans: store.loans.filter((loan) => !loan.returned).length,
    };
  }, [store]);

  return {
    store,
    stats,
    addBook,
    updateBook,
    deleteBook,
    addMember,
    rentBook,
    returnBook,
  };
}
