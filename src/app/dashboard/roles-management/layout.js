export async function generateMetadata() {
    return {
        title: 'Roles Management | Farmer\'s Market',
        description: 'Manage roles - Farmer\'s Market Admin',
    };
}

export default function RolesLayout({ children }) {
    return <>{children}</>;
}