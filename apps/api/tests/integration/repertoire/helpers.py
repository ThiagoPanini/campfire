from httpx import AsyncClient


async def login(
    client: AsyncClient, email: str = "ada@campfire.test", password: str = "campfire123"
) -> tuple:
    response = await client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["accessToken"]
    return response, {"Authorization": f"Bearer {token}"}


WONDERWALL_PAYLOAD = {
    "songExternalId": "1109731",
    "songTitle": "Wonderwall",
    "songArtist": "Oasis",
    "songAlbum": "(What's the Story) Morning Glory?",
    "songReleaseYear": 1995,
    "songCoverArtUrl": "https://cdn.deezer.com/images/cover/wonderwall.jpg",
    "instrument": "Acoustic Guitar",
    "proficiency": "practicing",
}
