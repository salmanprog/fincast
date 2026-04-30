'use client';
import Link from "next/link";

export default function Sec({
    title,
    sectionClass,
    href,
    backgroundImage
}: {
    title: string;
    sectionClass?: string;
    href: string;
    backgroundImage?: string | null;
}) {
    return (
        <Link href={href || "/"}>
            <div className={`blog-card group  ${sectionClass || ''}`}>
                <div className="blog-card-image">
                    {backgroundImage ? (
                        <div
                            className="w-full h-[264px] rounded"
                            style={{
                                backgroundImage: `url(${backgroundImage})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat'
                            }}
                        />
                    ) : (
                        <div className="w-full h-[264px] bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-gray-400">No Image</span>
                        </div>
                    )}
                </div>
                <div className="blog-card-content">
                    <h3 className="blog-card-title line-clamp-2">{title}</h3>
                </div>
                <div className="blog-hidden-content ">
                    <div className="btn btn-primary w-full flex justify-center items-center gap-2">
                        <span>Read More</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    )
}