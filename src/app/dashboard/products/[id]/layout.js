export async function generateMetadata() {
    return {
        title: 'Product Details | Farmer\'s Market',
        description: 'View product information',
    };
}

export default function ProductLayout({ children }) {
    return <>{children}</>;
}