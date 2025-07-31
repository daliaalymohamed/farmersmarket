export async function generateMetadata() {
    return {
        title: 'Products | Farmer\'s Market',
        description: 'Manage Products - Farmer\'s Market Admin',
    };
}

export default function ProductsLayout({ children }) {
    return <>{children}</>;
}