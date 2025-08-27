export async function generateMetadata() {
    return {
        title: 'Vendors | Farmer\'s Market',
        description: 'Manage Vendors - Farmer\'s Market Admin',
    };
}

export default function VendorsLayout({ children }) {
    return <>{children}</>;
}