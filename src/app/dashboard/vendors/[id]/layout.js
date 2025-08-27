export async function generateMetadata() {
    return {
        title: 'Vendor Details | Farmer\'s Market',
        description: 'View vendor information',
    };
}

export default function VendorLayout({ children }) {
    return <>{children}</>;
}