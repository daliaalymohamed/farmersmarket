export async function generateMetadata() {
    return {
        title: 'Online Store | Shop Dairy Products, Fruits & More | Farmer\'s Market',
        description: 'Buy high-quality products at great prices. Free shipping on all orders.',
    };
}

export default function HomeLayout({ children }) {
    return <>{children}</>;
}