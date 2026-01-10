import { useParams } from "@solidjs/router";

const UserPage = () => {
    const params = useParams<{ username: string }>();
    return (
        <h1>User Page: {params.username}</h1>
    );
};

export default UserPage;
