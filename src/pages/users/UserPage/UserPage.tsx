import { useParams } from "@solidjs/router";
import { Title } from "@solidjs/meta";
import { API_BASE_URL } from "../../../config";


const UserPage = () => {
    const params = useParams<{ username: string }>();
    return (
        <>
            <Title>{params.username}さんのページ - Chunisupport</Title>
            <h1>User Page: {params.username}</h1>
            <p>API Base URL: {API_BASE_URL}</p>
        </>
    );
};

export default UserPage;
