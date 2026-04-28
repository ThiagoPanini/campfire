from argon2 import PasswordHasher


def main() -> None:
    print(PasswordHasher(time_cost=2, memory_cost=19_456, parallelism=1).hash("campfire123"))


if __name__ == "__main__":
    main()
