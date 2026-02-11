'use client';

import React from "react"
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

function Header() {
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
    // Removed lg:ml-64 because the Layout now handles positioning.
    // Changed bg to match the lighter gold/amber of the brand.
    <header className="sticky top-0 z-30 w-full bg-[#E6910B] text-white border-b border-white/10 shadow-sm">
      <div className="px-6 py-3 flex items-center justify-end">
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