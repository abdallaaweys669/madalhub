"use client";

import { Menu, Moon, Settings, Bell, ChevronDown, Plus, Search } from "lucide-react";

export default function TopNavbar() {
  return (
    <header
      className="flex items-center h-[60px] px-6 border-b shrink-0 gap-4"
      style={{ background: "#FFFFFF", borderColor: "#E5E5E5" }}
    >
      {/* Left: hamburger */}
      <button className="text-[#555555] hover:text-[#0F172A] transition-colors cursor-pointer">
        <Menu size={20} />
      </button>

      {/* Center: search */}
      <div className="flex-1 max-w-sm">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ background: "#F8FAFC", border: "1px solid #E5E5E5" }}
        >
          <Search size={14} className="text-[#A1A1A1] shrink-0" />
          <span className="text-[#A1A1A1] flex-1 text-[13px]">Search anything...</span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ background: "#EFEFEF", color: "#A1A1A1" }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* New Create button */}
        <button
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold text-white transition-opacity hover:opacity-90 cursor-pointer"
          style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
        >
          <Plus size={15} />
          New Create
        </button>

        {/* Dark mode */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[#555555] hover:bg-gray-50 transition-colors cursor-pointer">
          <Moon size={17} />
        </button>

        {/* Settings */}
        <button className="w-9 h-9 flex items-center justify-center rounded-lg text-[#555555] hover:bg-gray-50 transition-colors cursor-pointer">
          <Settings size={17} />
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#555555] hover:bg-gray-50 transition-colors cursor-pointer">
          <Bell size={17} />
          <span
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: "#FF7B3F" }}
          >
            3
          </span>
        </button>

        {/* Avatar + dropdown */}
        <button className="flex items-center gap-1.5 ml-1 cursor-pointer">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: "linear-gradient(135deg,#FF7B3F,#FF5A1F)" }}
          >
            A
          </div>
          <ChevronDown size={14} className="text-[#A1A1A1]" />
        </button>
      </div>
    </header>
  );
}
