# Farmers Market

Farmers Market is a [Next.js](https://nextjs.org) e-commerce application built using modern web technologies. It provides a platform for users to browse and purchase products, with an admin dashboard for managing the application.

## Technologies Used

- **[Next.js](https://nextjs.org):** A React framework for building server-rendered and statically generated web applications.
- **[Material-UI](https://mui.com):** A popular React UI framework for building responsive and accessible user interfaces.
- **[MongoDB](https://www.mongodb.com):** A NoSQL database for storing application data.
- **[Redux](https://redux.js.org):** A state management library for managing global application state.
- **[Redis](https://redis.io):** A key-value store for caching data
- **[MeliSearch](https://www.meilisearch.com/):** A platform to build, scale, and unify search and AI retrieval


## Prerequisites

Make sure you have the following installed on your system:

- **Node.js:** v22.11.0
- **npm:** Comes bundled with Node.js or use **yarn** as an alternative.


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

- **User Authentication:** Secure login and registration with JWT.
- **State Management:** Global state management using Redux Toolkit.
- **Responsive Design:** Built with Material-UI for a seamless experience across devices.
- **MongoDB Integration:** Store and manage user and product data.
- **Dynamic Routing:** Server-side rendering and dynamic routing with Next.js.
- **Admin Dashboard:** Manage products, users, and orders through an intuitive dashboard.
- **Dynamic Access Roles:** Role-based access control (RBAC) to manage permissions for different user roles (e.g., admin, editor, user).


## Folder Structure

- `src/app`: Contains the application pages, components, actions and api.
- `src/store`: Redux store and slices for state management.
- `src/lib`: Utility functions, API service files and localization.
- `src/services`: Backend service logic for user authentication and database interactions.
- `src/middlewares`: Contains custom middleware functions used across the application for authentication, authorization, input validation, and request handling.
- `src/models`: Defines Mongoose schemas and models for MongoDB collections. Each file corresponds to a database collection and enforces data structure, validation, and relationships.

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
- [Redis Documentation](https://redis.io) - Learn how to use Redis as a key-value store.



## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.