export async function generateMetadata() {
    return {
        title: 'Warehouse Details | Farmer\'s Market',
        description: 'View warehouse information',
    };
}

export default function WarehouseLayout({ children }) {
    return <>{children}</>;
}