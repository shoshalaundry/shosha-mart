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
    X,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
    const [isOpen, setIsOpen] = useState(false); // Mobile sidebar open/close
    const [isCollapsed, setIsCollapsed] = useState(false); // Desktop sidebar collapse/expand

    const toggleMobileSidebar = () => setIsOpen(!isOpen);
    const toggleDesktopCollapse = () => setIsCollapsed(!isCollapsed);

    return (
        <>
            {/* Mobile Header with Hamburger */}
            <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-4 md:hidden fixed top-0 w-full z-40">
                <span className="text-xl font-bold tracking-tight text-neutral-900">B2B Portal</span>
                <Button variant="ghost" size="icon" onClick={toggleMobileSidebar}>
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
            </header>

            {/* Mobile Sidebar Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 md:hidden transition-opacity"
                    onClick={toggleMobileSidebar}
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed top-0 left-0 h-full bg-white border-r border-neutral-200 z-50 transition-all duration-300 ease-in-out flex flex-col",
                    // Mobile styles
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0",
                    // Desktop styles
                    isCollapsed ? "md:w-20" : "md:w-64"
                )}
            >
                {/* Sidebar Logo / Header */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-neutral-200 shrink-0">
                    <span className={cn(
                        "text-xl font-bold tracking-tight text-neutral-900 transition-opacity",
                        isCollapsed ? "md:opacity-0 md:hidden" : "opacity-100"
                    )}>
                        B2B Portal
                    </span>
                    {/* Desktop Collapse Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDesktopCollapse}
                        className="hidden md:flex h-8 w-8 text-neutral-400 hover:text-neutral-600"
                    >
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    {/* Mobile Close Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMobileSidebar}
                        className="md:hidden"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Sidebar Navigation Items */}
                <div className="flex-1 overflow-y-auto py-4">
                    <nav className="px-3 space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={`${item.name}-${item.href}`}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)} // Close on mobile click
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

                {/* Sidebar Footer / User Info & Logout */}
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
            </aside>

            {/* Spacer for desktop sidebar width to push content */}
            <div className={cn(
                "hidden md:block transition-all duration-300 ease-in-out shrink-0",
                isCollapsed ? "w-20" : "w-64"
            )} />
        </>
    );
}
