import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  show: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

export const useToast = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, type = "error") => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => get().dismiss(id), 3000);
  },
  dismiss: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));

export const toast = {
  error: (msg: string) => useToast.getState().show(msg, "error"),
  success: (msg: string) => useToast.getState().show(msg, "success"),
  info: (msg: string) => useToast.getState().show(msg, "info"),
};
