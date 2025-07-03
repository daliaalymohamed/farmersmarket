export async function generateMetadata() {
    return {
        title: 'Categories | Farmer\'s Market',
        description: 'Manage Categories - Farmer\'s Market Admin',
    };
}

export default function CategoriesLayout({ children }) {
    return <>{children}</>;
}