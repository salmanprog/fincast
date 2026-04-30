export default function InnerBanner({ bannerClass, title }: { bannerClass: string, title: string }) {
    return (
        <section className={`inner-banner ${bannerClass}`}>
            <div className="container">
                <h1 className="hd-lg">{title}</h1>
            </div>
        </section>
    )
}