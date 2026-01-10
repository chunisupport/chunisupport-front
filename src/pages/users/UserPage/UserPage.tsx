import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";

const UserPage = () => {
    const params = useParams<{ username: string }>();
    return (
        <>
            <Title>{params.username}さんのページ - Chunisupport</Title>
            <h1>User Page: {params.username}</h1>
        </>
    );
};

export default UserPage;
