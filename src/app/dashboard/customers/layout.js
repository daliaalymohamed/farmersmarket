export async function generateMetadata() {
    return {
        title: 'Customers | Farmer\'s Market',
        description: 'Manage Customers - Farmer\'s Market Admin',
    };
}

export default function CustomersLayout({ children }) {
    return <>{children}</>;
}