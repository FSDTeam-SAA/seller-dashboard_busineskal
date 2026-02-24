'use client';

import React from "react"
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Menu } from "lucide-react";

type HeaderProps = {
  onMenuClick?: () => void;
};

function Header({ onMenuClick }: HeaderProps) {
  const { data: userData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => userAPI.getProfile(),
    select: (response) => response.data.data,
  });

  const userName = userData?.name || 'User';
  const userEmail = userData?.email || '';
  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-30 w-full bg-[#E6910B] text-white border-b border-white/10 shadow-sm">
      <div className="flex items-center justify-between px-3 py-3 sm:px-4 lg:px-6">
        <button
          type="button"
          className="rounded-md p-2 text-white/90 hover:bg-white/10 md:hidden"
          onClick={onMenuClick}
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold tracking-tight">{userName}</p>
            <p className="text-[10px] text-amber-100/80 uppercase tracking-widest leading-none">
              {userEmail}
            </p>
          </div>
          
          <div className="h-10 w-10 rounded-full border-2 border-white/20 p-0.5">
            <Avatar className="h-full w-full">
              <AvatarImage src={userData?.avatar?.url} alt={userName} />
              <AvatarFallback className="bg-[#8B5E02] text-white text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
