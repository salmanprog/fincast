"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/zustand/cart";
import { FaShoppingCart } from "react-icons/fa";

interface Product {
    id: number;
    slug: string;
    title: string;
    price: string;
    image: string;
    eventDate?: string;
}

export default function ProductCard({ product }: { product: Product }) {
    const { cart, addToCart } = useCartStore();

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({
            ...product,
            image: '/images/place-holder-img.png'
        });
    };

    return (
        <div className="product-card group h-full flex flex-col bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
            <div className="product-card-image relative aspect-[4/3] overflow-hidden">
                <Image 
                    src={product.image} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" 
                    alt={product.title} 
                    width={400} 
                    height={400} 
                />
            </div>
            <div className="product-card-content p-4 flex-grow flex flex-col">
                {product.eventDate && (
                    <span className="text-xs font-semibold text-gray-500 mb-1 block">Event Held: {product.eventDate}</span>
                )}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{product.title}</h3>
                <p className="text-md font-medium text-gray-600 mb-4">{product.price}</p>
                
                <div className="mt-auto space-y-4 pt-4 flex flex-col items-center">
                    <span className="text-sm font-semibold text-gray-700">To add to cart</span>
                    {cart.some(item => item.id === product.id) ? (
                        <Link
                            href="/cart"
                            className="w-full btn btn-primary py-3 text-center text-lg font-bold shadow-md hover:shadow-lg transition-all"
                        >
                            Edit to cart
                        </Link>
                    ) : (
                        <button 
                            onClick={handleAddToCart}
                            className="btn btn-primary bg-[#FFEB3B] hover:bg-[#FDD835] text-black w-full inline-flex items-center justify-center gap-2 py-2 px-6 rounded shadow-md transform active:scale-95 transition-all text-sm font-bold uppercase"
                        >
                             <div className="relative w-8 h-8 mr-2">
                                <Image 
                                    src="/images/waldo-logo.png" 
                                    alt="cart" 
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span>Click Me</span>
                        </button>
                    )}

                    <Link 
                        href={`/products/${product.slug}/gallery`} 
                        className="block w-full text-center py-2 px-4 text-primary hover:underline font-medium text-sm transition-colors"
                    >
                        View Gallery
                    </Link>
                </div>
            </div>
        </div>
    );
}
