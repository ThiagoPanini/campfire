from httpx import AsyncClient


async def login(
    client: AsyncClient, email: str = "ada@campfire.test", password: str = "campfire123"
):
    response = await client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["accessToken"]
    return response, {"Authorization": f"Bearer {token}"}
