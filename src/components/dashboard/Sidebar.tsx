"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    BarChart,
    Settings,
    Menu,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const IconMap = {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    BarChart,
    Settings
};

type MenuItem = {
    name: string;
    href: string;
    iconName: keyof typeof IconMap;
};

interface SidebarProps {
    menuItems: MenuItem[];
    role: string;
    logoutAction: () => Promise<void>;
}

export default function Sidebar({ menuItems, role, logoutAction }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapse/expand
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const toggleDesktopCollapse = () => setIsCollapsed(!isCollapsed);

    const SidebarNavContent = () => (
        <>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="px-3 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={`${item.name}-${item.href}`}
                                href={item.href}
                                onClick={() => setIsMobileOpen(false)}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm font-medium rounded-md group transition-all",
                                    isActive
                                        ? "bg-neutral-100 text-neutral-900"
                                        : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50",
                                    isCollapsed && "md:justify-center md:px-0"
                                )}
                                title={isCollapsed ? item.name : ""}
                            >
                                {(() => {
                                    const Icon = IconMap[item.iconName];
                                    return <Icon className={cn(
                                        "h-5 w-5 shrink-0 transition-colors",
                                        isActive ? "text-neutral-900" : "text-neutral-400 group-hover:text-neutral-500",
                                        !isCollapsed && "mr-3"
                                    )} />;
                                })()}
                                <span className={cn(
                                    "transition-all duration-300 whitespace-nowrap overflow-hidden",
                                    isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                                )}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="p-4 border-t border-neutral-200 shrink-0">
                <div className={cn(
                    "flex items-center mb-4 transition-opacity px-2",
                    isCollapsed ? "md:opacity-0 md:hidden" : "opacity-100"
                )}>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Role: <span className="text-neutral-900">{role}</span>
                    </p>
                </div>
                <form action={logoutAction}>
                    <button
                        type="submit"
                        className={cn(
                            "flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-all group",
                            isCollapsed && "md:justify-center md:px-0"
                        )}
                        title={isCollapsed ? "Logout" : ""}
                    >
                        <LogOut className={cn(
                            "h-5 w-5 shrink-0",
                            !isCollapsed && "mr-3"
                        )} />
                        <span className={cn(
                            "transition-all duration-300 whitespace-nowrap overflow-hidden",
                            isCollapsed ? "md:w-0 md:opacity-0" : "w-auto opacity-100"
                        )}>
                            Logout
                        </span>
                    </button>
                </form>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:hidden fixed top-0 w-full z-40">
                <span className="text-xl font-bold tracking-tight text-neutral-900">B2B Portal</span>
                <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0 flex flex-col">
                        <SheetTitle className="sr-only">Navigasi Sidebar</SheetTitle>
                        <div className="h-16 flex items-center px-6 border-b border-neutral-200 shrink-0">
                            <span className="text-xl font-bold tracking-tight text-neutral-900">B2B Portal</span>
                        </div>
                        <SidebarNavContent />
                    </SheetContent>
                </Sheet>
            </header>

            {/* Desktop Sidebar Container */}
            <aside
                className={cn(
                    "hidden md:flex fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-50 transition-all duration-300 ease-in-out flex-col",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Sidebar Logo / Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 shrink-0">
                    <span className={cn(
                        "text-xl font-bold tracking-tight text-neutral-900 transition-opacity",
                        isCollapsed ? "opacity-0 hidden" : "opacity-100"
                    )}>
                        B2B Portal
                    </span>
                    {/* Desktop Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDesktopCollapse}
                        className="flex h-8 w-8 text-neutral-400 hover:text-neutral-600"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                <SidebarNavContent />
            </aside>

            {/* Spacer for desktop sidebar width to push content */}
            <div className={cn(
                "hidden md:block transition-all duration-300 ease-in-out shrink-0",
                isCollapsed ? "w-20" : "w-64"
            )} />
        </>
    );
}
