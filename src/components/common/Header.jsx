"use client";
import Image from "next/image";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Icons } from "@/components/icons/Index";
import { useCurrentUser } from "@/utils/currentUser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useApi from "@/utils/useApi";
import { useCartStore } from "@/zustand/cart";
import { FaShoppingCart } from "react-icons/fa";


// Move productCategories outside component to prevent recreation
const PRODUCT_CATEGORIES = [
    { name: "SeaTrials / Herndon", path: "/products" },
    { name: "Graduations / Commissioning", path: "/products" },
    { name: "Plebe Summer", path: "/products" },
    { name: "Studio Collection", path: "/products" },
];

export default function Header() {
    console.log("Header");

    const [isOpen, setIsOpen] = useState(false);
    const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
    const hoverRef = useRef(false);
    const router = useRouter();
    const { user, loadingUser } = useCurrentUser();
    const [categories, setCategories] = useState([]);
    const { data, loading: apiLoading, error: apiError } = useApi({
        url: "/api/users/events/category",
        type: "mount",
        method: "GET",
        requiresAuth: false,
    });
    const cartCount = useCartStore((state) => state.cart.reduce((total, item) => total + item.quantity, 0));

    // Update categories when data is received
    useEffect(() => {
        if (data) {
            // Handle both direct array and wrapped response
            const categoriesData = Array.isArray(data) ? data : (data.data || []);
            if (Array.isArray(categoriesData)) {
                // Map categories to include path from slug
                const mappedCategories = categoriesData.map((category) => ({
                    name: category.name,
                    path: category.slug ? `/products/${category.slug}` : "/products",
                    slug: category.slug,
                }));
                setCategories(mappedCategories);
            }
        }
    }, [data]);
    const toggleMenu = useCallback(() => {
        setIsOpen(prev => !prev);
    }, []);

    const logout = useCallback(() => {
        // Clear cookie
        document.cookie = "token=; path=/; max-age=0";
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.clear();
        // Clear sessionStorage as well
        sessionStorage.removeItem("token");
        sessionStorage.clear();
        // Reload page to reset state
        window.location.href = "/login";
    }, []);

    const productCategories = useMemo(() => PRODUCT_CATEGORIES, []);

    const handleMouseEnter = useCallback(() => {
        if (!hoverRef.current) {
            hoverRef.current = true;
            setIsProductsDropdownOpen(true);
        }
    }, []);

    const handleMouseLeave = useCallback(() => {
        hoverRef.current = false;
        setIsProductsDropdownOpen(false);
    }, []);

    const handleDropdownClick = useCallback(() => {
        setIsProductsDropdownOpen(false);
    }, []);

    return (
        <header className="header">
            <div className="container">
                <nav className={`navs-wrapper flex items-center justify-between`}>
                    <ul className={`primary-navs mx-auto flex justify-between items-center ${isOpen ? 'active' : ''} grow-1`}>
                        <li><Link className="primary-nav-link" href="/">Home</Link></li>
                        <li
                            className="relative dropdown-li"
                            onMouseEnter={handleMouseEnter}
                            onMouseLeave={handleMouseLeave}
                        >
                            <Link className="primary-nav-link" href="#">Products</Link>

                            {isProductsDropdownOpen && (
                                <div className="dropdown absolute left-0 top-full w-64 z-50">
                                    <div className="rounded-xl border border-gray-600 bg-black shadow-theme-lg">
                                        <ul className="py-2 dropdown-ul">
                                            {apiLoading ? (
                                                <li className="px-4 py-2 text-sm text-gray-300">Loading categories...</li>
                                            ) : categories.length > 0 ? (
                                                categories.map((category, index) => (
                                                    <li key={index}>
                                                        <Link
                                                            href={category.path}
                                                            className="block px-4 py-2 text-sm text-[#828282] hover:bg-gray-800 transition-colors"
                                                            onClick={handleDropdownClick}
                                                        >
                                                            {category.name}
                                                        </Link>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="px-4 py-2 text-sm text-gray-300">No categories available</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </li>
                        <li><Link className="primary-nav-link" href="/">Photo Access</Link></li>
                        <li className="md-none">
                            <Link href="/">
                                <Image src="/images/logo.png" alt="Logo" width={100} height={100}/>
                            </Link>
                        </li>
                        <li><Link className="primary-nav-link" href="/about-us">About Us</Link></li>
                        <li><Link className="primary-nav-link" href="/contact">Contact</Link></li>
                        <li><Link className="primary-nav-link" href="/blog">Blog</Link></li>
                    </ul>
                    <Link href="/">
                        <Image src="/images/logo.png" alt="Logo" className="block md:hidden" width={100} height={100} />
                    </Link>
                    <div className="flex items-center gap-2">
                        {loadingUser ? (
                            <span className="text-sm text-gray-600">Loading...</span>
                        ) : user ? (
                            <>
                                <Link
                                    href="/account"
                                    className="text-sm font-medium btn btn-primary"
                                >
                                    My Account
                                </Link>
                                <button
                                    onClick={logout}
                                    className="btn btn-secondary"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <>
                                <Link className="btn btn-secondary" href="/login">Login</Link>
                                <Link className="btn btn-primary" href="/signup">Signup</Link>
                            </>
                        )}
                        <Link href="/cart" className="relative p-2 text-white hover:text-[#061246] transition-colors">
                            <FaShoppingCart className="text-[32px]" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-[#f1e712] text-black font-bold rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button className="menu-icon" onClick={toggleMenu}>
                            {isOpen ? <Icons.close className="text-[24px]" /> : <Icons.menu className="text-[24px]" />}
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
}
