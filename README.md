# Next.js E-commerce Example

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app). It is an e-commerce application built using modern web technologies.

## Technologies Used

- **[Next.js](https://nextjs.org):** A React framework for building server-rendered and statically generated web applications.
- **[Material-UI](https://mui.com):** A popular React UI framework for building responsive and accessible user interfaces.
- **[MongoDB](https://www.mongodb.com):** A NoSQL database for storing application data.
- **[Redux](https://redux.js.org):** A state management library for managing global application state.

## Getting Started

First, clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd next_ecommerce_example
npm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- User authentication and registration with JWT.
- State management using Redux Toolkit.
- Responsive design with Material-UI components.
- Integration with MongoDB for storing user and product data.
- Dynamic routing and server-side rendering with Next.js.

## Folder Structure

- `src/app`: Contains the application pages and components.
- `src/store`: Redux store and slices for state management.
- `src/lib`: Utility functions and API service files.
- `src/services`: Backend service logic for user authentication and database interactions.

## Environment Variables

To run this project, you need to set up the following environment variables in a `.env` file:

```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
NEXT_PUBLIC_API_BASE_URL=<your-api-base-url>
```

## Learn More

To learn more about the technologies used in this project, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API.
- [Material-UI Documentation](https://mui.com) - Learn how to use Material-UI components.
- [MongoDB Documentation](https://www.mongodb.com/docs) - Learn how to use MongoDB as a database.
- [Redux Toolkit Documentation](https://redux-toolkit.js.org) - Learn how to manage state with Redux Toolkit.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.