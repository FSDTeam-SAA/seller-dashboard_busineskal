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
  Menu,
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

export function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
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
            onClick={() => setMobileOpen(false)}
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
      {/* Sidebar logic remains same */}
      <aside className={`fixed left-0 top-0 h-screen w-72 bg-[#E6910B] text-white flex flex-col z-40 transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="py-10 flex justify-center">
          <Image src="/logo.png" alt="MANSA" width={100} height={100} className="w-20 h-auto" />
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

      <div className="lg:ml-72" />
    </>
  );
}