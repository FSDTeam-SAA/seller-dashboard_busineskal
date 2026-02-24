'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Clock,
  MessageSquare,
  TrendingUp,
  Store,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from 'next/image';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: ShoppingCart, label: 'Order', href: '/dashboard/orders' },
  { icon: Package, label: 'Active Product List', href: '/dashboard/products' },
  { icon: Clock, label: 'Pending Product List', href: '/dashboard/pending-products' },
  { icon: MessageSquare, label: 'Message', href: '/dashboard/messages' },
  { icon: TrendingUp, label: 'My Sales', href: '/dashboard/sales' },
  { icon: Store, label: 'My Shop', href: '/dashboard/shop' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    router.push('/auth/login');
    setShowLogoutModal(false);
  };

  const NavLinks = () => (
    <>
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 transition-all ${
              isActive ? 'bg-[#8B5E02] text-white' : 'text-white hover:bg-[#8B5E02]/30'
            }`}
            onClick={onClose}
          >
            <Icon className="w-6 h-6" />
            <span className="text-lg">{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col bg-[#E6910B] text-white transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 py-8 md:justify-center md:px-0 md:py-10">
          <Image src="/logo.png" alt="MANSA" width={100} height={100} className="w-20 h-auto" />
          <button
            type="button"
            className="rounded-md p-2 text-white/90 hover:bg-white/10 md:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto"><NavLinks /></nav>

        {/* Logout Trigger */}
        <div className="p-6">
          <button 
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-4 px-6 py-4 w-full text-white hover:opacity-80"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-lg">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      <Dialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="ghost" 
              onClick={() => setShowLogoutModal(false)}
              className="flex-1"
            >
              No, Stay
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmLogout}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
