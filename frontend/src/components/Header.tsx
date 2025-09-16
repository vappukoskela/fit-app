'use client';

import { useNavigate } from "react-router-dom";
import { Button } from './ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from './ui/navigation-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './ui/popover';
import { cn } from '../lib/utils';
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';

// Simple cat avatar SVG - you can replace this with any cat SVG
const Avatar = (props: React.SVGAttributes<SVGElement>) => {
    return (
        <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <circle cx="50" cy="55" r="35" fill="#FF9500" />
            <path d="M25 35 L15 15 L40 25 Z" fill="#FF9500" />
            <path d="M75 35 L85 15 L60 25 Z" fill="#FF9500" />
            <path d="M25 30 L20 18 L35 25 Z" fill="#FFB84D" />
            <path d="M75 30 L80 18 L65 25 Z" fill="#FFB84D" />
            <ellipse cx="40" cy="50" rx="6" ry="8" fill="#000" />
            <ellipse cx="60" cy="50" rx="6" ry="8" fill="#000" />
            <ellipse cx="42" cy="47" rx="2" ry="3" fill="#FFF" />
            <ellipse cx="62" cy="47" rx="2" ry="3" fill="#FFF" />
            <path d="M50 58 L46 62 L54 62 Z" fill="#FF6B6B" />
            <path d="M50 62 Q45 68 40 65" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M50 62 Q55 68 60 65" stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
            <line x1="20" y1="55" x2="35" y2="57" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="20" y1="62" x2="35" y2="62" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="65" y1="57" x2="80" y2="55" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <line x1="65" y1="62" x2="80" y2="62" stroke="#000" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
};

// Simple logo component for the navbar
const Logo = (props: React.SVGAttributes<SVGElement>) => {
    return (
        <svg width='1em' height='1em' viewBox='0 0 324 323' fill='currentColor' xmlns='http://www.w3.org/2000/svg' {...props}>
            <rect
                x='88.1023'
                y='144.792'
                width='151.802'
                height='36.5788'
                rx='18.2894'
                transform='rotate(-38.5799 88.1023 144.792)'
                fill='currentColor'
            />
            <rect
                x='85.3459'
                y='244.537'
                width='151.802'
                height='36.5788'
                rx='18.2894'
                transform='rotate(-38.5799 85.3459 244.537)'
                fill='currentColor'
            />
        </svg>
    );
};

// Hamburger icon component
const HamburgerIcon = ({ className, ...props }: React.SVGAttributes<SVGElement>) => (
    <svg
        className={cn('pointer-events-none', className)}
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <path
            d="M4 12L20 12"
            className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
        />
        <path
            d="M4 12H20"
            className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
        />
        <path
            d="M4 12H20"
            className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
        />
    </svg>
);

// Types
export interface HeaderNavItem {
    href?: string;
    label: string;
    submenu?: boolean;
    type?: 'description' | 'simple' | 'icon';
    items?: Array<{
        href: string;
        label: string;
        description?: string;
        icon?: string;
    }>;
}

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
    logo?: React.ReactNode;
    logoHref?: string;
    navigationLinks?: HeaderNavItem[];
    userAvatar?: React.ReactNode;
}

// Default navigation links
const defaultNavigationLinks: HeaderNavItem[] = [
    { href: '/', label: 'Home' },
    { href: '/nutrition', label: 'Nutrition' },
    { href: '/recipes', label: 'Recipes' }, 
    { href: '/activity', label: 'Activity' },
    { href: '/weight', label: 'Weight' },
];

export const Header = forwardRef<HTMLElement, HeaderProps>(
    (
        {
            className,
            logo = <Logo />,
            navigationLinks = defaultNavigationLinks,
            userAvatar = <Avatar />,
            ...props
        },
        ref
    ) => {
        const [isMobile, setIsMobile] = useState(false);
        const containerRef = useRef<HTMLElement>(null);
        const navigate = useNavigate();

        useEffect(() => {
            const checkWidth = () => {
                if (containerRef.current) {
                    const width = containerRef.current.offsetWidth;
                    setIsMobile(width < 768); // 768px is md breakpoint
                }
            };

            checkWidth();

            const resizeObserver = new ResizeObserver(checkWidth);
            if (containerRef.current) {
                resizeObserver.observe(containerRef.current);
            }

            return () => {
                resizeObserver.disconnect();
            };
        }, []);

        // Combine refs
        const combinedRef = useCallback((node: HTMLElement | null) => {
            containerRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        }, [ref]);

        const handleNavigation = (href: string) => {
            navigate(href);
        };

        return (
            <header
                ref={combinedRef}
                className={cn(
                    'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 [&_*]:no-underline',
                    className
                )}
                {...props}
            >
                <div className="container mx-auto flex h-16 max-w-screen-2xl items-center justify-between gap-4">
                    {/* Left side */}
                    <div className="flex items-center gap-2">
                        {/* Mobile menu trigger */}
                        {isMobile && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        className="group h-9 w-9 hover:bg-accent hover:text-accent-foreground"
                                        variant="ghost"
                                        size="icon"
                                    >
                                        <HamburgerIcon />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-64 p-1">
                                    <NavigationMenu className="max-w-none">
                                        <NavigationMenuList className="flex-col items-start gap-0">
                                            {navigationLinks.map((link, index) => (
                                                <NavigationMenuItem key={index} className="w-full">
                                                    <button
                                                        onClick={() => handleNavigation(link.href || '/')}
                                                        className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer no-underline"
                                                    >
                                                        {link.label}
                                                    </button>
                                                </NavigationMenuItem>
                                            ))}
                                        </NavigationMenuList>
                                    </NavigationMenu>
                                </PopoverContent>
                            </Popover>
                        )}
                        {/* Main nav */}
                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => navigate("/")}
                                className="flex items-center space-x-2 text-primary hover:text-primary/90 transition-colors cursor-pointer"
                            >
                                <div className="text-2xl">
                                    {logo}
                                </div>
                                <span className="hidden font-bold text-xl sm:inline-block">fit-app</span>
                            </button>
                            {/* Navigation menu */}
                            {!isMobile && (
                                <NavigationMenu className="flex">
                                    <NavigationMenuList className="gap-1">
                                        {navigationLinks.map((link, index) => (
                                            <NavigationMenuItem key={index}>
                                                <button
                                                    onClick={() => handleNavigation(link.href || '/')}
                                                    className={cn(
                                                        navigationMenuTriggerStyle(), 
                                                        'cursor-pointer bg-transparent border-0 hover:bg-accent hover:text-accent-foreground'
                                                    )}
                                                >
                                                    {link.label}
                                                </button>
                                            </NavigationMenuItem>
                                        ))}
                                    </NavigationMenuList>
                                </NavigationMenu>
                            )}
                        </div>
                    </div>
                    {/* Avatar */}
                    <div className="flex items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="relative h-10 w-10 rounded-full p-0 hover:bg-accent hover:text-accent-foreground"
                            onClick={() => navigate("/user")}
                        >
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {userAvatar}
                            </div>
                        </Button>
                    </div>
                </div>
            </header>
        );
    }
);

Header.displayName = 'Header';

export { Logo, HamburgerIcon, Avatar };