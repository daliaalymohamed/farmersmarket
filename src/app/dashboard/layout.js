// This is a server component that provides a layout for the dashboard pages.
export async function generateMetadata() {
    // For root dashboard route
    return {
        title: 'Dashboard | Farmer\'s Market',
        description: `Farmer's Market Admin Dashboard`,
    };
}

export default function DashboardLayout({ children }) {
    return <>{children}</>;
}