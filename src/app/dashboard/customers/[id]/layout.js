export async function generateMetadata() {
    return {
        title: 'Customer Details | Farmer\'s Market',
        description: 'View customer information',
    };
}

export default function CustomerLayout({ children }) {
    return <>{children}</>;
}