"use client";

import React from "react";

export function Footer() {
  return (
    <footer className="py-10 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} RoomLen — Owner dashboard
    </footer>
  );
}
