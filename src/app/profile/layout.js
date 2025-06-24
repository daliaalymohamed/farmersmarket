export async function generateMetadata() {
    return {
        title: 'Profile Page | Farmer\'s Market',
        description: 'View profile information',
    };
}

export default function ProfileLayout({ children }) {
    return <>{children}</>;
}